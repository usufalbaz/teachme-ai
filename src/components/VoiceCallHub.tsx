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
  color: string;
  badge: string;
  defaultVoice: string;
}

const PERSONAS: PersonaInfo[] = [
  {
    id: 'younis',
    nameAr: 'يونس المصري',
    nameEn: 'Younis',
    roleAr: 'صديقك للفضفضة والضحك بالإنجليزي',
    roleEn: 'Casual & witty conversationalist',
    avatar: '🇪🇬',
    color: 'from-amber-500/20 to-orange-600/20 border-orange-500/40 text-orange-400',
    badge: 'الأكثر شعبية 🔥',
    defaultVoice: 'Aoede',
  },
  {
    id: 'hesham',
    nameAr: 'المهندس هشام',
    nameEn: 'Hesham',
    roleAr: 'محاكي مقابلات Big Tech والشركات',
    roleEn: 'Senior Tech & System Design Interviewer',
    avatar: '👨‍💻',
    color: 'from-blue-600/20 to-cyan-600/20 border-blue-500/40 text-blue-400',
    badge: 'مقابلات عمل 💼',
    defaultVoice: 'Charon',
  },
  {
    id: 'nour',
    nameAr: 'المعلمة نور',
    nameEn: 'Nour',
    roleAr: 'صبورة جداً مع المبتدئين خطوة بخطوة',
    roleEn: 'Gentle A1-A2 Beginner Coach',
    avatar: '🌸',
    color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/40 text-emerald-400',
    badge: 'تأسيس هادئ 🌱',
    defaultVoice: 'Kore',
  },
  {
    id: 'jameel',
    nameAr: 'عم جميل',
    nameEn: 'Uncle Jameel',
    roleAr: 'لكنة بريطانية كلاسيكية فخمة',
    roleEn: 'Sophisticated British Accent & Idioms',
    avatar: '🎩',
    color: 'from-purple-500/20 to-indigo-600/20 border-purple-500/40 text-purple-400',
    badge: 'إنجليزي ملوكي 👑',
    defaultVoice: 'Fenrir',
  },
  {
    id: 'natalie',
    nameAr: 'ناتالي الأمريكية',
    nameEn: 'Natalie',
    roleAr: 'سريعة ولغة شوارع وسينما أمريكية',
    roleEn: 'Fast-paced American Slang & Culture',
    avatar: '🗽',
    color: 'from-pink-500/20 to-rose-600/20 border-pink-500/40 text-pink-400',
    badge: 'أمريكاني أصلي ⚡',
    defaultVoice: 'Puck',
  },
];

export const VoiceCallHub: React.FC<VoiceCallHubProps> = ({ onOpenIeltsTest }) => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();

  // Call Lifecycle & Settings State
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('younis');
  const [selectedVoice, setSelectedVoice] = useState<string>('Aoede');
  const [activeTopic, setActiveTopic] = useState<{ title: string; prompt: string } | null>(null);
  
  // Connection & Audio States
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callStatusText, setCallStatusText] = useState<string>('جاهز للبدء');
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Modals
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [topicModalOpen, setTopicModalOpen] = useState<boolean>(false);
  const [drillModalOpen, setDrillModalOpen] = useState<boolean>(false);
  const [drillTarget, setDrillTarget] = useState<{ word: string; phoneme: string }>({ word: 'People', phoneme: 'P' });

  // Refs for Web Audio & WebSockets
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const stopRecorderRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const handleSelectPersona = (p: PersonaInfo) => {
    if (isCalling) return;
    setSelectedPersona(p.id);
    setSelectedVoice(p.defaultVoice);
  };

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

  const startVoiceCall = async () => {
    try {
      setCallStatusText(language === 'ar' ? 'جاري الاتصال بالذكاء الاصطناعي...' : 'Connecting to AI node...');
      audioPlayerRef.current = new LiveAudioPlayer();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setCallStatusText(language === 'ar' ? 'متصل - ابدأ الكلام' : 'Connected - Start speaking');
        setIsCalling(true);

        ws.send(JSON.stringify({
          type: 'start',
          persona: selectedPersona,
          voice: selectedVoice,
          customTopic: activeTopic ? activeTopic.prompt : undefined,
          userLevel: profile?.level || 'B1',
        }));

        const stopRecorder = await createPcmAudioRecorder(
          (base64Pcm16k) => {
            if (ws.readyState === WebSocket.OPEN && !isMuted) {
              ws.send(JSON.stringify({
                type: 'audio',
                data: base64Pcm16k,
              }));
            }
          },
          (level) => {
            setAudioLevel(level);
          }
        );
        stopRecorderRef.current = stopRecorder;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.data) {
            setIsAiSpeaking(true);
            audioPlayerRef.current?.playPcmChunk(msg.data);
          } else if (msg.type === 'interrupted') {
            audioPlayerRef.current?.interrupt();
            setIsAiSpeaking(false);
          } else if (msg.type === 'turn_complete') {
            setIsAiSpeaking(false);
          } else if (msg.type === 'error') {
            console.error('Gemini Live WS Error:', msg.message);
            setCallStatusText(msg.message || 'Error occurred');
          }
        } catch (e) {
          console.error('Error parsing live WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection failure:', err);
        setCallStatusText(language === 'ar' ? 'تعذر الاتصال بالسيرفر' : 'Server connection failed');
        endVoiceCall();
      };

      ws.onclose = () => {
        endVoiceCall();
      };

    } catch (error: any) {
      console.error('Failed to initiate live call:', error);
      alert(error.message || 'Could not access microphone');
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
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
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
        console.error('Failed to record session log:', err);
      }
    }

    setIsCalling(false);
    setIsAiSpeaking(false);
    setAudioLevel(0);
    setCallStatusText(language === 'ar' ? 'تم إنهاء المكالمة' : 'Call ended');
  };

  const currentPersonaObj = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-12 flex flex-col items-center">
      
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎯</span>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {language === 'ar' ? 'سيناريو المحادثة الحالي:' : 'Active Conversation Topic:'}
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{activeTopic ? activeTopic.title : (language === 'ar' ? 'محادثة حرة ومفتوحة' : 'Free Open Conversation')}</span>
              {activeTopic && !isCalling && (
                <button
                  onClick={() => setActiveTopic(null)}
                  className="text-slate-500 hover:text-red-400 text-[10px] underline ml-1"
                >
                  {language === 'ar' ? 'إلغاء' : 'Reset'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isCalling}
            onClick={() => setTopicModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>🧭</span>
            <span>{language === 'ar' ? 'استكشاف السيناريوهات' : 'Explore Topics'}</span>
          </button>

          <button
            disabled={isCalling}
            onClick={() => setVoiceModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>🎙️</span>
            <span>{language === 'ar' ? `الصوت: ${selectedVoice}` : `Voice: ${selectedVoice}`}</span>
          </button>
        </div>
      </div>

      <div className="w-full bg-gradient-to-b from-[#0c1222] to-[#080d19] rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-10 flex flex-col items-center relative overflow-hidden">
        
        <div className={`absolute -top-32 w-96 h-96 rounded-full blur-[120px] transition-all duration-700 pointer-events-none ${
          isCalling ? (isAiSpeaking ? 'bg-indigo-500/20' : 'bg-emerald-500/15') : 'bg-blue-600/10'
        }`} />

        <div className="w-full flex items-center justify-between mb-8 z-10">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isCalling ? (isAiSpeaking ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400') : 'bg-slate-600'
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isCalling ? formatTime(callDuration) : (language === 'ar' ? 'جاهز للمكالمة' : 'Ready')}
            </span>
          </div>

          <div className="text-xs px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
            {callStatusText}
          </div>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          {isCalling && (
            <>
              <div 
                className="absolute rounded-full border border-blue-500/30 transition-all duration-150"
                style={{ 
                  width: `${160 + audioLevel * 140}px`, 
                  height: `${160 + audioLevel * 140}px`,
                  opacity: Math.max(0.2, audioLevel) 
                }} 
              />
              <div 
                className="absolute rounded-full bg-blue-500/10 transition-all duration-150"
                style={{ 
                  width: `${140 + (isAiSpeaking ? 40 : audioLevel * 80)}px`, 
                  height: `${140 + (isAiSpeaking ? 40 : audioLevel * 80)}px` 
                }} 
              />
            </>
          )}

          <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl relative z-10 transition-all duration-500 ${
            isCalling 
              ? (isAiSpeaking ? 'border-indigo-400 shadow-indigo-500/30 scale-105' : 'border-emerald-400 shadow-emerald-500/20') 
              : 'border-slate-700 bg-slate-800/50'
          }`}>
            <span className="text-6xl sm:text-7xl select-none mb-1">{currentPersonaObj.avatar}</span>
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
              {language === 'ar' ? currentPersonaObj.nameAr : currentPersonaObj.nameEn}
            </span>
          </div>
        </div>

        <div className="text-center mt-4 mb-8 z-10 max-w-md">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
            {language === 'ar' ? currentPersonaObj.nameAr : currentPersonaObj.nameEn}
          </h2>
          <p className="text-sm text-slate-400">
            {language === 'ar' ? currentPersonaObj.roleAr : currentPersonaObj.roleEn}
          </p>
        </div>

        <div className="flex items-center gap-4 z-10">
          {!isCalling ? (
            <button
              onClick={startVoiceCall}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <span className="text-xl">📞</span>
              <span>{language === 'ar' ? 'بدء المكالمة الآن' : 'Start Voice Call'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-2xl border transition-all ${
                  isMuted 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="text-xl">{isMuted ? '🔇' : '🎙️'}</span>
              </button>

              <button
                onClick={endVoiceCall}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-base shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <span className="text-xl">🛑</span>
                <span>{language === 'ar' ? 'إنهاء المكالمة' : 'End Call'}</span>
              </button>

              <button
                onClick={() => setDrillModalOpen(true)}
                className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
                title="تمرين مخارج الحروف السريع"
              >
                <span className="text-xl">🎯</span>
              </button>
            </>
          )}
        </div>

        {!isCalling && (
          <div className="w-full mt-12 z-10 border-t border-slate-800/80 pt-8">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
              {language === 'ar' ? 'اختر الشخصية المناسبة لك' : 'Choose Your AI Conversational Partner'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PERSONAS.map((p) => {
                const isSelected = p.id === selectedPersona;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center relative ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-3xl mb-1">{p.avatar}</span>
                    <span className="text-xs font-extrabold text-white mb-0.5">
                      {language === 'ar' ? p.nameAr : p.nameEn}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <div className="w-full mt-6">
        <PhonemeVisualizer
          word="thought"
          onPracticeClick={() => {
            setDrillTarget({ word: 'thought', phoneme: 'th' });
            setDrillModalOpen(true);
          }}
        />
      </div>

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
        onSelectCustomTopic={(topic) => setActiveTopic({ title: topic, prompt: `Roleplay this custom topic: ${topic}` })}
      />

      <RepeatMasterDrillModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        word={drillTarget.word}
      />

    </div>
  );
}; 
