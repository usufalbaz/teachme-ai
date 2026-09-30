import React from 'react';
import { 
  Check, 
  Lock, 
  Play, 
  Star, 
  Compass, 
  Mic, 
  Award,
  ChevronRight,
  BookOpen,
  Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { curriculumUnits } from '../data/curriculum';
import { Lesson, CEFRLevel } from '../types';

interface RoadmapViewProps {
  onSelectLesson: (lesson: Lesson) => void;
  onStartVoiceCall: () => void;
  onOpenPlacementTest: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  onSelectLesson,
  onStartVoiceCall,
  onOpenPlacementTest,
}) => {
  const { profile } = useAuth();
  const { language, t } = useLanguage();

  const userLevel = profile?.level || 'A1';
  const completedIds = profile?.completedLessonIds || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      
      {/* Hero Banner / Practice Call Hook */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass-elevated border border-white/15 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-pill text-indigo-300 text-xs font-semibold">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>محادثات وتدريب صوتي فوري بالذكاء الاصطناعي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('readyToSpeak')}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              تحدث بالإنجليزية بصوتك في سيناريوهات واقعية مع كوتش باللهجة المصرية يصححلك مخارج الحروف فورياً ويفهمك بكل سلاسة وبدون أي إحراج.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={onStartVoiceCall}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all"
            >
              <Mic className="w-4 h-4 fill-slate-950" />
              <span>{t('startVoiceCall')}</span>
            </button>

            <button
              onClick={onOpenPlacementTest}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl liquid-button text-slate-200 text-xs font-semibold transition"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>{t('levelPlacementTest')}</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Curriculum Roadmap Tree */}
      <div className="space-y-16">
        {curriculumUnits.map((unit) => {
          const isUserUnit = unit.level === userLevel;

          return (
            <div key={unit.id} className="space-y-8">
              
              {/* Unit Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl liquid-card border border-white/[0.08]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-black text-indigo-300 text-lg shadow-inner">
                    U{unit.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/[0.08] border border-white/10 text-slate-200">
                        {unit.level}
                      </span>
                      <h2 className="text-lg font-bold text-white">
                        {language === 'ar' ? unit.titleAr : unit.title}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'ar' ? unit.descriptionAr : unit.description}
                    </p>
                  </div>
                </div>

                {isUserUnit && (
                  <span className="self-start sm:self-center px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold animate-pulse">
                    المستوى الحالي لطالب
                  </span>
                )}
              </div>

              {/* Node-based sequential layout (Duolingo style) */}
              <div className="relative py-4 flex flex-col items-center gap-8">
                
                {/* Connecting dotted central path line */}
                <div className="absolute top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500/30 via-slate-800 to-indigo-500/30 rounded-full" />

                {unit.lessons.map((lesson, idx) => {
                  const isLessonDone = completedIds.includes(lesson.id);
                  // Calculate zigzag offset: 0 -> center, 1 -> left, 2 -> right
                  const offsetClass = idx % 2 === 0 ? 'sm:-translate-x-12' : 'sm:translate-x-12';

                  return (
                    <div
                      key={lesson.id}
                      className={`relative z-10 flex flex-col items-center transition-all ${offsetClass}`}
                    >
                      {/* Interactive Node Button */}
                      <button
                        onClick={() => onSelectLesson(lesson)}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 group ${
                          isLessonDone
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30 ring-4 ring-emerald-500/20'
                            : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-600/40 ring-4 ring-indigo-500/20'
                        }`}
                      >
                        {isLessonDone ? (
                          <Check className="w-8 h-8 stroke-[3]" />
                        ) : (
                          <BookOpen className="w-8 h-8 stroke-[2.5]" />
                        )}

                        {/* Floating XP pill */}
                        <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-extrabold text-indigo-300 shadow">
                          +{lesson.xpReward} XP
                        </div>
                      </button>

                      {/* Node Label card */}
                      <div className="mt-4 text-center max-w-[220px]">
                        <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-indigo-300 transition">
                          {language === 'ar' ? lesson.titleAr : lesson.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {lesson.estimatedMinutes} mins • {lesson.category}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
