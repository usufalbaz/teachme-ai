import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ChevronRight, Award, Compass, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { placementQuestions } from '../data/curriculum';
import { CEFRLevel } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_DETAILS: Record<CEFRLevel, { title: string; titleAr: string; desc: string; descAr: string; color: string }> = {
  A1: {
    title: 'A1 - Beginner',
    titleAr: 'A1 - مبتدئ',
    desc: 'Can understand basic phrases, introduce oneself, and ask simple daily questions.',
    descAr: 'يستطيع فهم واستخدام التعبيرات اليومية المألوفة والجمل البسيطة للتعريف بالنفس.',
    color: 'emerald',
  },
  A2: {
    title: 'A2 - Elementary',
    titleAr: 'A2 - أساسي',
    desc: 'Can communicate in routine tasks, describe background, immediate environment, and past events.',
    descAr: 'يستطيع التواصل في المهام الروتينية البسيطة ووصف محيطه المباشر وأحداث الماضي.',
    color: 'teal',
  },
  B1: {
    title: 'B1 - Intermediate',
    titleAr: 'B1 - متوسط',
    desc: 'Can handle most travel situations, connect phrases, and describe experiences and dreams.',
    descAr: 'يستطيع التعامل مع معظم مواقف السفر وسرد التجارب والآمال وإبداء الآراء.',
    color: 'sky',
  },
  B2: {
    title: 'B2 - Upper Intermediate',
    titleAr: 'B2 - فوق المتوسط',
    desc: 'Can interact fluently with native speakers and understand complex technical or abstract topics.',
    descAr: 'يستطيع التحدث بطلاقة وتلقائية مع المتحدثين الأصليين ومناقشة الموضوعات المعقدة.',
    color: 'indigo',
  },
  C1: {
    title: 'C1 - Advanced',
    titleAr: 'C1 - متقدم',
    desc: 'Can express ideas fluently, spontaneously, and flexibly for social, academic, and professional purposes.',
    descAr: 'يستطيع التعبير بطلاقة وعفوية بمرونة عالية للأغراض الاجتماعية والأكاديمية والمهنية.',
    color: 'purple',
  },
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfileLevel } = useAuth();
  const { language, t } = useLanguage();

  const [mode, setMode] = useState<'choose' | 'test' | 'result'>('choose');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [assignedLevel, setAssignedLevel] = useState<CEFRLevel>('A2');

  if (!isOpen) return null;

  const currentQ = placementQuestions[currentQIndex];

  const handleOptionSelect = (option: string) => {
    if (hasCheckedAnswer) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setHasCheckedAnswer(true);
    if (selectedOption === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < placementQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasCheckedAnswer(false);
    } else {
      // Calculate assigned level based on total score out of 5
      const finalScore = selectedOption === currentQ.correctAnswer ? score + 1 : score;
      let calculatedLevel: CEFRLevel = 'A1';
      if (finalScore >= 5) calculatedLevel = 'C1';
      else if (finalScore === 4) calculatedLevel = 'B2';
      else if (finalScore === 3) calculatedLevel = 'B1';
      else if (finalScore === 2) calculatedLevel = 'A2';
      else calculatedLevel = 'A1';

      setAssignedLevel(calculatedLevel);
      setMode('result');
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const handleSelectLevelDirectly = async (lvl: CEFRLevel) => {
    await updateProfileLevel(lvl);
    onClose();
  };

  const handleApplyAssignedLevel = async () => {
    await updateProfileLevel(assignedLevel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {t('onboardingTitle')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode: Choose or Direct Selection */}
        {mode === 'choose' && (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-slate-300">
              {t('onboardingDesc')}
            </p>

            <button
              onClick={() => {
                setMode('test');
                setCurrentQIndex(0);
                setScore(0);
                setSelectedOption(null);
                setHasCheckedAnswer(false);
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-600/20 hover:opacity-95 transition group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                <div className="text-left rtl:text-right">
                  <div className="text-base font-bold">{t('startTest')}</div>
                  <div className="text-xs text-indigo-200">5 adaptive diagnostic questions (2 mins)</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {t('skipTest')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['A1', 'A2', 'B1', 'B2', 'C1'] as CEFRLevel[]).map((lvl) => {
                  const info = LEVEL_DETAILS[lvl];
                  const isCurrent = profile?.level === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => handleSelectLevelDirectly(lvl)}
                      className={`p-3 rounded-2xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-sm text-white">
                          {language === 'ar' ? info.titleAr : info.title}
                        </span>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {language === 'ar' ? info.descAr : info.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mode: Diagnostic Test */}
        {mode === 'test' && currentQ && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Question {currentQIndex + 1} of {placementQuestions.length}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                Targeting: {currentQ.targetLevel}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentQIndex + 1) / placementQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <p className="text-base font-medium text-white mb-1">
                {currentQ.question}
              </p>
              {language === 'ar' && currentQ.questionAr && (
                <p className="text-xs text-indigo-300/80 font-sans">
                  {currentQ.questionAr}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options?.map((opt) => {
                const isSelected = selectedOption === opt;
                let optStyle = 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700';

                if (hasCheckedAnswer) {
                  if (opt === currentQ.correctAnswer) {
                    optStyle = 'border-emerald-500/80 bg-emerald-500/15 text-emerald-300 font-bold';
                  } else if (isSelected) {
                    optStyle = 'border-rose-500/80 bg-rose-500/15 text-rose-300 font-bold';
                  } else {
                    optStyle = 'opacity-40 border-slate-800 bg-slate-950/20 text-slate-500';
                  }
                } else if (isSelected) {
                  optStyle = 'border-indigo-500 bg-indigo-500/20 text-white font-semibold ring-1 ring-indigo-500';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className={`w-full p-3.5 rounded-xl border text-left rtl:text-right text-sm transition-all flex items-center justify-between ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {hasCheckedAnswer && opt === currentQ.correctAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after checking */}
            {hasCheckedAnswer && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-indigo-300 mb-0.5">Explanation:</p>
                <p>{language === 'ar' && currentQ.explanationAr ? currentQ.explanationAr : currentQ.explanation}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!hasCheckedAnswer ? (
                <button
                  disabled={!selectedOption}
                  onClick={handleCheckAnswer}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-sm font-semibold transition"
                >
                  {t('submitAnswer')}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition flex items-center gap-1.5"
                >
                  <span>{currentQIndex === placementQuestions.length - 1 ? t('completeTest') : t('nextQuestion')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode: Result */}
        {mode === 'result' && (
          <div className="mt-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white mb-1">
                {t('congratulations')}
              </h3>
              <p className="text-sm text-slate-400">
                Based on your diagnostic answers, your recommended CEFR starting level is:
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-indigo-500/30 max-w-sm mx-auto">
              <div className="text-4xl font-black text-indigo-400 mb-2">
                {assignedLevel}
              </div>
              <div className="text-base font-bold text-white mb-1">
                {language === 'ar' ? LEVEL_DETAILS[assignedLevel].titleAr : LEVEL_DETAILS[assignedLevel].title}
              </div>
              <p className="text-xs text-slate-300">
                {language === 'ar' ? LEVEL_DETAILS[assignedLevel].descAr : LEVEL_DETAILS[assignedLevel].desc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setMode('choose')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('switchLevel')}</span>
              </button>
              <button
                onClick={handleApplyAssignedLevel}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                Confirm & Start Learning
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
