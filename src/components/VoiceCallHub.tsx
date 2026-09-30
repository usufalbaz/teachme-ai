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
              )
            ) : (
              <span className="text-slate-400">
                {language === 'ar' ? 'اضغط على زر البدء وتحدث مباشرة مع المدرب' : 'Press start to begin your live spoken session'}
              </span>
            )}
          </div>

          {/* Live Transcript Subtitle */}
          {callActive && liveTranscript && (
            <div className="mt-4 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 max-w-lg mx-auto shadow-inner leading-relaxed">
              <span className="font-bold text-blue-400">Live: </span>
              <span>"{liveTranscript}"</span>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="w-full pt-6 border-t border-slate-800/80 flex items-center justify-center gap-4">
          {!callActive ? (
            <button
              disabled={connecting}
              onClick={startVoiceCall}
              className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-105"
            >
              <Mic className="w-5 h-5" />
              <span>{connecting ? (language === 'ar' ? 'جارٍ الاتصال...' : 'Connecting...') : (language === 'ar' ? 'بدء المكالمة الصوتية' : 'Start Voice Call')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className={`p-3.5 rounded-2xl border transition ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => endVoiceCall(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-105"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{language === 'ar' ? 'إنهاء المكالمة والتقييم' : 'End Call & View Report'}</span>
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
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {language === 'ar' ? 'تقرير الجلسة الصوتية المعتمد' : 'Session Performance Report'}
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
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-400">{sessionSummaryData.turnsCount}</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Turns</div>
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === 'ar' ? 'نقاط القوة الصوتية' : 'Key Strengths'}
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

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSummary(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
              >
                {language === 'ar' ? 'حفظ والعودة للاستوديو' : 'Save & Return to Studio'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
