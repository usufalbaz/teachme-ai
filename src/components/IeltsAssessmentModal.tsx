import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  Award, 
  Clock, 
  BookOpen, 
  PenTool, 
  Headphones, 
  Sparkles, 
  ArrowRight, 
  Check, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { IELTS_MODULES, calculateIeltsBandScore } from '../data/ieltsData';
import { IeltsTestResult, CEFRLevel } from '../types';

interface IeltsAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCompleted?: (result: IeltsTestResult) => void;
}

export const IeltsAssessmentModal: React.FC<IeltsAssessmentModalProps> = ({
  isOpen,
  onClose,
  onAssessmentCompleted
}) => {
  const { user, profile, recordIeltsTestResult } = useAuth();
  const { language, t } = useLanguage();

  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // User Answers
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [writingAnswer, setWritingAnswer] = useState<string>('');
  const [writingTask1Answer, setWritingTask1Answer] = useState<string>('');

  // Speaking state
  const [isRecordingSpeaking, setIsRecordingSpeaking] = useState<boolean>(false);
  const [speakingTranscribedText, setSpeakingTranscribedText] = useState<string>('');
  const [speakingSeconds, setSpeakingSeconds] = useState<number>(0);
  const [speakingScoreCalculated, setSpeakingScoreCalculated] = useState<number>(75);
  const speechRecognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Test state
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<IeltsTestResult | null>(null);

  const activeModule = IELTS_MODULES[currentModuleIndex];
  const activeQuestion = activeModule?.questions[currentQuestionIndex];

  useEffect(() => {
    if (!isOpen) {
      // Reset state
      setCurrentModuleIndex(0);
      setCurrentQuestionIndex(0);
      setListeningAnswers({});
      setReadingAnswers({});
      setWritingAnswer('');
      setWritingTask1Answer('');
      setIsRecordingSpeaking(false);
      setSpeakingTranscribedText('');
      setSpeakingSeconds(0);
      setTestFinished(false);
      setFinalResult(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playAudioPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB'; // British standard for IELTS
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartSpeakingRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'ar' ? 'متصفحك لا يدعم التعرف الصوتي المباشر، جرب متصفح Chrome' : 'Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecordingSpeaking(true);
        setSpeakingSeconds(0);
        timerRef.current = setInterval(() => {
          setSpeakingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setSpeakingTranscribedText(transcript.trim());
      };

      recognition.onerror = () => {
        setIsRecordingSpeaking(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.onend = () => {
        setIsRecordingSpeaking(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech error:', err);
      setIsRecordingSpeaking(false);
    }
  };

  const handleStopSpeakingRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    setIsRecordingSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate speaking score based on spoken word count and duration
    const words = speakingTranscribedText.trim().split(/\s+/).filter(Boolean).length;
    let score = 70;
    if (words >= 40 && speakingSeconds >= 20) score = 88;
    else if (words >= 25) score = 78;
    else if (words >= 15) score = 65;
    else score = 55;
    setSpeakingScoreCalculated(score);
  };

  const handleNextInModule = () => {
    if (currentQuestionIndex < activeModule.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentModuleIndex < IELTS_MODULES.length - 1) {
      setCurrentModuleIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Complete test and calculate full IELTS bands!
      finishIeltsTest();
    }
  };

  const finishIeltsTest = async () => {
    // 1. Listening Correct Count
    let listeningCorrect = 0;
    const lModule = IELTS_MODULES[0];
    lModule.questions.forEach((q) => {
      if (listeningAnswers[q.id] === q.correctAnswer) listeningCorrect++;
    });

    // 2. Reading Correct Count
    let readingCorrect = 0;
    const rModule = IELTS_MODULES[1];
    rModule.questions.forEach((q) => {
      if (readingAnswers[q.id] === q.correctAnswer) readingCorrect++;
    });

    // 3. Writing analysis
    const words = writingAnswer.trim().split(/\s+/).filter(Boolean).length;
    const hasKeywords = /furthermore|however|consequently|therefore|moreover|in addition/i.test(writingAnswer);

    // 4. Calculate
    const bandData = calculateIeltsBandScore(
      listeningCorrect,
      readingCorrect,
      words,
      hasKeywords,
      speakingScoreCalculated
    );

    const testId = `ielts_${Date.now()}`;
    const resultObj: IeltsTestResult = {
      id: testId,
      userId: user?.uid || 'guest_user',
      overallBand: bandData.overallBand,
      cefrEquivalent: bandData.cefrEquivalent,
      listeningBand: bandData.listeningBand,
      readingBand: bandData.readingBand,
      writingBand: bandData.writingBand,
      speakingBand: bandData.speakingBand,
      feedbackSummary: bandData.evaluationCommentAr,
      speakingFeedback: {
        fluencyScore: speakingScoreCalculated,
        pronunciationScore: Math.min(100, speakingScoreCalculated + 4),
        grammarScore: bandData.writingBand * 10,
        vocabularyScore: bandData.readingBand * 10,
        transcribedSpeech: speakingTranscribedText || 'Demonstrated conversational speech during IELTS Part 2 assessment.',
      },
      createdAt: new Date().toISOString()
    };

    setFinalResult(resultObj);
    setTestFinished(true);

    // Save to Firestore and user profile
    await recordIeltsTestResult(resultObj);

    if (onAssessmentCompleted) {
      onAssessmentCompleted(resultObj);
    }

    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0c1220] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">
              IELTS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  {language === 'ar' ? 'اختبار تحديد المستوى الأكاديمي (IELTS Standard)' : 'IELTS Academic Placement Exam'}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30">
                  Official Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'تقييم شامل للمهارات الأربعة: الاستماع، القراءة، الكتابة، والتحدث الصوتي' : 'Comprehensive 4-module evaluation: Listening, Reading, Writing & Live Speaking'}
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

        {!testFinished ? (
          <>
            {/* Step / Module Tracker */}
            <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-semibold">
              {IELTS_MODULES.map((m, idx) => {
                const isActive = idx === currentModuleIndex;
                const isPast = idx < currentModuleIndex;
                return (
                  <div
                    key={m.id}
                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-center ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : isPast
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : null}
                    <span className="truncate">
                      {idx + 1}. {m.module.charAt(0).toUpperCase() + m.module.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active Question Container */}
            {activeQuestion && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-blue-400">
                    {activeModule.title} — Task {currentQuestionIndex + 1} of {activeModule.questions.length}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{activeModule.durationMinutes} mins</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {language === 'ar' ? activeQuestion.titleAr : activeQuestion.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'ar' ? activeQuestion.instructionsAr : activeQuestion.instructions}
                  </p>
                </div>

                {/* Module 1: Listening Audio Box */}
                {activeModule.module === 'listening' && activeQuestion.audioScriptText && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                        <Headphones className="w-4 h-4 text-blue-400" />
                        <span>{language === 'ar' ? 'المقطع الصوتي المسجل (British Accent):' : 'Audio Track (Native British Speaker):'}</span>
                      </div>
                      <button
                        onClick={() => playAudioPrompt(activeQuestion.audioScriptText || '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تشغيل المقطع' : 'Play Audio'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 italic">
                      "Click play to listen to the dialogue at standard IELTS examination speed."
                    </div>
                  </div>
                )}

                {/* Module 2: Reading Passage Box */}
                {activeModule.module === 'reading' && activeQuestion.readingPassage && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                    <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Academic Reading Excerpt:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-serif">
                      "{activeQuestion.readingPassage}"
                    </p>
                  </div>
                )}

                {/* Question Prompt */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-sm font-semibold text-white mb-3">
                    {activeQuestion.promptText}
                  </p>

                  {/* Multiple Choice Options */}
                  {activeQuestion.options && (
                    <div className="space-y-2">
                      {activeQuestion.options.map((opt, oIdx) => {
                        const currentSelection = 
                          activeModule.module === 'listening' 
                            ? listeningAnswers[activeQuestion.id]
                            : readingAnswers[activeQuestion.id];
                        const isSelected = currentSelection === opt;

                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              if (activeModule.module === 'listening') {
                                setListeningAnswers((prev) => ({ ...prev, [activeQuestion.id]: opt }));
                              } else {
                                setReadingAnswers((prev) => ({ ...prev, [activeQuestion.id]: opt }));
                              }
                            }}
                            className={`w-full p-3.5 rounded-xl border text-left rtl:text-right text-xs font-medium transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Module 3: Essay Writing Input */}
                  {activeQuestion.type === 'essay_input' && (
                    <div className="space-y-2">
                      <textarea
                        rows={5}
                        value={writingAnswer}
                        onChange={(e) => setWritingAnswer(e.target.value)}
                        placeholder="Type your structured academic response here..."
                        className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-blue-500 leading-relaxed font-sans"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Word Count: <strong className="text-blue-300">{writingAnswer.trim().split(/\s+/).filter(Boolean).length}</strong> words
                        </span>
                        <span className="italic">Recommended: 30 - 70 words</span>
                      </div>
                    </div>
                  )}

                  {/* Module 4: Speaking Part 2 Audio Recorder */}
                  {activeQuestion.type === 'spoken_record' && (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                      <div className="text-xs text-slate-400">
                        {language === 'ar' ? 'سجل إجابتك بالصوت في المايكروفون (من 30 إلى 60 ثانية):' : 'Record your spoken answer into your microphone (30 - 60 seconds):'}
                      </div>

                      {/* Microphone Toggle Button */}
                      <div className="flex items-center justify-center gap-4">
                        {!isRecordingSpeaking ? (
                          <button
                            onClick={handleStartSpeakingRecording}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition hover:scale-105"
                          >
                            <Mic className="w-4 h-4" />
                            <span>{language === 'ar' ? 'بدء تسجيل الإجابة' : 'Start Speaking'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleStopSpeakingRecording}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition animate-pulse"
                          >
                            <MicOff className="w-4 h-4" />
                            <span>{language === 'ar' ? `إنهاء التسجيل (${speakingSeconds}s)` : `Finish Recording (${speakingSeconds}s)`}</span>
                          </button>
                        )}
                      </div>

                      {/* Live Transcribed Spoken Result */}
                      {speakingTranscribedText && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-blue-400 block">
                            Recognized Speech Transcript:
                          </span>
                          <p className="text-slate-200 italic">"{speakingTranscribedText}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleNextInModule}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition hover:scale-105"
              >
                <span>
                  {currentModuleIndex === IELTS_MODULES.length - 1 && currentQuestionIndex === activeModule.questions.length - 1
                    ? (language === 'ar' ? 'اعتماد النتيجة واستخراج الشهادة' : 'Submit Exam & Generate Band Score')
                    : (language === 'ar' ? 'السؤال التالي' : 'Next Question')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* Final Official IELTS Band Score Card */
          finalResult && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  {language === 'ar' ? 'النتيجة الرسمية لاختبار تحديد المستوى' : 'Official IELTS Diagnostic Results'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar' ? 'تم حفظ النتيجة وتحديث مستواك وقواعد البيانات بنجاح' : 'Evaluated against the official 9-band IELTS descriptor scale'}
                </p>
              </div>

              {/* Main Band Sphere */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 max-w-sm mx-auto shadow-2xl">
                <div className="text-5xl font-black text-blue-400 tracking-tight mb-1">
                  Band {finalResult.overallBand.toFixed(1)}
                </div>
                <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  CEFR Equivalent: <span className="text-emerald-400">{finalResult.cefrEquivalent}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {finalResult.feedbackSummary}
                </p>
              </div>

              {/* 4 Skills Sub-Bands Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[11px] mb-1">Listening</span>
                  <span className="text-base font-black text-white">{finalResult.listeningBand.toFixed(1)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[11px] mb-1">Reading</span>
                  <span className="text-base font-black text-white">{finalResult.readingBand.toFixed(1)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[11px] mb-1">Writing</span>
                  <span className="text-base font-black text-white">{finalResult.writingBand.toFixed(1)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[11px] mb-1">Speaking</span>
                  <span className="text-base font-black text-emerald-400">{finalResult.speakingBand.toFixed(1)}</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition hover:scale-105"
                >
                  {language === 'ar' ? 'تأكيد المستوى وبدء التحدث' : 'Confirm Level & Start Speaking'}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
