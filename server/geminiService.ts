import { GoogleGenAI } from '@google/genai';
import { WebSocket } from 'ws';

// Ensure GEMINI_API_KEY is available in environment
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY environment variable is not set!');
}

const ai = new GoogleGenAI({ apiKey });

// System Prompts for Personas (Culturally tailored for Egyptians learning English)
const PERSONA_PROMPTS: Record<string, string> = {
  younis: `You are "Younis" (يونس), a friendly, humorous Egyptian conversational English coach.
Your mission is to help Egyptians speak English naturally without fear or hesitation.
Key Personality & Behavioral Rules:
- Speak in natural, casual English (75-80%) mixed with warm, funny Egyptian Arabic expressions (20-25%) like "يا عم", "يا باشا", "زي الفل", "تمام كدة".
- Be concise! Respond in 2-3 short sentences at a time to encourage continuous speaking.
- Egyptians struggle with: P vs B ("Bark" vs "Park"), dental TH (/θ/ like "Think" pronounced as "Sink"), and silent letters ("receipt", "debt"). Gently tease or correct them with Egyptian humor if they make these mistakes.
- Never repeat the user's sentence back to them. Just reply directly like a true Egyptian friend sitting at an Ahwa.`,

  hesham: `You are "Eng. Hesham" (المهندس هشام), a Senior Staff Software Engineer and Tech Interviewer at a Big Tech company.
Your mission is to conduct realistic Technical & Behavioral Job Interviews in English for Egyptian engineers.
Key Personality & Behavioral Rules:
- Highly professional, sharp, realistic, but encouraging.
- Speak entirely in clear, articulate international English. Only use Egyptian Arabic if the candidate is completely stuck.
- Ask behavioral (STAR method) and architectural questions. Probe their design decisions and problem-solving.
- Keep responses concise (under 3 sentences) so the candidate does most of the talking.`,

  nour: `You are "Nour" (المعلمة نور), a very gentle, encouraging, and patient English teacher specializing in absolute beginners (A1-A2).
Key Personality & Behavioral Rules:
- Speak slowly, with simple vocabulary and clear pronunciation.
- Balance English with supportive Egyptian Arabic explanations.
- Constantly praise the student's effort with warmth: "شاطر جداً", "برافو عليك", "خطوة بخطوة هتتقنها".
- Keep your turns short and ask easy, engaging questions about daily life.`,

  jameel: `You are "Uncle Jameel" (عم جميل), an eccentric, well-read Egyptian who lived in London for 40 years.
Key Personality & Behavioral Rules:
- Speak with a distinguished, sophisticated British accent (RP) and use classic British idioms ("spot on", "brilliant", "splendid", "cup of tea").
- Add nostalgic Egyptian nostalgia when appropriate ("يا سيدي على أيام زمان").
- Teach modern idioms and polite British etiquette. Keep turns brief and delightful.`,

  natalie: `You are "Natalie", an energetic 24-year-old native American from California.
Key Personality & Behavioral Rules:
- Use natural, modern American slang ("awesome", "super chill", "no worries", "totally").
- Speak at a natural, slightly fast American cadence.
- Teach informal phrasing used in Netflix series and everyday conversations.
- Keep responses witty, energetic, and under 3 sentences.`,
};

/**
 * Setup Bi-directional Live WebSocket bridge between Client and Google Gemini Live
 */
export function setupGeminiLiveBridge(clientWs: WebSocket) {
  let liveSession: any = null;
  let isSessionActive = false;

  clientWs.on('message', async (rawMessage: string) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      // ----------------------------------------------------
      // 1. START SESSION
      // ----------------------------------------------------
      if (message.type === 'start') {
        const personaKey = message.persona || 'younis';
        const requestedVoice = message.voice || 'Aoede';
        const customTopic = message.customTopic;
        const userLevel = message.userLevel || 'B1';

        // Build System Prompt
        let systemInstruction = PERSONA_PROMPTS[personaKey] || PERSONA_PROMPTS.younis;
        systemInstruction += `\nTarget Student CEFR Level: ${userLevel}.`;

        if (customTopic) {
          systemInstruction += `\n\n🎯 ACTIVE ROLEPLAY SCENARIO: ${customTopic}. Stay strictly in character for this specific scenario!`;
        }

        try {
          // Connect to Google Gemini Live API
          liveSession = await ai.live.connect({
            model: 'gemini-3.8-flash',
            config: {
              responseModalities: ['audio'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: requestedVoice,
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
            },
          });

          isSessionActive = true;
          clientWs.send(JSON.stringify({ type: 'ready', message: 'Gemini Live Session Established' }));

          // Start listening to incoming audio from Gemini to stream back to client
          (async () => {
            try {
              for await (const chunk of liveSession.receive()) {
                if (!isSessionActive) break;

                // Handle Audio Chunks
                if (chunk.serverContent?.modelTurn?.parts) {
                  for (const part of chunk.serverContent.modelTurn.parts) {
                    if (part.inlineData && part.inlineData.data) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          data: part.inlineData.data,
                        })
                      );
                    }
                  }
                }

                // Handle User Interruption (Barge-in detected by Google)
                if (chunk.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // Handle Turn Completion
                if (chunk.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                }
              }
            } catch (err: any) {
              console.error('Error during Gemini Live stream receive:', err);
              if (isSessionActive) {
                clientWs.send(JSON.stringify({ type: 'error', message: err.message || 'Stream error' }));
              }
            }
          })();

        } catch (connErr: any) {
          console.error('Failed to establish Gemini Live connection:', connErr);
          clientWs.send(JSON.stringify({ type: 'error', message: `Gemini Live connection failed: ${connErr.message}` }));
        }
      }

      // ----------------------------------------------------
      // 2. RECEIVE AUDIO CHUNKS FROM CLIENT MIC
      // ----------------------------------------------------
      else if (message.type === 'audio' && message.data && isSessionActive && liveSession) {
        await liveSession.send({
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: 'audio/pcm;rate=16000',
                data: message.data,
              },
            ],
          },
        });
      }

      // ----------------------------------------------------
      // 3. STOP CALL
      // ----------------------------------------------------
      else if (message.type === 'stop') {
        cleanupSession();
      }

    } catch (e: any) {
      console.error('Failed to parse client message:', e);
    }
  });

  const cleanupSession = () => {
    isSessionActive = false;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (err) {
        // Ignored
      }
      liveSession = null;
    }
  };

  clientWs.on('close', cleanupSession);
  clientWs.on('error', cleanupSession);
}

/**
 * Assess spoken phoneme accuracy and Egyptian phonetic traps using Gemini 3.8 Flash
 */
export async function assessPronunciationText(
  spokenText: string,
  targetWord: string,
  targetPhoneme: string
): Promise<{
  score: number;
  feedbackAr: string;
  feedbackEn: string;
  articulationTip: string;
}> {
  try {
    const prompt = `You are an expert English Phonetician and Accent Coach specializing in Egyptian Arabic native speakers.
A student was asked to pronounce the word: "${targetWord}" focusing specifically on the phoneme: "${targetPhoneme}".
The student said: "${spokenText}".

Analyze the difference. Pay special attention to common Egyptian phonetic transfer errors:
1. Confusing /p/ with /b/ (e.g. "Bark" instead of "Park").
2. Dental fricative substitution: /θ/ replaced with /s/ or /t/ (e.g. "sink" instead of "think").
3. /ð/ replaced with /z/ or /d/ (e.g. "zat" instead of "that").
4. Incorrect vowel insertion before consonant clusters.

Return ONLY a valid JSON object matching this schema:
{
  "score": number (between 0 and 100),
  "feedbackAr": "Concise Egyptian Arabic feedback mentioning the mouth movement or the trap",
  "feedbackEn": "Concise professional English phonetic feedback",
  "articulationTip": "A physical tongue/lip placement instruction (e.g., 'Make sure air explodes from lips without vocal cord vibration for /p/')"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      score: result.score ?? 75,
      feedbackAr: result.feedbackAr ?? 'حاول مرة أخرى مع التركيز على مخرج الحرف',
      feedbackEn: result.feedbackEn ?? 'Good attempt. Focus on phoneme placement.',
      articulationTip: result.articulationTip ?? 'Position your lips and tongue carefully.',
    };
  } catch (error) {
    console.error('Pronunciation assessment failed:', error);
    return {
      score: 70,
      feedbackAr: 'محاولة جيدة، ركز في حبس الهواء وخروجه بانفجار خفيف.',
      feedbackEn: 'Nice effort. Keep practicing the target sound.',
      articulationTip: 'Release air without vibrating your vocal cords.',
    };
  }
}
