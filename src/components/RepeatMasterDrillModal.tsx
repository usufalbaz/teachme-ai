import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Award, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PhonemeVisualizer, PHONEME_DATA } from './PhonemeVisualizer';

interface RepeatMasterDrillModalProps {
  word: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RepeatMasterDrillModal: React.FC<RepeatMasterDrillModalProps> = ({
  word,
  isOpen,
  onClose,
}) => {
  const { user, profile, recordCompletedLesson } = useAuth();
  const { language, t } = useLanguage();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenAttempt, setSpokenAttempt] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.8);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setSpokenAttempt('');
      setScore(null);
      setXpEarned(0);
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  }, [isOpen, word]);

  if (!isOpen || !word) return null;

  const normalizedWord = word.toLowerCase().trim();
  const wordInfo = PHONEME_DATA[normalizedWord];

  const handlePlaySlowAudio = (rate: number = 0.75) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('المتصفح لا يدعم التسجيل الصوتي المباشر. يرجى تجربة Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenAttempt('');
        setScore(null);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript.toLowerCase().trim();
        setSpokenAttempt(result);
        setIsListening(false);
        evaluateAttempt(result);
      };

      recognition.onerror = (e: any) => {
        console.warn('Recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const evaluateAttempt = (attempt: string) => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      
      const cleanAttempt = attempt.replace(/[^a-zA-Z]/g, '');
      const cleanTarget = normalizedWord.replace(/[^a-zA-Z]/g, '');

      let calculatedScore = 70;
      if (cleanAttempt === cleanTarget) {
        calculatedScore = 96;
      } else if (cleanAttempt.includes(cleanTarget) || cleanTarget.includes(cleanAttempt)) {
        calculatedScore = 85;
      } else {
        // Calculate basic character match ratio
        let matches = 0;
        for (let i = 0; i < Math.min(cleanAttempt.length, cleanTarget.length); i++) {
          if (cleanAttempt[i] === cleanTarget[i]) matches++;
        }
        calculatedScore = Math.max(55, Math.round((matches / cleanTarget.length) * 100));
      }

      setScore(calculatedScore);

      if (calculatedScore >= 80) {
        setXpEarned(15);
        try {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        } catch {}
        // Award XP
        recordCompletedLesson(`drill_${normalizedWord}`, 15);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  تمرين التكرار والإتقان (Repeat & Master)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  +15 XP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                استمع لنطق الكلمة ببطء ثم كررها في المايك للحصول على تقييم نطق فوري.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phoneme Breakdown Card */}
        <PhonemeVisualizer
          word={word}
          showMouthGuide={true}
        />

        {/* Practice Audio Player Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">
              1. استمع للنطق النموذجي
            </span>
            <span className="text-[11px] text-slate-400">
              استمع للحروف الصامتة ونبرة الصوت قبل التكرار
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlaySlowAudio(0.7)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>0.7x بطيء</span>
            </button>
            <button
              onClick={() => handlePlaySlowAudio(1.0)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Volume2 className="w-4 h-4" />
              <span>1.0x عادي</span>
            </button>
          </div>
        </div>

        {/* Recording Section */}
        <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold text-slate-300">
            2. دورك الآن: اضغط وتحدث بوضوح
          </span>

          {/* Glowing Microphone Button */}
          <div className="relative">
            <button
              onClick={startListening}
              disabled={isListening || analyzing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-rose-600 text-white scale-110 shadow-rose-600/40 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white hover:scale-105 shadow-indigo-600/30'
              }`}
            >
              <Mic className="w-8 h-8" />
            </button>

            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-rose-400/60 animate-ping pointer-events-none" />
            )}
          </div>

          <p className="text-xs font-semibold text-slate-400">
            {isListening ? (
              <span className="text-rose-400 animate-pulse">جاري الاستماع لنطقك... تحدث الآن!</span>
            ) : analyzing ? (
              <span className="text-indigo-400">جاري تحليل مخارج الحروف الصوتية...</span>
            ) : (
              <span>اضغط على المايك ثم انطق: <strong className="text-white">"{word}"</strong></span>
            )}
          </p>

          {/* User Spoken Attempt & Result */}
          {spokenAttempt && (
            <div className="w-full pt-3 border-t border-slate-800/80 space-y-3">
              <div className="text-xs text-slate-400">
                <span>ما سمعناه منك: </span>
                <span className="text-white font-bold font-mono text-sm px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  "{spokenAttempt}"
                </span>
              </div>

              {score !== null && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  score >= 85
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : score >= 70
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      {score >= 85 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>نطق ممتاز ومطابق للأصل!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>جيد، ركز على مخارج الحروف الملونة بالأحمر</span>
                        </>
                      )}
                    </div>
                    {xpEarned > 0 && (
                      <span className="text-[11px] font-bold text-amber-300">
                        🎉 تم إضافة +{xpEarned} XP إلى رصيدك!
                      </span>
                    )}
                  </div>

                  <div className="text-center pl-2">
                    <div className="text-2xl font-black">{score}%</div>
                    <span className="text-[10px] uppercase font-bold opacity-75">الدقة</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              setSpokenAttempt('');
              setScore(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة من جديد</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition"
          >
            تم
          </button>
        </div>

      </div>
    </div>
  );
};
