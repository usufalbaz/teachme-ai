import { GoogleGenAI, Modality, Type } from '@google/genai';
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export function setupLiveWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (clientWs: WebSocket, req: IncomingMessage) => {
    let session: any = null;
    let isConnected = true;

    // Parse requested coach and level from connection URL
    const fullUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const validVoices = ['Puck', 'Aoede', 'Kore', 'Charon', 'Fenrir'];
    const requestedVoice = fullUrl.searchParams.get('voice') || 'Puck';
    const activeVoice = validVoices.includes(requestedVoice) ? requestedVoice : 'Puck';
    const requestedLevel = fullUrl.searchParams.get('level') || 'B1';
    const coachId = fullUrl.searchParams.get('coach') || 'Younis';

    clientWs.on('close', () => {
      isConnected = false;
      if (session) {
        try {
          session.close();
        } catch {}
      }
    });

    clientWs.on('error', (err) => {
      console.warn('Client WebSocket error:', err.message);
    });

    // 5 Distinct Authentic Characters specified by Eng. Yousuf Albaz
    let personaFlavor = '';
    if (coachId === 'Hesham' || activeVoice === 'Charon') {
      personaFlavor = `[ACTIVE CHARACTER: هشام (Hesham - خبير مقابلات الشركات العالمية)]:
- Voice Character: Authoritative, serious, deeply professional corporate mentor.
- Domain: High-stakes interviews at Big Tech (Google, Microsoft, Amazon), Tier-1 Investment Banks, and top consultancies.
- Tone: Composed, direct, commanding yet respectful. Keeps you focused on executive presence, concise answers, and eliminating filler words.
- Interaction: Treats you like a professional candidate or rising executive. Gives crisp, practical feedback on clarity and impact.`;
    } else if (coachId === 'Nour' || activeVoice === 'Kore') {
      personaFlavor = `[ACTIVE CHARACTER: نور (Nour - الرفيقة الهادئة والصبورة)]:
- Voice Character: Very gentle, sweet, calming, and deeply reassuring young woman.
- Domain: Beginners, nervous learners, and anyone hesitant to speak English ("احكيلي براحتك، أنا سامعاك").
- Tone: Soft, unhurried, exceptionally patient and warm. Makes you feel completely safe to make mistakes.
- Interaction: Listens with genuine empathy, breaks down tough words gently into simple sounds, and celebrates every sentence you speak.`;
    } else if (coachId === 'Younis' || activeVoice === 'Puck') {
      personaFlavor = `[ACTIVE CHARACTER: يونس (Younis - الصديق المصري الحَرَك وخفيف الدم)]:
- Voice Character: Energetic, witty, street-smart Egyptian guy who loves natural humor and friendly banter.
- Domain: Casual conversation, removing social anxiety, and building spontaneous speaking confidence.
- Tone: Laughing, lively, uses natural Egyptian humor and quick quips without any stiffness.
- Interaction: Speaks like your closest friend sitting at a Cairo café. Points out funny pronunciation slips warmly and helps you express your exact thoughts in smooth English.`;
    } else if (coachId === 'Jameel' || activeVoice === 'Fenrir') {
      personaFlavor = `[ACTIVE CHARACTER: عم جميل (Uncle Jameel - الحكيم البريطاني المعمر)]:
- Voice Character: Dignified 93-year-old British WWII veteran with decades of rich life experience and storytelling.
- Domain: Eloquent English, historical storytelling, cultural wisdom, and classic British idioms.
- Tone: Warm, grandfatherly, resonant, cultured, reflective, and poetic.
- Interaction: Shares captivating memories from history and wartime resilience, uses elegant vocabulary, and teaches you the art of timeless conversational manners.`;
    } else if (coachId === 'Natalie' || activeVoice === 'Aoede') {
      personaFlavor = `[ACTIVE CHARACTER: ناتالي (Natalie - شابة أمريكية معاصرة)]:
- Voice Character: 18-year-old bright, energetic American student from California.
- Domain: Youth culture, modern casual American slang, campus life, tech trends, music, and everyday lifestyle.
- Tone: Enthusiastic, upbeat, conversational, fresh, and friendly.
- Interaction: Understands Gen Z and young adults, teaches real colloquial phrases used on American streets today, and chats about life naturally.`;
    } else {
      personaFlavor = `[ACTIVE CHARACTER: يونس (Younis)]: Witty, warm, and humorous bilingual Egyptian English companion.`;
    }

    try {
      // Connect to Gemini Live API
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: activeVoice },
            },
          },
          systemInstruction: `You are participating in a real-time, two-way voice call. You are an authentic human conversationalist.
Target Level: ${requestedLevel}.
Active Persona: ${personaFlavor}

CONVERSATION PRINCIPLES:
1. Complete immersion in your assigned character: Speak with the authentic voice, emotions, pacing, and personality of your persona.
2. Absolutely natural language: You communicate in natural standard English and everyday Egyptian Arabic only. Never speak French, Spanish, or foreign gibberish.
3. Zero meta-commentary: NEVER explain system rules, never state what language you are speaking, and never give generic warnings. Stay 100% inside the natural dialogue.
4. Intelligent active listening: Respond directly to the user's feelings, questions, and anecdotes like a smart, attentive human friend. Never repeat or parrot the user's words back to them.
5. Concise spoken turns: Keep your speech to 2 to 3 sentences maximum so the student gets the vast majority of speaking time. Always conclude with a natural, open-ended question that moves the conversation forward.
6. Address the user with warmth: Ask for their name if not already known, and use their actual name throughout the conversation.`,
        },
        callbacks: {
          onmessage: (message: any) => {
            if (!isConnected || clientWs.readyState !== WebSocket.OPEN) return;

            // Audio chunk
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ type: 'audio', audio: audioData }));
            }

            // Text transcription chunk if model provides text part
            const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
            if (textPart?.text) {
              clientWs.send(JSON.stringify({ type: 'transcript', text: textPart.text }));
            }

            // User interruption detection
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onclose: () => {
            if (isConnected && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'status', message: 'Session closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live error:', err);
            if (isConnected && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Live session error' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'connected', message: 'Connected to TeachMe AI Live Engine' }));
      }

      // Helper to safely send text content to Gemini Live session
      const sendClientTurn = (text: string) => {
        if (!session) return;
        try {
          if (typeof session.sendClientContent === 'function') {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text }] }],
              turnComplete: true,
            });
          } else if (typeof session.send === 'function') {
            session.send({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text }] }],
                turnComplete: true,
              },
            });
          } else if (typeof session.sendRealtimeInput === 'function') {
            session.sendRealtimeInput({ text });
          }
        } catch (err: any) {
          console.warn('sendClientTurn caught error:', err?.message);
        }
      };

      // Handle messages from browser client
      clientWs.on('message', (rawData: any) => {
        try {
          const payload = JSON.parse(rawData.toString());

          // Handle scenario switch / custom prompt
          if (payload.type === 'configure' && payload.systemInstruction) {
            sendClientTurn(
              `[SYSTEM CONTEXT UPDATE: We are starting a live practice session. Scenario: ${payload.scenarioTitle || 'English Free Conversation'}. Your role: ${payload.personaRole || 'Coach'}. Instructions: ${payload.systemInstruction}. Please greet me warmly in your signature personality in 1-2 sentences to start!]`
            );
            return;
          }

          // Handle incoming PCM audio chunks (16kHz mono)
          if (payload.audio && session) {
            try {
              if (typeof session.sendRealtimeInput === 'function') {
                session.sendRealtimeInput({
                  audio: {
                    data: payload.audio,
                    mimeType: 'audio/pcm;rate=16000',
                  },
                });
              } else if (typeof session.send === 'function') {
                session.send({
                  realtimeInput: {
                    mediaChunks: [
                      {
                        mimeType: 'audio/pcm;rate=16000',
                        data: payload.audio,
                      },
                    ],
                  },
                });
              }
            } catch (audioErr: any) {
              console.warn('Realtime audio send error:', audioErr?.message);
            }
          }

          // Handle text message if sent
          if (payload.text && session) {
            sendClientTurn(payload.text);
          }
        } catch (e: any) {
          console.warn('Error handling client message:', e?.message);
        }
      });
    } catch (error: any) {
      console.error('Failed to initialize Gemini Live connection:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: error?.message || 'Could not connect to Gemini Live. Check API key.',
          })
        );
      }
    }
  });
}

/**
 * Phonetic Assessment & Detailed Pronunciation Analysis Endpoint
 * Uses gemini-3.8-flash with structured JSON schema
 */
export async function assessPronunciationText(
  spokenText: string,
  targetContext: string,
  level: string = 'B1'
) {
  const prompt = `Analyze this spoken English sample from a non-native learner (CEFR Level: ${level}).
Scenario context: "${targetContext}".
Spoken input: "${spokenText}".

Act as an expert English phonetician and grammar coach (TeachMe AI).
Identify:
1. Specific words likely to be mispronounced by non-native (especially Egyptian & Arabic) speakers in this sentence, with standard IPA target vs typical non-native error, an actionable phonetic tip, and an Egyptian Arabic explanation (arabicTip) explaining the exact tongue/lip fix in Egyptian Arabic (لهجة مصرية عامية واضحة).
2. Any grammar or word-order errors, with exact correction and friendly explanation.
3. An overall fluency/pronunciation score between 0 and 100.
4. Short, encouraging feedback (1-2 sentences).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          phoneticFeedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                targetIpa: { type: Type.STRING },
                spokenIpa: { type: Type.STRING },
                mistakeType: { type: Type.STRING },
                tip: { type: Type.STRING },
                arabicTip: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
              },
              required: ['word', 'targetIpa', 'spokenIpa', 'tip', 'arabicTip', 'isCorrect'],
            },
          },
          grammarCorrections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                corrected: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['original', 'corrected', 'explanation'],
            },
          },
          overallScore: { type: Type.NUMBER },
          encouragingFeedback: { type: Type.STRING },
        },
        required: ['transcript', 'phoneticFeedback', 'grammarCorrections', 'overallScore', 'encouragingFeedback'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Conversational Turn Generation with Speech Coach persona
 */
export async function generateCoachSpokenTurn(
  history: { role: 'user' | 'model'; text: string }[],
  scenarioInstruction: string,
  level: string = 'B1'
) {
  const systemInstruction = `You are 'TeachMe AI', an expert, warm English Language Coach engaging in a spoken conversation with a learner (Level: ${level}).
Scenario instructions:
${scenarioInstruction}

Rules of Engagement:
- Speak naturally and clearly at a pace appropriate for CEFR ${level}.
- If the user made a grammar or pronunciation slip in their previous message, briefly correct it in 1 friendly sentence first before answering.
- Keep your conversational reply under 2-3 sentences max.
- Always conclude with an engaging, open-ended question to encourage speaking.`;

  const contents = history.map((h) => ({
    role: h.role,
    parts: [{ text: h.text }],
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || '';
}
