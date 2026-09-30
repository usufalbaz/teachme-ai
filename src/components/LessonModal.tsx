import React, { useState, useRef } from 'react';
import { 
  X, 
  Volume2, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle, 
  ChevronRight,
  Mic,
  MicOff,
  PhoneCall,
  Award,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lesson, QuizQuestion } from '../types';

interface LessonModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onStartVoiceCall?: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ 
  lesson, 
  isOpen, 
  onClose,
  onStartVoiceCall 
}) => {
  const { profile, recordCompletedLesson } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Interactive Live Microphone Practice State
  const [activeRecordingIdx, setActiveRecordingIdx] = useState<number | null>(null);
  const [userSpokenAttempt, setUserSpokenAttempt] = useState<Record<number, { text: string; score: number }>>({});
  const speechRecognitionRef = useRef<any>(null);

  if (!isOpen || !lesson) return null;

  const isCompleted = profile?.completedLessonIds?.includes(lesson.id) || false;
  const currentQuiz = lesson.quizzes[currentQuizIdx];

  const handleSpeakSentence = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSentenceRecording = (idx: number, targetSentence: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('ميزة الميكروفون مدعومة في متصفح Chrome أو Edge');
      return;
    }

    if (activeRecordingIdx === idx) {
      // Stop
      try {
        speechRecognitionRef.current?.stop();
      } catch {}
      setActiveRecordingIdx(null);
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setActiveRecordingIdx(idx);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0]?.[0]?.transcript || '';
        const targetClean = targetSentence.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        const spokenClean = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

        // Calculate simple word accuracy
        const targetWords = targetClean.split(/\s+/);
        const spokenWords = spokenClean.split(/\s+/);
        let matchCount = 0;
        for (const w of targetWords) {
          if (spokenWords.includes(w)) matchCount++;
        }
        const score = Math.round((matchCount / Math.max(1, targetWords.length)) * 100);

        setUserSpokenAttempt((prev) => ({
          ...prev,
          [idx]: { text: spoken, score: Math.max(60, Math.min(100, score)) }
        }));

        if (score >= 70) {
          try {
            confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
          } catch {}
        }
        setActiveRecordingIdx(null);
      };

      recognition.onerror = () => {
        setActiveRecordingIdx(null);
      };

      recognition.onend = () => {
        setActiveRecordingIdx(null);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition error:', e);
      setActiveRecordingIdx(null);
    }
  };

  const handleCheckQuizAnswer = () => {
    if (!currentQuiz) return;
    setHasAnswered(true);

    const isCorrect = currentQuiz.type === 'fill_in_blank'
      ? fillBlankInput.trim().toLowerCase() === currentQuiz.correctAnswer.trim().toLowerCase()
      : selectedOption === currentQuiz.correctAnswer;

    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = async () => {
    if (currentQuizIdx < lesson.quizzes.length - 1) {
      setCurrentQuizIdx((prev) => prev + 1);
      setSelectedOption(null);
      setFillBlankInput('');
      setHasAnswered(false);
    } else {
      setQuizFinished(true);
      const passed = quizScore + (selectedOption === currentQuiz?.correctAnswer || fillBlankInput.trim().toLowerCase() === currentQuiz?.correctAnswer.toLowerCase() ? 1 : 0) >= Math.ceil(lesson.quizzes.length / 2);
      if (passed) {
        await recordCompletedLesson(lesson.id, lesson.xpReward);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        } catch {}
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedOption(null);
    setFillBlankInput('');
    setHasAnswered(false);
    setQuizScore(0);
    setQuizFinished(false);
    setActiveTab('quiz');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl liquid-glass-elevated border border-white/15 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-extrabold text-xs border border-indigo-500/30">
              {lesson.level}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {language === 'ar' ? lesson.titleAr : lesson.title}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? lesson.descriptionAr : lesson.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl liquid-pill text-slate-400 hover:text-white hover:border-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 px-6 pt-4 border-b border-white/[0.08] text-sm font-semibold">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'content'
                ? 'border-indigo-400 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'ar' ? 'المختبر الصوتي والشرح' : 'Spoken Rules & Articulation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'quiz'
                ? 'border-indigo-400 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t('takeQuiz')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              +{lesson.xpReward} XP
            </span>
          </button>
        </div>

        {/* Tab 1: Interactive Spoken Rules & Micro-Coach */}
        {activeTab === 'content' && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
            
            {/* Live Practice Action Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-violet-900/30 to-slate-900/50 border border-indigo-400/20 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <PhoneCall className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'ar' ? 'مارس هذا الدرس مباشرة مع الكوتش الصوتي' : 'Practice this topic in a live voice call'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {language === 'ar' ? 'الكوتش هيدخل معاك في محادثة مباشرة باللهجة المصرية لتثبيت الجمل ديه' : 'AI coach will practice these exact phrases with you in real-time'}
                  </p>
                </div>
              </div>

              {onStartVoiceCall && (
                <button
                  onClick={onStartVoiceCall}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/25 transition hover:scale-105 shrink-0 flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4 fill-slate-950" />
                  <span>{language === 'ar' ? 'ابدأ المكالمة الآن' : 'Start Live Call'}</span>
                </button>
              )}
            </div>

            {/* Grammar & Articulation Cards */}
            {lesson.grammarRules.map((rule, idx) => (
              <div key={idx} className="p-5 sm:p-6 rounded-2xl liquid-card border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">
                    {language === 'ar' ? rule.ruleTitleAr : rule.ruleTitle}
                  </h3>
                  {rule.formula && (
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-xs font-mono">
                      {rule.formula}
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {language === 'ar' ? rule.explanationAr : rule.explanation}
                </p>

                {/* Egyptian Articulatory Tip Box */}
                <div className="p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-1">
                      {language === 'ar' ? '💡 سر النطق للمصريين بالعامية:' : '💡 Articulation Pro Tip:'}
                    </span>
                    <span>
                      {language === 'ar' 
                        ? 'انتبه لمخارج الحروف: متضغطش على شفايفك زيادة عن اللزوم، واخرج هوا خفيف مع حرف الـ P والـ T عشان تطلع النبرة الأمريكية الطبيعية وما تتقلبش B أو D.'
                        : 'Keep your tongue relaxed. Ensure gentle airflow on unvoiced plosives (/p/, /t/) to maintain authentic cadence.'}
                    </span>
                  </div>
                </div>

                {/* Interactive Spoken Examples with Voice Recording */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                    <span>{language === 'ar' ? 'تمرن على النطق بصوتك (استمع ثم سجل):' : 'Spoken Practice (Listen & Record):'}</span>
                    <span className="text-[11px] text-indigo-400 font-normal">
                      {language === 'ar' ? 'اضغط 🎤 وقيم دقة نطقك' : 'Tap 🎤 to test accuracy'}
                    </span>
                  </div>

                  {rule.examples.map((ex, exIdx) => {
                    const uniqueSentenceKey = idx * 10 + exIdx;
                    const attempt = userSpokenAttempt[uniqueSentenceKey];
                    const isRecordingThis = activeRecordingIdx === uniqueSentenceKey;

                    return (
                      <div
                        key={exIdx}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-indigo-400/30 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{ex.en}</span>
                              {ex.phonetic && (
                                <span className="text-xs font-mono text-indigo-300/80 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                  {ex.phonetic}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {ex.ar}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Listen Button */}
                            <button
                              onClick={() => handleSpeakSentence(ex.en)}
                              className="p-2.5 rounded-xl liquid-pill text-indigo-300 hover:text-white hover:bg-indigo-600 transition"
                              title="استمع للنطق الأمريكي الأصلي"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            {/* Record Button */}
                            <button
                              onClick={() => startSentenceRecording(uniqueSentenceKey, ex.en)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition ${
                                isRecordingThis
                                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                                  : 'liquid-pill text-slate-200 hover:text-white hover:border-white/20'
                              }`}
                              title="سجل نطقك بالمايك"
                            >
                              {isRecordingThis ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-400" />}
                              <span>{isRecordingThis ? 'جاري الاستماع...' : (language === 'ar' ? 'انطق' : 'Speak')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Spoken feedback result if tested */}
                        {attempt && (
                          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">{language === 'ar' ? 'سمعناك بتقول:' : 'You said:'}</span>
                              <span className="text-slate-200 font-semibold italic">"{attempt.text}"</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                attempt.score >= 80 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {attempt.score}% {attempt.score >= 80 ? 'نطق ممتاز! 🎉' : 'حاول مرة تانية 💪'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Action to Quiz */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('quiz')}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition hover:scale-105"
              >
                <span>{t('takeQuiz')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* Tab 2: Interactive Quiz */}
        {activeTab === 'quiz' && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
            {!quizFinished && currentQuiz ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>سؤال {currentQuizIdx + 1} من {lesson.quizzes.length}</span>
                  <span className="text-indigo-400 font-bold">المكافأة: +{lesson.xpReward} XP</span>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl liquid-card border border-white/[0.08] space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                      {currentQuiz.question}
                    </h3>
                    <button
                      onClick={() => handleSpeakSentence(currentQuiz.question)}
                      className="p-2 rounded-xl liquid-pill text-indigo-400 hover:text-white shrink-0"
                      title="استمع للسؤال"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {currentQuiz.questionAr && (
                    <p className="text-xs text-slate-400">
                      {currentQuiz.questionAr}
                    </p>
                  )}

                  {/* Multiple Choice Options */}
                  {currentQuiz.type === 'multiple_choice' && currentQuiz.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {currentQuiz.options.map((opt, oIdx) => {
                        let btnStyle = 'liquid-pill text-slate-200 hover:border-white/20';
                        if (hasAnswered) {
                          if (opt === currentQuiz.correctAnswer) {
                            btnStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
                          } else if (selectedOption === opt) {
                            btnStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                          }
                        } else if (selectedOption === opt) {
                          btnStyle = 'bg-indigo-600/30 text-indigo-200 border-indigo-400/50';
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={hasAnswered}
                            onClick={() => setSelectedOption(opt)}
                            className={`p-3.5 rounded-2xl text-sm font-semibold text-left transition flex items-center justify-between border ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {hasAnswered && opt === currentQuiz.correctAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in Blank Option */}
                  {currentQuiz.type === 'fill_in_blank' && (
                    <div className="pt-2 space-y-3">
                      <input
                        type="text"
                        disabled={hasAnswered}
                        value={fillBlankInput}
                        onChange={(e) => setFillBlankInput(e.target.value)}
                        placeholder="اكتب الإجابة هنا..."
                        className="w-full px-4 py-3 rounded-2xl liquid-input text-white text-sm outline-none"
                      />
                    </div>
                  )}

                  {/* Explanation upon answer */}
                  {hasAnswered && (
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 space-y-1">
                      <span className="font-bold text-white block">
                        {language === 'ar' ? 'التوضيح النحوي والصوتي:' : 'Explanation:'}
                      </span>
                      <p>{language === 'ar' ? currentQuiz.explanationAr : currentQuiz.explanation}</p>
                    </div>
                  )}
                </div>

                {/* Quiz Bottom Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveTab('content')}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
                  >
                    {language === 'ar' ? 'الرجوع للشرح' : 'Back to Rules'}
                  </button>

                  {!hasAnswered ? (
                    <button
                      onClick={handleCheckQuizAnswer}
                      disabled={currentQuiz.type === 'fill_in_blank' ? !fillBlankInput.trim() : !selectedOption}
                      className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition"
                    >
                      {language === 'ar' ? 'تحقق من الإجابة' : 'Check Answer'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuiz}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/25"
                    >
                      {currentQuizIdx < lesson.quizzes.length - 1 
                        ? (language === 'ar' ? 'السؤال التالي' : 'Next Question')
                        : (language === 'ar' ? 'إنهاء الاختبار' : 'Finish Quiz')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Quiz Finished View */
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {language === 'ar' ? 'أحسنت يا بطل! تم إكمال الاختبار' : 'Quiz Completed!'}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {language === 'ar' 
                      ? `نتيجتك: ${quizScore} من ${lesson.quizzes.length} • وحصلت على +${lesson.xpReward} XP`
                      : `Score: ${quizScore} of ${lesson.quizzes.length} • Earned +${lesson.xpReward} XP`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={handleRestartQuiz}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl liquid-pill text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إعادة الاختبار' : 'Retake Quiz'}</span>
                  </button>

                  {onStartVoiceCall && (
                    <button
                      onClick={onStartVoiceCall}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                    >
                      <Mic className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{language === 'ar' ? 'تحدث مع الكوتش الآن' : 'Speak with Coach'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
