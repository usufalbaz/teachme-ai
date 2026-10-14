import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  Sparkles, 
  Award, 
  Clock, 
  RotateCcw, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COACH_VOICES, CoachVoice } from '../data/curriculum';
import { PracticeSession, TranscriptTurn, CEFRLevel } from '../types';
import { downsampleTo16kHz, int16ArrayToBase64, LiveAudioPlayer } from '../services/geminiAudio';

interface VoiceCallHubProps {
  onOpenIeltsTest?: () => void;
}

export const VoiceCallHub: React.FC<VoiceCallHubProps> = ({ onOpenIeltsTest }) => {
  const { user, profile, saveSessionStats } = useAuth();
  const { language, t } = useLanguage();

  const [activeCoach, setActiveCoach] = useState<CoachVoice>(COACH_VOICES[2]); // Default: Younis (يونس)
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(profile?.level || 'B1');

  const [callActive, setCallActive] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakerState, setSpeakerState] = useState<'idle' | 'user_speaking' | 'ai_speaking'>('idle');

  // Metrics
  const [duration, setDuration] = useState<number>(0);
  const [turnsCount, setTurnsCount] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([]);
  const [userScore, setUserScore] = useState<number>(85);

  // Summary modal
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [sessionSummaryData, setSessionSummaryData] = useState<PracticeSession | null>(null);

  // Audio References
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      endVoiceCall(false);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (callActive) {
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callActive]);

  const startVoiceCall = async () => {
    try {
      setConnecting(true);
      setLiveTranscript('');
      setDuration(0);
      setTurnsCount(0);

      // Initialize player
      playerRef.current = new LiveAudioPlayer();

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect to Gemini Live WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(activeCoach.voiceName)}&level=${encodeURIComponent(selectedLevel)}&coach=${encodeURIComponent(activeCoach.id)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnecting(false);
        setCallActive(true);

        const studentName = profile?.displayName && profile.displayName !== 'Student (Guest)' && profile.displayName !== 'English Learner' 
          ? profile.displayName 
          : '';

        const openingTurn: TranscriptTurn = {
          id: `turn_0`,
          role: 'model',
          speakerName: activeCoach.name.split(' ')[0],
          text: activeCoach.greeting,
          timestamp: '00:00'
        };
        setTranscriptTurns([openingTurn]);

        // Send configuration
        ws.send(
          JSON.stringify({
            type: 'configure',
            scenarioTitle: `Live Practice with ${activeCoach.name}`,
            personaRole: activeCoach.role,
            systemInstruction: `[ACTIVE COACH: ${activeCoach.name}] [COACH ROLE: ${activeCoach.role}] [STUDENT CEFR: ${selectedLevel}] [STUDENT NAME: ${studentName || 'Not yet known - ask politely at start'}] Please begin the session with a warm 1-2 sentence spoken greeting matching your personality!`
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'audio' && data.audio) {
            setSpeakerState('ai_speaking');
            playerRef.current?.playChunk(data.audio);
          }

          if (data.type === 'transcript' && data.text) {
            setLiveTranscript((prev) => prev ? `${prev} ${data.text}` : data.text);
            setTranscriptTurns((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'model' && last.id !== 'turn_0') {
                return [...prev.slice(0, -1), { ...last, text: `${last.text} ${data.text}` }];
              } else {
                return [
                  ...prev,
                  {
                    id: `turn_${Date.now()}_m`,
                    role: 'model',
                    speakerName: activeCoach.name.split(' ')[0],
                    text: data.text,
                    timestamp: formatTime(duration),
                  },
                ];
              }
            });
          }

          if (data.type === 'interrupted') {
            playerRef.current?.interrupt();
            setSpeakerState('user_speaking');
          }

          if (data.type === 'turnComplete') {
            setSpeakerState('idle');
            setTurnsCount((prev) => prev + 1);
          }
        } catch (e) {
          console.warn('WS message error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        setConnecting(false);
      };

      ws.onclose = () => {
        setSpeakerState('idle');
      };

      // Real-time audio processing with noise-gate threshold
      let silenceFrames = 0;
      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const aiIsPlaying = playerRef.current?.isAudioPlaying() || false;

        // Barge-in: if AI is speaking, user must speak firmly to interrupt
        if (aiIsPlaying) {
          if (rms > 0.05) {
            playerRef.current?.interrupt();
            setSpeakerState('user_speaking');
          } else {
            return; // Reject quiet speaker bleed
          }
        }

        // Voice activity detection
        if (rms > 0.016) {
          silenceFrames = 0;
          setSpeakerState('user_speaking');
        } else {
          silenceFrames++;
          if (silenceFrames > 12 && speakerState === 'user_speaking') {
            setSpeakerState('idle');
          }
        }

        // Noise gate: do not transmit background noise or breathing
        if (rms < 0.008 && silenceFrames > 6) {
          return;
        }

        // Encode to 16kHz Int16 PCM and stream
        if (ws.readyState === WebSocket.OPEN) {
          const int16Array = downsampleTo16kHz(inputData, audioCtx.sampleRate);
          const base64Audio = int16ArrayToBase64(int16Array);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      sourceNode.connect(processor);
      const silenceGain = audioCtx.createGain();
      silenceGain.gain.value = 0;
      processor.connect(silenceGain);
      silenceGain.connect(audioCtx.destination);

    } catch (err: any) {
      console.error('Mic error:', err);
      alert(language === 'ar' ? 'يرجى السماح بصلاحية المايكروفون للتمكن من التحدث الصوتي' : 'Please allow microphone access to talk.');
      setConnecting(false);
      setCallActive(false);
    }
  };

  const endVoiceCall = async (shouldShowSummary: boolean = true) => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    setCallActive(false);
    setConnecting(false);
    setSpeakerState('idle');

    if (shouldShowSummary && duration > 5) {
      const summarySession: PracticeSession = {
        id: `sess_${Date.now()}`,
        userId: user?.uid || 'guest_user',
        scenarioId: activeCoach.id,
        scenarioTitle: `Voice Session: ${activeCoach.name}`,
        durationSeconds: duration,
        score: Math.max(72, Math.min(96, userScore)),
        turnsCount: Math.max(2, turnsCount),
        strengths: ['Active conversational turn velocity', 'Clear vocal enunciation', 'Natural response initiation'],
        improvements: ['Continue pacing vowel elongation on stressed syllables', 'Maintain momentum without hesitation'],
        mispronouncedWords: [],
        transcript: transcriptTurns.length > 0 ? transcriptTurns : [],
        createdAt: new Date().toISOString(),
      };

      setSessionSummaryData(summarySession);
      setShowSummary(true);

      // Persist to real Firestore database
      await saveSessionStats(summarySession);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      
      {/* Top Banner */}
      {!callActive && !connecting && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                  Acoustic Spoken Studio
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Real-Time Bi-Directional
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {language === 'ar' ? 'استوديو التحدث الصوتي التفاعلي' : 'Live Conversational Studio'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {language === 'ar' 
                  ? 'اختر مدربك المفضل وابدأ محادثة صوتية حقيقية 1-on-1 فوراً وبدون أي وسيط أو نصوص جامدة'
                  : 'Select your personal speaking coach and engage in direct, natural voice practice.'}
              </p>
            </div>

            {onOpenIeltsTest && (
              <button
                onClick={onOpenIeltsTest}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 text-xs font-bold transition shadow-sm"
              >
                <Award className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحديد المستوى (IELTS)' : 'IELTS Placement Test'}</span>
              </button>
            )}
          </div>

          {/* 5 Distinct Coach Selector Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>{language === 'ar' ? 'اختر شخصية المدرب الصوتي:' : 'Choose Your Speaking Coach:'}</span>
              <span className="text-slate-500 text-[11px]">5 Custom Neural Personas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COACH_VOICES.map((coach) => {
                const isSelected = activeCoach.id === coach.id;
                return (
                  <div
                    key={coach.id}
                    onClick={() => setActiveCoach(coach)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-2xl bg-slate-950 border border-slate-800">
                            {coach.avatar}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {coach.name.split('(')[0]}
                            </h4>
                            <span className="text-[10px] text-blue-300 font-medium">
                              {coach.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mt-2 line-clamp-2">
                        {language === 'ar' ? coach.toneAr : coach.toneEn}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {coach.gender === 'female' ? (language === 'ar' ? 'صوت نسائي' : 'Female') : (language === 'ar' ? 'صوت رجالي' : 'Male')}
                      </span>
                      <span className={`font-bold ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                        {isSelected ? (language === 'ar' ? 'محدد حالياً' : 'Selected') : (language === 'ar' ? 'اختيار' : 'Select')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Voice Call Display */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0b101c] via-[#090d17] to-[#070a12] border border-slate-800/90 shadow-2xl p-6 sm:p-10 flex flex-col items-center justify-center min-h-[460px] overflow-hidden">
        
        {/* Top Active Coach Status Header */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800">
              {activeCoach.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {activeCoach.name}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                  {selectedLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeCoach.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {callActive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-blue-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Live Waveform & Glowing Visualizer */}
        <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
          
          {/* Avatar Orb */}
          <div className="relative mb-6">
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
                speakerState === 'ai_speaking'
                  ? 'bg-blue-600/30 border-2 border-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.4)] scale-105'
                  : speakerState === 'user_speaking'
                  ? 'bg-emerald-600/30 border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.35)] scale-105'
                  : 'bg-slate-900 border border-slate-800'
              }`}
            >
              <span className="text-5xl select-none">{activeCoach.avatar}</span>
            </div>

            {callActive && speakerState === 'ai_speaking' && (
              <>
                <div className="absolute inset-0 rounded-full border border-blue-400/40 animate-ping" />
                <div className="absolute -inset-3 rounded-full border border-blue-400/20 animate-pulse" />
              </>
            )}
            {callActive && speakerState === 'user_speaking' && (
              <div className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping" />
            )}
          </div>

          {/* Calm Waveform Bars */}
          {callActive && (
            <div className="flex items-center justify-center gap-1.5 h-12 my-2">
              {[35, 60, 25, 80, 50, 90, 40, 75, 45, 85, 30, 70].map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    speakerState === 'ai_speaking'
                      ? 'bg-blue-400 animate-pulse'
                      : speakerState === 'user_speaking'
                      ? 'bg-emerald-400 animate-bounce'
                      : 'bg-slate-800 h-2'
                  }`}
                  style={{
                    height: speakerState !== 'idle' ? `${Math.max(6, (height * (i % 2 === 0 ? 0.8 : 0.5)))}px` : '4px',
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Status Label */}
          <div className="mt-2 text-sm font-semibold">
            {connecting ? (
              <span className="text-blue-400 animate-pulse">
                {language === 'ar' ? 'جارٍ الاتصال بالمدرب الصوتي المباشر...' : 'Connecting to Live Spoken Studio...'}
              </span>
            ) : callActive ? (
              speakerState === 'ai_speaking' ? (
                <span className="text-blue-300 font-bold">{activeCoach.name.split(' ')[0]} {language === 'ar' ? 'يتحدث معك الآن...' : 'is speaking...'}</span>
              ) : speakerState === 'user_speaking' ? (
                <span className="text-emerald-400 font-bold">{language === 'ar' ? 'نستمع لصوتك الآن...' : 'Listening to you...'}</span>
              ) : (
                <span className="text-slate-400">{language === 'ar' ? 'تحدث في المايكروفون بحرية...' : 'Speak into your microphone...'}</span>
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
  onOpenIeltsTest: () => void;
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
  const { language, t } = useLanguage();

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

  // Sync selected voice when persona changes
  const handleSelectPersona = (p: PersonaInfo) => {
    if (isCalling) return;
    setSelectedPersona(p.id);
    setSelectedVoice(p.defaultVoice);
  };

  // Timer counter
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

  // Clean-up on unmount
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

  // ----------------------------------------------------
  // Establish WebSocket Connection with Gemini Live
  // ----------------------------------------------------
  const startVoiceCall = async () => {
    try {
      setCallStatusText(language === 'ar' ? 'جاري الاتصال بالذكاء الاصطناعي...' : 'Connecting to AI node...');
      audioPlayerRef.current = new LiveAudioPlayer();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setCallStatusText(language === 'ar' ? 'متصل - ابدأ الكلام' : 'Connected - Start speaking');
        setIsCalling(true);

        // Send start configuration packet
        ws.send(JSON.stringify({
          type: 'start',
          persona: selectedPersona,
          voice: selectedVoice,
          customTopic: activeTopic ? activeTopic.prompt : undefined,
          userLevel: profile?.targetLevel || 'B1',
        }));

        // Start microphone streaming
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
    // 1. Stop mic recorder
    if (stopRecorderRef.current) {
      stopRecorderRef.current();
      stopRecorderRef.current = null;
    }

    // 2. Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }

    // 3. Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // 4. Save session metrics to Firestore if logged in
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
      
      {/* Top Scenario Banner & Modals Controls */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800">
        
        {/* Active Scenario or Topic */}
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

        {/* Action Buttons: Choose Voice & Choose Topic */}
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

      {/* Main Calling Hub Card */}
      <div className="w-full bg-gradient-to-b from-[#0c1222] to-[#080d19] rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-10 flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle Ambient Aura */}
        <div className={`absolute -top-32 w-96 h-96 rounded-full blur-[120px] transition-all duration-700 pointer-events-none ${
          isCalling ? (isAiSpeaking ? 'bg-indigo-500/20' : 'bg-emerald-500/15') : 'bg-blue-600/10'
        }`} />

        {/* Header Status & Call Duration */}
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

        {/* Center Calling Avatar & Acoustic Animation */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated concentric audio rings when speaking */}
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

          {/* Persona Avatar Disc */}
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

        {/* Active Persona Description */}
        <div className="text-center mt-4 mb-8 z-10 max-w-md">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
            {language === 'ar' ? currentPersonaObj.nameAr : currentPersonaObj.nameEn}
          </h2>
          <p className="text-sm text-slate-400">
            {language === 'ar' ? currentPersonaObj.roleAr : currentPersonaObj.roleEn}
          </p>
        </div>

        {/* Primary Call Action Controls */}
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
              {/* Mute Microphone Toggle */}
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

              {/* End Call Button */}
              <button
                onClick={endVoiceCall}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-base shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <span className="text-xl">🛑</span>
                <span>{language === 'ar' ? 'إنهاء المكالمة' : 'End Call'}</span>
              </button>

              {/* Quick Drill Trigger Button */}
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

        {/* Persona Selector Grid (Disabled while in a call) */}
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

      {/* Phoneme Visualizer Card (Under the hub for real-time acoustic reference) */}
      <div className="w-full mt-6">
        <PhonemeVisualizer
          onPracticePhoneme={(phoneme, sampleWord) => {
            setDrillTarget({ word: sampleWord, phoneme });
            setDrillModalOpen(true);
          }}
        />
      </div>

      {/* ----------------- Sub-Modals ----------------- */}
      
      {/* 1. Voice Selector Modal */}
      <VoiceSelectorModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        currentVoice={selectedVoice}
        onSelectVoice={(voice) => {
          setSelectedVoice(voice);
          setVoiceModalOpen(false);
        }}
      />

      {/* 2. Topic Explorer Modal */}
      <TopicExplorerModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        onSelectTopic={(topicTitle, topicPrompt) => {
          setActiveTopic({ title: topicTitle, prompt: topicPrompt });
          setTopicModalOpen(false);
        }}
      />

      {/* 3. Repeat Master Drill Modal */}
      <RepeatMasterDrillModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        word={drillTarget.word}
        targetPhoneme={drillTarget.phoneme}
      />

    </div>
  );
};
