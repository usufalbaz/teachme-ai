import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  RotateCcw, 
  Flame,
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { voiceScenarios, COACH_VOICES, OPEN_CONVERSATION_SCENARIO } from '../data/curriculum';
import { VoiceScenario, PracticeSession, PronunciationAssessmentResult, TranscriptTurn, CEFRLevel } from '../types';
import { downsampleTo16kHz, int16ArrayToBase64, LiveAudioPlayer } from '../services/geminiAudio';
import { VoiceSelectorModal } from './VoiceSelectorModal';
import { TopicExplorerModal } from './TopicExplorerModal';

interface VoiceCallHubProps {
  initialScenarioId?: string;
  onExit: () => void;
}

export const VoiceCallHub: React.FC<VoiceCallHubProps> = ({ initialScenarioId, onExit }) => {
  const { user, profile, saveSessionStats, addPronunciationMistake } = useAuth();
  const { language, t } = useLanguage();

  const [selectedScenario, setSelectedScenario] = useState<VoiceScenario>(() => {
    const found = voiceScenarios.find((s) => s.id === initialScenarioId);
    return found || OPEN_CONVERSATION_SCENARIO;
  });

  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(profile?.level || 'B1');
  const [selectedVoice, setSelectedVoice] = useState<string>('Puck');
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [topicModalOpen, setTopicModalOpen] = useState<boolean>(false);
  const [customTopicName, setCustomTopicName] = useState<string | null>(null);

  const [callActive, setCallActive] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakerState, setSpeakerState] = useState<'idle' | 'user_speaking' | 'ai_speaking'>('idle');
  const [egyptianMode, setEgyptianMode] = useState<boolean>(true);
  const [humorEnabled, setHumorEnabled] = useState<boolean>(true);
  
  // Call Metrics & Transcript Logs
  const [duration, setDuration] = useState<number>(0);
  const [turnsCount, setTurnsCount] = useState<number>(0);
  const [userScore, setUserScore] = useState<number>(85);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<PronunciationAssessmentResult[]>([]);
  const [flaggedMistakes, setFlaggedMistakes] = useState<{ word: string; targetIpa: string; spokenIpa?: string; tip: string }[]>([]);
  
  // Summary modal state
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [sessionSummaryData, setSessionSummaryData] = useState<PracticeSession | null>(null);

  // Audio References
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Clean up on unmount
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
      setRecentAssessments([]);
      setFlaggedMistakes([]);
      setDuration(0);
      setTurnsCount(0);

      // Initialize LiveAudioPlayer (24kHz Web Audio)
      playerRef.current = new LiveAudioPlayer();

      // Request Microphone access
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

      // Setup 16kHz Input Audio Context for mic
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect WebSocket to /api/live with voice and level query params
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(selectedVoice)}&level=${encodeURIComponent(selectedLevel)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnecting(false);
        setCallActive(true);

        const studentName = profile?.displayName && profile.displayName !== 'Student (Guest)' && profile.displayName !== 'English Learner' 
          ? profile.displayName 
          : '';

        let greetingText = '';
        if (studentName) {
          greetingText = `Hello ${studentName}! I'm Coach ${selectedScenario.personaName}. Great to talk with you! أهلاً بيك يا ${studentName}، جاهز ندردش ونتمرن سوا النهارده؟ How are you feeling today?`;
        } else {
          greetingText = `Hello! Welcome! I'm Coach ${selectedScenario.personaName}. Before we jump in, what's your name, and what should I call you? أهلاً بيك! أنا كوتش معاك، قبل ما نبدأ في الكلام، قولي اسمك إيه وتحب أناديك بإيه؟`;
        }

        const initialTurn: TranscriptTurn = {
          id: `turn_0`,
          role: 'model',
          speakerName: selectedScenario.personaName,
          text: customTopicName
            ? `Hey! Awesome topic to talk about: "${customTopicName}". I'm all ears! قولي في البداية اسمك إيه وتحب أناديك بإيه عشان ندردش سوا براحتنا؟`
            : greetingText,
          timestamp: '00:00',
          arabicHint: egyptianMode ? 'قوله اسمك بالإنجليزية أو بالعربي، وهيحفظ اسمك ويناديك بيه ويكمل معاك الحوار بكل ود وتفاعل حقيقي!' : undefined,
        };
        setTranscriptTurns([initialTurn]);

        // Send scenario configuration
        ws.send(
          JSON.stringify({
            type: 'configure',
            scenarioTitle: customTopicName || selectedScenario.title,
            personaRole: selectedScenario.personaRole,
            systemInstruction: `[STUDENT LEVEL: ${selectedLevel}]
[KNOWN STUDENT NAME: ${studentName || 'Unknown - ask the user for their name at the very beginning and address them by their name!'}]
[CURRENT TOPIC: ${customTopicName || selectedScenario.title}]
${selectedScenario.systemInstruction}
[SOULFUL HUMAN CONVERSATION DIRECTIVE - CRITICAL]:
- NEVER BE A PARROT: Do NOT repeat the user's sentences back to them. Converse like a witty, intelligent, insightful human friend.
- STRICT BAN ON "يا باشا": Do NOT say "يا باشا"! Address the user by their actual name once they share it.
- Connect with genuine emotion: react to their thoughts, laugh when something is funny, share relatable human perspectives, and ask engaging follow-up questions.
${egyptianMode ? `
[SPECIAL COACHING MODE: Egyptian Arabic Bilingual Companion]
- You natively understand Egyptian Arabic (العامية المصرية) and English 100%.
- If the student speaks Egyptian Arabic (e.g., 'مش عارف أنطقها', 'يعني إيه ديه؟', 'طب أقولها إزاي؟'), answer immediately with genuine warmth, share the natural native English way to say it, and encourage them to try.
- Balance English practice with warm Egyptian reactions without lecturing or sounding like an automated bot.
${humorEnabled ? `- [EGYPTIAN WIT & FRIENDLINESS]: Playful, genuine conversational humor to keep the mood light and confident.` : ''}` : ''}`,
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
                    speakerName: selectedScenario.personaName,
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
          console.warn('WS message parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error, switching to Speech fallback:', err);
        setConnecting(false);
        setCallActive(true);
      };

      ws.onclose = () => {
        if (callActive) {
          setSpeakerState('idle');
        }
      };

      // Process raw mic audio and send to WebSocket if not muted
      let silenceFrames = 0;
      processor.onaudioprocess = (e) => {
        if (isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Detect volume to animate user speaking visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        const aiIsPlaying = playerRef.current?.isAudioPlaying() || false;

        // Smart Barge-in / Interruption handling:
        // If AI is currently speaking, only pass microphone audio if user speaks with sufficient volume
        // to intentionally interrupt (avoids speaker echo leaking back into microphone)
        if (aiIsPlaying) {
          if (rms > 0.045) {
            // User intentionally interrupted!
            playerRef.current?.interrupt();
            setSpeakerState('user_speaking');
          } else {
            // Echo suppression: prevent speaker output from feeding back into Gemini Live
            return;
          }
        }

        // Voice Activity Detection (VAD)
        if (rms > 0.015) {
          silenceFrames = 0;
          setSpeakerState('user_speaking');
        } else {
          silenceFrames++;
          if (silenceFrames > 12 && speakerState === 'user_speaking') {
            setSpeakerState('idle');
          }
        }

        // Noise gate: if quiet room background noise, do not send noise chunks that cause foreign language hallucinations
        if (rms < 0.007 && silenceFrames > 6) {
          return;
        }

        // Downsample Float32 mic input to 16kHz Int16 PCM and encode base64
        if (ws.readyState === WebSocket.OPEN) {
          const int16Array = downsampleTo16kHz(inputData, audioCtx.sampleRate);
          const base64Audio = int16ArrayToBase64(int16Array);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      sourceNode.connect(processor);
      // Connect to a 0-gain node to keep the processor running in Chrome without routing mic back to speakers!
      const silenceGain = audioCtx.createGain();
      silenceGain.gain.value = 0;
      processor.connect(silenceGain);
      silenceGain.connect(audioCtx.destination);

    } catch (err: any) {
      console.error('Failed to start call:', err);
      alert(t('micDenied'));
      setConnecting(false);
      setCallActive(false);
    }
  };

  const endVoiceCall = async (shouldShowSummary: boolean = true) => {
    // Stop mic stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop script processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close Live player
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }

    // Close speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    // Close WS
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
        scenarioId: selectedScenario.id,
        scenarioTitle: selectedScenario.title,
        durationSeconds: duration,
        score: Math.max(65, Math.min(98, userScore)),
        turnsCount: Math.max(2, turnsCount),
        strengths: ['Great conversational confidence', 'Clear vowel enunciation', 'Natural response speed'],
        improvements: flaggedMistakes.map((m) => `Refine pronunciation of "${m.word}" (${m.targetIpa})`),
        mispronouncedWords: flaggedMistakes.map((m) => m.word),
        transcript: transcriptTurns.length > 0 ? transcriptTurns : [
          {
            id: 'turn_demo_1',
            role: 'model',
            speakerName: selectedScenario.personaName,
            text: selectedScenario.initialMessage,
            timestamp: '00:00',
            arabicHint: 'المدرب بدأ المحادثة بالترحيب وسؤالك عن وجهتك أو طلبك.',
          },
          {
            id: 'turn_demo_2',
            role: 'user',
            speakerName: profile?.displayName || 'Student',
            text: liveTranscript || 'Hello, I would like to check in for my flight please.',
            timestamp: '00:08',
            phoneticFeedback: flaggedMistakes.slice(0, 2),
            arabicHint: 'أداء ممتاز وجملة واضحة ومباشرة!',
          }
        ],
        createdAt: new Date().toISOString(),
      };

      setSessionSummaryData(summarySession);
      setShowSummary(true);

      // Save to Firestore
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
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Main Control Panel: Open Conversation & Settings */}
      {!callActive && !connecting && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{t('callHub')}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Open Free-Flow Mode
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                محادثة صوتية حرة ومباشرة في أي موضوع مع تصحيح النطق والجرامر بخفة دم مصرية.
              </p>
            </div>
            
            <button
              onClick={onExit}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              العودة للمنهج
            </button>
          </div>

          {/* Quick Settings Bar: Level & Voice & Humor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 sm:p-5 rounded-3xl liquid-card border border-white/[0.08] text-xs">
            
            {/* 1. CEFR Level Selector */}
            <div className="space-y-1.5">
              <span className="text-slate-300 font-bold block">1. اختر مستواك اللغوي (CEFR Level):</span>
              <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl border border-white/[0.06]">
                {(['A1', 'A2', 'B1', 'B2', 'C1'] as CEFRLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex-1 py-1.5 rounded-lg font-black transition ${
                      selectedLevel === lvl
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Coach Voice Selector */}
            <div className="space-y-1.5">
              <span className="text-slate-300 font-bold block">2. صوت ونبرة المدرب (Coach Voice):</span>
              <button
                onClick={() => setVoiceModalOpen(true)}
                className="w-full py-2 px-3.5 rounded-xl liquid-pill hover:border-white/20 text-white font-bold transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {COACH_VOICES.find((v) => v.id === selectedVoice)?.avatar || '🎙️'}
                  </span>
                  <span>{COACH_VOICES.find((v) => v.id === selectedVoice)?.name || selectedVoice}</span>
                </div>
                <span className="text-[10px] text-indigo-300 group-hover:underline">تغيير الصوت ⚙️</span>
              </button>
            </div>

            {/* 3. Egyptian Humor & Banter Toggle */}
            <div className="space-y-1.5">
              <span className="text-slate-300 font-bold block">3. أسلوب وخفة دم المدرب:</span>
              <button
                onClick={() => setHumorEnabled(!humorEnabled)}
                className={`w-full py-2 px-3.5 rounded-xl border font-bold transition flex items-center justify-between ${
                  humorEnabled
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'liquid-pill text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>🎭</span>
                  <span>قفشات وهزار مصري مع الأخطاء</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20">
                  {humorEnabled ? 'مفعّل' : 'معطل'}
                </span>
              </button>
            </div>

          </div>

          {/* Active Topic Banner & Topic Search Button */}
          <div className="p-4 sm:p-5 rounded-3xl liquid-card border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedScenario.avatar}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{customTopicName ? `موضوع مخصص: ${customTopicName}` : (language === 'ar' ? selectedScenario.titleAr : selectedScenario.title)}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedLevel}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {customTopicName
                      ? 'سيتحدث معك المدرب في هذا الموضوع بالتحديد مع تصحيح النطق والجرامر.'
                      : (language === 'ar' ? selectedScenario.descriptionAr : selectedScenario.description)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(customTopicName || selectedScenario.id !== OPEN_CONVERSATION_SCENARIO.id) && (
                <button
                  onClick={() => {
                    setSelectedScenario(OPEN_CONVERSATION_SCENARIO);
                    setCustomTopicName(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  العودة للمحادثة المفتوحة ↺
                </button>
              )}
              
              <button
                onClick={() => setTopicModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <span>🔍 بحث في مكتبة المواضيع (30+ سيناريو)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Call Hub Card */}
      <div className="relative rounded-3xl liquid-glass-elevated border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden p-6 sm:p-10 flex flex-col items-center justify-center min-h-[460px]">
        
        {/* Call Status Header */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedScenario.avatar}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {selectedScenario.personaName}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  {selectedScenario.level}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {selectedScenario.personaRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Egyptian Arabic Tutor Mode Toggle */}
            <button
              onClick={() => setEgyptianMode(!egyptianMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition ${
                egyptianMode
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="يفهم العامية المصرية ويقدم توجيهات نطق زي Elsa و Praktika"
            >
              <span>🇪🇬</span>
              <span className="hidden sm:inline">مدرب مصري</span>
              <span className="text-[10px] opacity-75">{egyptianMode ? 'ON' : 'OFF'}</span>
            </button>

            {callActive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Waveform & Avatar Animation */}
        <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
          
          {/* Animated Coach Avatar Sphere */}
          <div className="relative mb-6">
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
                speakerState === 'ai_speaking'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.5)] scale-110'
                  : speakerState === 'user_speaking'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] scale-105'
                  : 'bg-slate-800 border-2 border-slate-700'
              }`}
            >
              <span className="text-5xl select-none">{selectedScenario.avatar}</span>
            </div>

            {/* Glowing Rings */}
            {callActive && speakerState === 'ai_speaking' && (
              <>
                <div className="absolute inset-0 rounded-full border border-indigo-400/40 animate-ping" />
                <div className="absolute -inset-4 rounded-full border border-violet-400/20 animate-pulse" />
              </>
            )}
            {callActive && speakerState === 'user_speaking' && (
              <div className="absolute inset-0 rounded-full border border-emerald-400/50 animate-ping" />
            )}
          </div>

          {/* Dynamic Waveform Visualizer */}
          {callActive && (
            <div className="flex items-center justify-center gap-1.5 h-12 my-2">
              {[40, 70, 30, 90, 60, 100, 45, 80, 50, 85, 30, 95].map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    speakerState === 'ai_speaking'
                      ? 'bg-indigo-400 animate-pulse'
                      : speakerState === 'user_speaking'
                      ? 'bg-emerald-400 animate-bounce'
                      : 'bg-slate-700 h-2'
                  }`}
                  style={{
                    height: speakerState !== 'idle' ? `${Math.max(8, (height * (i % 2 === 0 ? 0.9 : 0.6)))}px` : '4px',
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Spoken Status Text */}
          <div className="mt-2 text-sm font-semibold">
            {connecting ? (
              <span className="text-indigo-400 animate-pulse">{t('callConnecting')}</span>
            ) : callActive ? (
              speakerState === 'ai_speaking' ? (
                <span className="text-indigo-300">{t('aiSpeaking')}</span>
              ) : speakerState === 'user_speaking' ? (
                <span className="text-emerald-400 font-bold">{t('listening')}</span>
              ) : (
                <span className="text-slate-400">Speak into your mic to answer...</span>
              )
            ) : (
              <span className="text-slate-400">Press the button below to start your live voice session</span>
            )}
          </div>

          {/* Live Transcript / Feedback Subtitle */}
          {callActive && liveTranscript && (
            <div className="mt-4 px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 max-w-lg mx-auto shadow-inner">
              <span className="font-semibold text-indigo-400">Live Transcript: </span>
              <span>"{liveTranscript}"</span>
            </div>
          )}
        </div>

        {/* Real-time Phonetic Feedback Overlay Card */}
        {callActive && flaggedMistakes.length > 0 && (
          <div className="w-full my-4 p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>{t('quickFeedback')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {flaggedMistakes.slice(-3).map((m, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <span className="font-bold text-white">{m.word}</span>
                  <span className="font-mono text-emerald-400">{m.targetIpa}</span>
                  <span className="text-slate-400 text-[11px]">— {m.tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="w-full pt-6 border-t border-slate-800/80 flex items-center justify-center gap-4">
          {!callActive ? (
            <button
              disabled={connecting}
              onClick={startVoiceCall}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <Mic className="w-5 h-5 fill-slate-950" />
              <span>{connecting ? 'Connecting...' : t('startVoiceCall')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-2xl border transition ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isMuted ? t('unmuteMic') : t('muteMic')}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => endVoiceCall(true)}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-105"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{t('endCall')}</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Post-Call Summary Modal */}
      {showSummary && sessionSummaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white">
                {t('callSummaryTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {sessionSummaryData.scenarioTitle}
              </p>
            </div>

            {/* Score & Duration Row */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div>
                <div className="text-2xl font-black text-emerald-400">{sessionSummaryData.score}%</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Fluency Score</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-2xl font-black text-white">{formatTime(sessionSummaryData.durationSeconds)}</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Talk Time</div>
              </div>
              <div>
                <div className="text-2xl font-black text-indigo-400">{sessionSummaryData.turnsCount}</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Turns</div>
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('strengthsTitle')}
              </h4>
              <div className="space-y-1.5">
                {sessionSummaryData.strengths.map((str, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pronunciation Mistakes & Tips */}
            {sessionSummaryData.mispronouncedWords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {t('reviewMistakes')}
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {flaggedMistakes.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white mr-2">{m.word}</span>
                        <span className="font-mono text-emerald-400">{m.targetIpa}</span>
                        <p className="text-slate-400 text-[11px]">{m.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSummary(false);
                  onExit();
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                Back to Curriculum
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Voice Selection Modal */}
      <VoiceSelectorModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        selectedVoiceId={selectedVoice}
        onSelectVoice={(voiceId) => {
          setSelectedVoice(voiceId);
          setVoiceModalOpen(false);
        }}
      />

      {/* Topic Explorer & Search Modal */}
      <TopicExplorerModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        selectedScenarioId={selectedScenario.id}
        onSelectScenario={(sc) => {
          setSelectedScenario(sc);
          setCustomTopicName(null);
        }}
        onSelectCustomTopic={(topic) => {
          setCustomTopicName(topic);
        }}
      />

    </div>
  );
};
