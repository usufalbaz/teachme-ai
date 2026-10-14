import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LiveAudioPlayer, createPcmAudioRecorder } from '../services/geminiAudio';
import { RepeatMasterDrillModal } from './RepeatMasterDrillModal';
import { PhonemeVisualizer } from './PhonemeVisualizer';
import { VoiceSelectorModal } from './VoiceSelectorModal';
import { TopicExplorerModal } from './TopicExplorerModal';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface VoiceCallHubProps {
  onOpenIeltsTest?: () => void;
}

type PersonaKey = 'younis' | 'hesham' | 'nour' | 'jameel' | 'natalie';

interface PersonaInfo {
  id: PersonaKey;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  avatar: string;
  defaultVoice: string;
}

const PERSONAS: PersonaInfo[] = [
  {
    id: 'nour',
    nameAr: 'المعلمة نور',
    nameEn: 'Nour',
    roleAr: 'صبورة جداً مع المبتدئين خطوة بخطوة',
    roleEn: 'Gentle A1-A2 Beginner Coach',
    avatar: '🌸',
    defaultVoice: 'Kore',
  },
  {
    id: 'younis',
    nameAr: 'يونس المصري',
    nameEn: 'Younis',
    roleAr: 'صديقك للفضفضة والضحك بالإنجليزي',
    roleEn: 'Casual & witty conversationalist',
    avatar: '⚡',
    defaultVoice: 'Aoede',
  },
  {
    id: 'hesham',
    nameAr: 'المهندس هشام',
    nameEn: 'Hesham',
    roleAr: 'محاكي مقابلات Big Tech والشركات',
    roleEn: 'Senior Tech & System Design Interviewer',
    avatar: '👨‍💻',
    defaultVoice: 'Charon',
  },
  {
    id: 'jameel',
    nameAr: 'عم جميل',
    nameEn: 'Uncle Jameel',
    roleAr: 'لكنة بريطانية كلاسيكية فخمة',
    roleEn: 'Sophisticated British Accent & Idioms',
    avatar: '🎩',
    defaultVoice: 'Fenrir',
  },
  {
    id: 'natalie',
    nameAr: 'ناتالي الأمريكية',
    nameEn: 'Natalie',
    roleAr: 'سريعة ولغة شوارع وسينما أمريكية',
    roleEn: 'Fast-paced American Slang & Culture',
    avatar: '🗽',
    defaultVoice: 'Puck',
  },
];

const PERSONA_PROMPTS: Record<string, string> = {
  nour: 'You are "Nour", a very gentle, encouraging English tutor for beginners. Speak slowly, clearly, and warmly with simple words. Start the call by saying hello and asking how the student is doing.',
  younis: 'You are "Younis", a friendly, witty Egyptian English coach. Speak 80% natural English and 20% warm Egyptian slang. Keep turns very brief (1-2 sentences). Say a witty greeting to start.',
  hesham: 'You are "Eng. Hesham", a Big Tech technical interviewer. Ask insightful professional questions concisely. Greet the candidate professionally to begin.',
  jameel: 'You are "Uncle Jameel", a 93-year-old refined British gentleman. Greet the student with old-school British charm.',
  natalie: 'You are "Natalie", an energetic American youth from California. Use modern slang and say a high-energy "What\'s up!" to start.',
};

export const VoiceCallHub: React.FC<VoiceCallHubProps> = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();

  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('nour');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [activeTopic, setActiveTopic] = useState<{ title: string; prompt: string } | null>(null);

  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callStatusText, setCallStatusText] = useState<string>('جاهز للمكالمة');
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // API Key Storage
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('teachme_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');

  // Modals
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [topicModalOpen, setTopicModalOpen] = useState<boolean>(false);
  const [drillModalOpen, setDrillModalOpen] = useState<boolean>(false);
  const [drillTarget, setDrillTarget] = useState<{ word: string; phoneme: string }>({ word: 'passport', phoneme: 'p' });

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const stopRecorderRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isCalling) {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isCalling]);

  useEffect(() => {
    return () => {
      endVoiceCall();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectPersona = (p: PersonaInfo) => {
    if (isCalling) return;
    setSelectedPersona(p.id);
    setSelectedVoice(p.defaultVoice);
  };

  // Safe Bi-directional Live Call Engine
  const startVoiceCall = async () => {
    const activeKey = apiKey.trim();
    if (!activeKey) {
      setApiKeyModalOpen(true);
      return;
    }

    try {
      setCallStatusText(language === 'ar' ? 'جاري الاتصال بجوجل...' : 'Connecting to Google AI...');
      audioPlayerRef.current = new LiveAudioPlayer();

      // Official Google Multimodal Live Endpoint
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(activeKey)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setCallStatusText(language === 'ar' ? 'جاري تهيئة جلسة الذكاء الاصطناعي...' : 'Configuring AI session...');
        setIsCalling(true);

        // 1. Send Setup Handshake packet ONLY (Do NOT send mic audio yet!)
        const systemPrompt = `${PERSONA_PROMPTS[selectedPersona]} Student level: ${profile?.level || 'A1'}. ${
          activeTopic ? `Roleplay scenario: ${activeTopic.prompt}` : ''
        }`;

        const setupPayload = {
          setup: {
            model: 'models/gemini-2.0-flash-exp',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: selectedVoice,
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          },
        };
        ws.send(JSON.stringify(setupPayload));
      };

      ws.onmessage = async (event) => {
        try {
          let textData = event.data;
          if (textData instanceof Blob) {
            textData = await textData.text();
          }
          const msg = JSON.parse(textData);

          // 2. WAIT FOR setupComplete BEFORE STREAMING MIC AUDIO!
          if (msg.setupComplete) {
            setCallStatusText(language === 'ar' ? 'متصل - استمع وتحدث الآن' : 'Live Connected - Speak now');

            // Trigger AI to speak first greeting
            ws.send(JSON.stringify({
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [{ text: 'Hello! Please introduce yourself and start our conversation now.' }],
                  },
                ],
                turnComplete: true,
              },
            }));

            // Now, and only now, safely activate the microphone recorder!
            const stopRecorder = await createPcmAudioRecorder(
              (base64Pcm16k) => {
                if (ws.readyState === WebSocket.OPEN && !isMuted) {
                  ws.send(JSON.stringify({
                    realtimeInput: {
                      mediaChunks: [
                        {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Pcm16k,
                        },
                      ],
                    },
                  }));
                }
              },
              (level) => {
                setAudioLevel(level);
              }
            );
            stopRecorderRef.current = stopRecorder;
          }

          // 3. Play incoming voice chunks from Google
          if (msg.serverContent?.modelTurn?.parts) {
            for (const part of msg.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                setIsAiSpeaking(true);
                audioPlayerRef.current?.playPcmChunk(part.inlineData.data);
              }
            }
          }

          // Handle interruption (Barge-in)
          if (msg.serverContent?.interrupted) {
            audioPlayerRef.current?.interrupt();
            setIsAiSpeaking(false);
          }

          if (msg.serverContent?.turnComplete) {
            setIsAiSpeaking(false);
          }
        } catch (e) {
          console.error('Error in live packet processing:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setCallStatusText(language === 'ar' ? 'فشل الاتصال: تحقق من المفتاح والإنترنت' : 'Connection failed');
        endVoiceCall();
      };

      ws.onclose = (event) => {
        setCallStatusText(language === 'ar' ? `انتهت المكالمة (${event.code})` : `Call ended (${event.code})`);
        endVoiceCall();
      };

    } catch (error: any) {
      console.error('Failed to initiate live session:', error);
      alert(error.message || 'Microphone error');
      endVoiceCall();
    }
  };

  const endVoiceCall = async () => {
    if (stopRecorderRef.current) {
      stopRecorderRef.current();
      stopRecorderRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    if (user && callDuration > 5) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'sessions'), {
          personaId: selectedPersona,
          voiceUsed: selectedVoice,
          topicTitle: activeTopic?.title || 'General Chat',
          durationSeconds: callDuration,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        // Handled
      }
    }

    setIsCalling(false);
    setIsAiSpeaking(false);
    setAudioLevel(0);
  };

  const currentPersonaObj = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 flex flex-col items-center">
      
      {/* Top Banner: Scenario & Controls */}
      <div className="w-full flex flex-col gap-2.5 mb-4 bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">
                {language === 'ar' ? 'موضوع المحادثة الحالي:' : 'Conversation Topic:'}
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{activeTopic ? activeTopic.title : (language === 'ar' ? 'محادثة حرة ومفتوحة' : 'Free Open Conversation')}</span>
                {activeTopic && !isCalling && (
                  <button onClick={() => setActiveTopic(null)} className="text-slate-500 hover:text-red-400 text-[10px] underline">
                    {language === 'ar' ? 'إلغاء' : 'Reset'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold"
          >
            🔑 API Key
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            disabled={isCalling}
            onClick={() => setTopicModalOpen(true)}
            className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <span>🧭</span>
            <span>{language === 'ar' ? 'استكشاف السيناريوهات' : 'Explore Topics'}</span>
          </button>

          <button
            disabled={isCalling}
            onClick={() => setVoiceModalOpen(true)}
            className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <span>🎙️</span>
            <span>{language === 'ar' ? `الصوت: ${selectedVoice}` : `Voice: ${selectedVoice}`}</span>
          </button>
        </div>
      </div>

      {/* Main Calling Hub Card */}
      <div className="w-full bg-gradient-to-b from-[#0c1222] to-[#080d19] rounded-3xl border border-slate-800 p-6 flex flex-col items-center relative overflow-hidden shadow-2xl">
        
        {/* Status Header */}
        <div className="w-full flex items-center justify-between mb-6 z-10">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isCalling ? (isAiSpeaking ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400') : 'bg-slate-600'
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isCalling ? formatTime(callDuration) : (language === 'ar' ? 'جاهز' : 'Ready')}
            </span>
          </div>

          <div className="text-[11px] px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
            {callStatusText}
          </div>
        </div>

        {/* Center Animated Avatar Disc */}
        <div className="relative my-4 flex items-center justify-center">
          {isCalling && (
            <>
              <div 
                className="absolute rounded-full border border-blue-500/30 transition-all duration-150"
                style={{ 
                  width: `${140 + audioLevel * 100}px`, 
                  height: `${140 + audioLevel * 100}px`,
                  opacity: Math.max(0.2, audioLevel) 
                }} 
              />
              <div 
                className="absolute rounded-full bg-blue-500/10 transition-all duration-150"
                style={{ 
                  width: `${120 + (isAiSpeaking ? 30 : audioLevel * 60)}px`, 
                  height: `${120 + (isAiSpeaking ? 30 : audioLevel * 60)}px` 
                }} 
              />
            </>
          )}

          <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl relative z-10 transition-all duration-500 ${
            isCalling 
              ? (isAiSpeaking ? 'border-indigo-400 shadow-indigo-500/40 scale-105' : 'border-emerald-400 shadow-emerald-500/30') 
              : 'border-slate-700 bg-slate-800/60'
          }`}>
            <span className="text-5xl select-none mb-1">{currentPersonaObj.avatar}</span>
            <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
              {language === 'ar' ? currentPersonaObj.nameAr : currentPersonaObj.nameEn}
            </span>
          </div>
        </div>

        {/* Persona Info */}
        <div className="text-center mt-3 mb-6 z-10">
          <h2 className="text-xl font-black text-white">
            {language === 'ar' ? currentPersonaObj.nameAr : currentPersonaObj.nameEn}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-[260px] mx-auto">
            {language === 'ar' ? currentPersonaObj.roleAr : currentPersonaObj.roleEn}
          </p>
        </div>

        {/* Call Buttons */}
        <div className="flex items-center gap-3 z-10 w-full justify-center">
          {!isCalling ? (
            <button
              onClick={startVoiceCall}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">📞</span>
              <span>{language === 'ar' ? 'بدء المكالمة الصوتية' : 'Start Voice Call'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isMuted ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <span className="text-lg">{isMuted ? '🔇' : '🎙️'}</span>
              </button>

              <button
                onClick={endVoiceCall}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">🛑</span>
                <span>{language === 'ar' ? 'إنهاء المكالمة' : 'End Call'}</span>
              </button>

              <button
                onClick={() => setDrillModalOpen(true)}
                className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200"
              >
                <span className="text-lg">🎯</span>
              </button>
            </>
          )}
        </div>

        {/* Persona Selector Carousel */}
        {!isCalling && (
          <div className="w-full mt-8 pt-6 border-t border-slate-800 z-10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              {language === 'ar' ? 'اختر الشخصية المناسبة لك' : 'Choose Your Partner'}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {PERSONAS.map((p) => {
                const isSelected = p.id === selectedPersona;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                      isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900/40 border-slate-800/80'
                    }`}
                  >
                    <span className="text-2xl mb-1">{p.avatar}</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-[50px]">
                      {language === 'ar' ? p.nameAr.split(' ')[0] : p.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Phoneme Visualizer */}
      <div className="w-full mt-4">
        <PhonemeVisualizer
          word="passport"
          onPracticeClick={() => {
            setDrillTarget({ word: 'passport', phoneme: 'p' });
            setDrillModalOpen(true);
          }}
        />
      </div>

      {/* API Key Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white">🔑 Gemini API Key</h3>
              <button onClick={() => setApiKeyModalOpen(false)} className="text-slate-400 text-sm">✕</button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ضع مفتاحك من Google AI Studio ليعمل الصوت مباشرة داخل التطبيق:
            </p>
            <input
              type="password"
              defaultValue={apiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (tempApiKey.trim()) {
                    setApiKey(tempApiKey.trim());
                    localStorage.setItem('teachme_gemini_api_key', tempApiKey.trim());
                  }
                  setApiKeyModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                حفظ المفتاح وبدء المكالمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Modals */}
      <VoiceSelectorModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        selectedVoiceId={selectedVoice}
        onSelectVoice={(voice) => {
          setSelectedVoice(voice);
          setVoiceModalOpen(false);
        }}
      />

      <TopicExplorerModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        selectedScenarioId={activeTopic?.title || ''}
        onSelectScenario={(sc) => setActiveTopic({ title: sc.title, prompt: sc.systemInstruction })}
        onSelectCustomTopic={(topic) => setActiveTopic({ title: topic, prompt: topic })}
      />

      <RepeatMasterDrillModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        word={drillTarget.word}
      />

    </div>
  );
};
