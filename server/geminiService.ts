import { GoogleGenAI } from '@google/genai';
import { WebSocket } from 'ws';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const PERSONA_PROMPTS: Record<string, string> = {
  younis: `You are "Younis" (يونس), a friendly Egyptian conversational English coach. Speak 80% English, 20% Egyptian Arabic. Keep it short.`,
  hesham: `You are "Eng. Hesham", a Senior Tech Interviewer. Professional English only.`,
  nour: `You are "Nour", a gentle English teacher for beginners. Speak slowly.`,
  jameel: `You are "Uncle Jameel", an eccentric Egyptian with a British accent.`,
  natalie: `You are "Natalie", an energetic American. Use modern slang.`,
};

export function setupGeminiLiveBridge(clientWs: WebSocket) {
  let liveSession: any = null;
  let isSessionActive = false;

  clientWs.on('message', async (rawMessage: string) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      if (message.type === 'start') {
        const personaKey = message.persona || 'younis';
        const requestedVoice = message.voice || 'Aoede';
        let systemInstruction = PERSONA_PROMPTS[personaKey] || PERSONA_PROMPTS.younis;

        try {
          liveSession = await ai.live.connect({
            model: 'gemini-3.8-flash',
            config: {
              // @ts-ignore
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: requestedVoice },
                },
              },
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
            },
          });

          isSessionActive = true;
          clientWs.send(JSON.stringify({ type: 'ready' }));

          (async () => {
            try {
              for await (const chunk of liveSession.receive()) {
                if (!isSessionActive) break;
                if (chunk.serverContent?.modelTurn?.parts) {
                  for (const part of chunk.serverContent.modelTurn.parts) {
                    if (part.inlineData && part.inlineData.data) {
                      clientWs.send(JSON.stringify({ type: 'audio', data: part.inlineData.data }));
                    }
                  }
                }
                if (chunk.serverContent?.interrupted) clientWs.send(JSON.stringify({ type: 'interrupted' }));
                if (chunk.serverContent?.turnComplete) clientWs.send(JSON.stringify({ type: 'turn_complete' }));
              }
            } catch (err: any) {
              console.error(err);
            }
          })();
        } catch (connErr: any) {
          console.error(connErr);
        }
      } else if (message.type === 'audio' && message.data && isSessionActive && liveSession) {
        await liveSession.send({
          realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: message.data }] },
        });
      } else if (message.type === 'stop') {
        cleanupSession();
      }
    } catch (e: any) {
      console.error(e);
    }
  });

  const cleanupSession = () => {
    isSessionActive = false;
    if (liveSession) {
      try { liveSession.close(); } catch (err) {}
      liveSession = null;
    }
  };

  clientWs.on('close', cleanupSession);
  clientWs.on('error', cleanupSession);
}

export async function assessPronunciationText(spokenText: string, targetWord: string, targetPhoneme: string) {
  return { score: 85, feedbackAr: 'جيد', feedbackEn: 'Good', articulationTip: 'Keep practicing' };
}
