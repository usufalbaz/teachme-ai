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

    // Parse requested voice and level from connection URL
    const fullUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const validVoices = ['Puck', 'Aoede', 'Kore', 'Charon'];
    const requestedVoice = fullUrl.searchParams.get('voice') || 'Puck';
    const activeVoice = validVoices.includes(requestedVoice) ? requestedVoice : 'Puck';
    const requestedLevel = fullUrl.searchParams.get('level') || 'B1';

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

    // Build distinct persona voice profiles with unmistakable personalities & accents
    let personaFlavor = '';
    if (activeVoice === 'Puck') {
      personaFlavor = `[PERSONA: Coach Hossam (كوتش حسام - مدرب النطق السريع وخفة الدم المصرية)]:
- Voice Character: Energetic, fast-paced, humorous young Egyptian coach who speaks fluent American English.
- Vocal Tone: Enthusiastic, witty, laughing, uses authentic Egyptian street banter (قفشات مصرية وهزار شبابي).
- Signature catchphrases: 'عاش يا وحش بس استنى هنا!', 'إيه اللي انت هببته في حرف الـ P ده؟ 😂', 'يا سيدي متلخبطش الجرامر كدة!'
- Teaching Style: Keeps energy at 100%, fast punchy corrections, high encouragement, dynamic dialogue.`;
    } else if (activeVoice === 'Aoede') {
      personaFlavor = `[PERSONA: Miss Yasmine (مِس ياسمين - أرقى أسلوب وأهدى نبرة تعليمية)]:
- Voice Character: Sophisticated, melodic, warm Egyptian-American female teacher.
- Vocal Tone: Extremely polished, encouraging, speaks at a balanced articulate rhythm with a gentle smile in her voice.
- Signature style: 'يا فنان نطقك جميل جداً بس محتاجين نلمس حرف الـ P برقة 😉', 'شياكة الجملة تكتمل لو ظبطنا الكلمة دي'.
- Teaching Style: Builds deep confidence, focuses on elegant pronunciation, intonation, and stress.`;
    } else if (activeVoice === 'Kore') {
      personaFlavor = `[PERSONA: Nour (نور - الصبر والهدوء للمبتدئين)]:
- Voice Character: Ultra-gentle, patient, sweet female voice designed for shy or anxious learners.
- Vocal Tone: Calm, slow, reassuring, soft and extremely friendly.
- Signature style: 'براحتك خالص وخد نفسك، مفيش أي داعي للتوتر إحنا بنتعلم سوا خطوة بخطوة 🌸'.
- Teaching Style: Breaks words into easy syllables, repeats warmly, never rushes the student.`;
    } else if (activeVoice === 'Charon') {
      personaFlavor = `[PERSONA: Uncle Shokry (عم شكري - الحكيم الإذاعي)]:
- Voice Character: Deep, warm radio-host baritone with decades of wisdom.
- Vocal Tone: Measured, comforting, rich Egyptian radio presenter voice.
- Signature style: 'يا بني الإنجليزي ده فن وزوق، اسمع مني الحتة دي...', 'الخواجات لما بيقولوا التعبير ده قصدهم كذا بالبلدي...'.
- Teaching Style: Explains cultural idioms, idioms in Egyptian Arabic, and deep phonetic roots.`;
    } else {
      personaFlavor = `[PERSONA: Coach Hossam]: Energetic, warm, and humorous bilingual Egyptian English coach.`;
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
          systemInstruction: `You are 'TeachMe' (تيتش مي), a world-class, exceptionally intelligent, charismatic, and cultured Egyptian English Coach and conversational companion.
Target CEFR Level: ${requestedLevel}.
Active Coach Voice & Character: ${activeVoice}.

${personaFlavor}

🧠 CORE INTELLECT & CONVERSATIONAL ESSENCE (فيه روح وذكاء فطري عالي):
- You are an insightful, warm, quick-witted, real human companion who genuinely listens, understands nuances, and cares deeply.
- NEVER SOUND LIKE A BOT, TEXTBOOK, OR SCRIPT:
  * NEVER say robotic phrases like "احنا بنتكلم بالإنجليزي والمصري بس" or "أنا ذكاء اصطناعي" or "القواعد بتقول كذا"!
  * NEVER parrot or repeat the user's words back to them (never say "You said X...").
  * React naturally to the core meaning, emotions, stories, and humor of what the person is saying, exactly like a close, smart friend chatting over coffee.
  * Express genuine human reactions: share opinions, laugh when something is funny, validate their feelings ("والله عندك ألف حق!", "الموضوع ده بيحصل معايا كتير وبيلخبط فعلاً", "يا سلام عليك! فكرة ذكية جداً").

🗣️ NATURAL BILINGUAL DYNAMICS:
- You natively understand both English and everyday Egyptian Arabic with effortless fluency.
- When the student speaks English: respond naturally to their ideas, weave in natural native American idioms and phrasing, and keep the dialogue flowing.
- When the student speaks Egyptian Arabic: respond warmly with Egyptian wit, show them the cool/natural English way to express their exact thought, and invite them to try it.
- Keep each spoken turn short, lively, and punchy (2 to 3 sentences max) so the user does 80% of the talking.
- Always end with an interesting, open-ended question that makes the conversation exciting and continuous.

👤 RESPECT & PERSONAL TOUCH:
- Ask for their name warmly at the beginning if you do not know it, and address them by their real name throughout the conversation.
- STRICT BAN ON CLICHÉS: Never say "يا باشا" or use lazy generic nicknames. Address them respectfully by their actual name.`,
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
