import React from 'react';
import { 
  Award, 
  Flame, 
  Clock, 
  Mic, 
  CheckCircle2, 
  Star, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AchievementsView: React.FC<{ onStartVoiceCall: () => void; onOpenIeltsTest: () => void }> = ({
  onStartVoiceCall,
  onOpenIeltsTest
}) => {
  const { profile } = useAuth();
  const { language, t } = useLanguage();

  const streak = profile?.streak || 1;
  const xp = profile?.xp || 0;
  const level = profile?.level || 'B1';
  const ieltsBand = profile?.ieltsBand || (level === 'C1' ? 8.0 : level === 'B2' ? 7.0 : level === 'B1' ? 6.0 : level === 'A2' ? 5.0 : 4.0);

  const badges = [
    {
      id: 'badge_ielts',
      title: 'IELTS Band Verified',
      titleAr: 'شهادة الآيلتس المعتمدة',
      desc: `Diagnosed at official Band ${ieltsBand.toFixed(1)} (${level} CEFR).`,
      descAr: `تم اجتياز اختبار الآيلتس بنتيجة Band ${ieltsBand.toFixed(1)} (مستوى ${level}).`,
      icon: 'Award',
      unlocked: true,
      category: 'Academic'
    },
    {
      id: 'badge_streak_7',
      title: 'Consistency Sentinel',
      titleAr: 'محارب الاستمرارية اليومية',
      desc: 'Maintained an active conversational practice streak.',
      descAr: 'الحفاظ على عادة التحدث اليومي وتثبيت النطق باستمرار.',
      icon: 'Flame',
      unlocked: streak >= 3,
      category: 'Dedication'
    },
    {
      id: 'badge_speaking_hours',
      title: 'Fluency Prodigy',
      titleAr: 'رواد الطلاقة الصوتية',
      desc: 'Completed live AI voice calls across corporate and casual scenarios.',
      descAr: 'إجراء محادثات صوتية حية مع مدربي الذكاء الاصطناعي دون انقطاع.',
      icon: 'Mic',
      unlocked: true,
      category: 'Speaking'
    },
    {
      id: 'badge_accent',
      title: 'Phonetic Master',
      titleAr: 'متقن مخارج الحروف الإنجليزية',
      desc: 'Mastered unvoiced plosives (/p/) and dental fricatives (/th/).',
      descAr: 'تجاوز أخطاء النطق الشائعة للناطقين بالعربية وتعديل حركة اللسان والشفاه.',
      icon: 'Sparkles',
      unlocked: xp >= 100,
      category: 'Pronunciation'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
            Official Learner Portfolio
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            Active Band {ieltsBand.toFixed(1)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {language === 'ar' ? 'الإنجازات والشهادات الأكاديمية' : 'Achievements & Milestones'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {language === 'ar' 
            ? 'سجل اعتماد مهارات التحدث بالإنجليزية وفق المعايير الأكاديمية الدولية ودرجات الآيلتس'
            : 'Verified progression tracking across IELTS descriptors, spoken fluency hours, and phonetic precision.'}
        </p>
      </div>

      {/* Hero Official Band Certificate Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e1628] via-[#090d18] to-[#0b1120] border border-blue-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>International CEFR & IELTS Recognition</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {language === 'ar' ? `المستوى الأكاديمي الحالي: ${level} (Band ${ieltsBand.toFixed(1)})` : `Verified Fluency: CEFR ${level} (IELTS Band ${ieltsBand.toFixed(1)})`}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {language === 'ar'
                ? 'تم تقييم أدائك الصوتي بدقة بواسطة نماذج الذكاء الاصطناعي العصبية لمعايير النطق والطلاقة وبناء الجمل الأكاديمية.'
                : 'Assessed with real-time acoustic neural models evaluating lexical cohesion, unvoiced plosive articulation, and spontaneous speaking velocity.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenIeltsTest}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition hover:scale-105 flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>{language === 'ar' ? 'إعادة اختبار الآيلتس' : 'Retake IELTS Test'}</span>
            </button>
            <button
              onClick={onStartVoiceCall}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4 text-blue-400" />
              <span>{language === 'ar' ? 'بدء جلسة تحدث' : 'Practice Speaking'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">IELTS Band</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">{ieltsBand.toFixed(1)}</div>
          <p className="text-[10px] text-slate-500">Official Diagnostic Score</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Daily Streak</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-emerald-400 text-emerald-400" />
            <span>{streak}d</span>
          </div>
          <p className="text-[10px] text-slate-500">Consistent Habit</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Experience</span>
          <div className="text-2xl sm:text-3xl font-black text-white">{xp} <span className="text-xs text-blue-400">XP</span></div>
          <p className="text-[10px] text-slate-500">Voice Practice Points</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">CEFR Grade</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-400">{level}</div>
          <p className="text-[10px] text-slate-500">Active Curriculum</p>
        </div>
      </div>

      {/* Badges List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          {language === 'ar' ? 'أوسمة الإتقان اللغوي المعتمدة' : 'Unlocked Competency Badges'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                b.unlocked 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-200' 
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className={`p-3 rounded-2xl shrink-0 ${
                b.unlocked ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-900 text-slate-600'
              }`}>
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {language === 'ar' ? b.titleAr : b.title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {b.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'ar' ? b.descAr : b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
