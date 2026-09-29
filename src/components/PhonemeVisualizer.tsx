import React from 'react';
import { Volume2, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

export interface PhonemeBreakdown {
  letterGroup: string;
  ipa: string;
  status: 'correct' | 'warning' | 'error';
  articulatoryNote?: string;
  egyptianTip?: string;
}

// Pre-mapped phonemic articulatory data for high-frequency English practice words
export const PHONEME_DATA: Record<string, {
  fullIpa: string;
  phonemes: PhonemeBreakdown[];
  generalEgyptianTip: string;
  mouthGuide: {
    lips: string;
    tongue: string;
    vocalCords: string;
  };
}> = {
  passport: {
    fullIpa: '/ˈpɑːspɔːt/',
    generalEgyptianTip: 'في مصر بننطق الـ P كأنها B. لازم تقفل الشفايف وتطلع دفعة هواء خفيفة كأنك بتطفي شمعة!',
    mouthGuide: {
      lips: 'الشفتان مغلقتان تماماً ثم تفتحان مع انفجار هواء خفيف',
      tongue: 'مسترخٍ في قاع الفم',
      vocalCords: 'بدون اهتزاز حبال صوتية في الـ /p/ (Voiceless)',
    },
    phonemes: [
      { letterGroup: 'p', ipa: '/p/', status: 'error', articulatoryNote: 'Bilabial plosive with air burst', egyptianTip: 'دفعة هواء قوية مع الشفتين' },
      { letterGroup: 'a', ipa: '/ɑː/', status: 'correct', articulatoryNote: 'Long open back vowel' },
      { letterGroup: 'ss', ipa: '/s/', status: 'correct', articulatoryNote: 'Alveolar fricative' },
      { letterGroup: 'p', ipa: '/p/', status: 'error', articulatoryNote: 'Second burst required', egyptianTip: 'مش b تانية!' },
      { letterGroup: 'or', ipa: '/ɔː/', status: 'correct', articulatoryNote: 'Open-mid back rounded vowel' },
      { letterGroup: 't', ipa: '/t/', status: 'correct', articulatoryNote: 'Crisp alveolar stop' },
    ],
  },
  receipt: {
    fullIpa: '/rɪˈsiːt/',
    generalEgyptianTip: 'حرف الـ P صامت تماماً (Silent)! بتتنطق "ري-سيت" زي كلمة repeat بالظبط.',
    mouthGuide: {
      lips: 'مبتسمة ومسترخية لصوت الـ /iː/ الطويل',
      tongue: 'مرتفع للأمام قرب سقف الحلق',
      vocalCords: 'اهتزاز طبيعي مع المد',
    },
    phonemes: [
      { letterGroup: 're', ipa: '/rɪ/', status: 'correct', articulatoryNote: 'Short unstressed vowel' },
      { letterGroup: 'cei', ipa: '/siː/', status: 'correct', articulatoryNote: 'Sharp /s/ + long /iː/' },
      { letterGroup: 'p', ipa: '—', status: 'error', articulatoryNote: 'SILENT LETTER (Do not pronounce!)', egyptianTip: 'حرف سايلنت أوعى تنطقه!' },
      { letterGroup: 't', ipa: '/t/', status: 'correct', articulatoryNote: 'Sharp final stop' },
    ],
  },
  thought: {
    fullIpa: '/θɔːt/',
    generalEgyptianTip: 'صوت الـ TH هنا زي حرف الثاء في العربي. طلع طرف لسانك بين أسنانك وماتنطقهاش S ولا T!',
    mouthGuide: {
      lips: 'شبه دائرية لصوت الـ /ɔː/ الطويل',
      tongue: 'طرف اللسان يبرز قليلاً بين الأسنان العلوية والسفلية',
      vocalCords: 'بدون اهتزاز للصوت الأول (Voiceless dental)',
    },
    phonemes: [
      { letterGroup: 'th', ipa: '/θ/', status: 'error', articulatoryNote: 'Dental fricative (tongue between teeth)', egyptianTip: 'طرف اللسان بره بين السنان' },
      { letterGroup: 'ough', ipa: '/ɔː/', status: 'warning', articulatoryNote: 'Broad rounded vowel sound' },
      { letterGroup: 't', ipa: '/t/', status: 'correct', articulatoryNote: 'Alveolar stop' },
    ],
  },
  achievement: {
    fullIpa: '/əˈtʃiːvmənt/',
    generalEgyptianTip: 'صوت الـ ch بيتنطق "تش" قوي بدمج صوت الـ t مع الـ sh مش شين عادية.',
    mouthGuide: {
      lips: 'مستديرة ومبرومة قليلاً للأمام',
      tongue: 'يلامس الحنك الصلب ثم ينزل سريعاً مصدراً صوت /tʃ/',
      vocalCords: 'بدون اهتزاز في الـ affricate',
    },
    phonemes: [
      { letterGroup: 'a', ipa: '/ə/', status: 'correct', articulatoryNote: 'Neutral schwa' },
      { letterGroup: 'ch', ipa: '/tʃ/', status: 'error', articulatoryNote: 'Voiceless postalveolar affricate', egyptianTip: 'تش مش شين' },
      { letterGroup: 'ieve', ipa: '/iːv/', status: 'correct', articulatoryNote: 'Long /iː/ followed by voiced /v/' },
      { letterGroup: 'ment', ipa: '/mənt/', status: 'correct', articulatoryNote: 'Weak unstressed suffix' },
    ],
  },
  weather: {
    fullIpa: '/ˈweð.ər/',
    generalEgyptianTip: 'حرف الـ TH هنا بيتنطق "ذال" رنانة /ð/ مع اهتزاز الأحبال الصوتية مش Z أبداً!',
    mouthGuide: {
      lips: 'مفتوحة باسترخاء',
      tongue: 'طرف اللسان يلمس حافة القواطع العلوية مع اهتزاز',
      vocalCords: 'تهتز بوضوح (Voiced dental fricative)',
    },
    phonemes: [
      { letterGroup: 'w', ipa: '/w/', status: 'correct', articulatoryNote: 'Bilabial glide' },
      { letterGroup: 'ea', ipa: '/e/', status: 'correct', articulatoryNote: 'Short mid-front vowel' },
      { letterGroup: 'th', ipa: '/ð/', status: 'error', articulatoryNote: 'Voiced dental fricative', egyptianTip: 'صوت الذال مع رنين حبال صوتية' },
      { letterGroup: 'er', ipa: '/ər/', status: 'correct', articulatoryNote: 'Schwa with rhotic coloring' },
    ],
  },
  comfortable: {
    fullIpa: '/ˈkʌmftəbl/',
    generalEgyptianTip: 'بتتنطق 3 مقاطع بس: "كَمف-تَر-بِل" وأسقط حرف الـ o والتاني خالص.',
    mouthGuide: {
      lips: 'تضم بسرعة عند حرف الـ f',
      tongue: 'حركة سريعة ومختصرة للمقاطع',
      vocalCords: 'اهتزاز طبيعي',
    },
    phonemes: [
      { letterGroup: 'com', ipa: '/kʌmf/', status: 'warning', articulatoryNote: '3 syllables only' },
      { letterGroup: 'for', ipa: '—', status: 'error', articulatoryNote: 'Omitted vowel (Elision)', egyptianTip: 'المقطع ده محذوف في النطق السريع' },
      { letterGroup: 'ta', ipa: '/tə/', status: 'correct', articulatoryNote: 'Neutral schwa' },
      { letterGroup: 'ble', ipa: '/bl/', status: 'correct', articulatoryNote: 'Syllabic L' },
    ],
  },
};

interface PhonemeVisualizerProps {
  word: string;
  onPracticeClick?: () => void;
  showMouthGuide?: boolean;
}

export const PhonemeVisualizer: React.FC<PhonemeVisualizerProps> = ({
  word,
  onPracticeClick,
  showMouthGuide = true,
}) => {
  const normalizedKey = word.toLowerCase().trim();
  const data = PHONEME_DATA[normalizedKey] || {
    fullIpa: `/${normalizedKey}/`,
    generalEgyptianTip: 'ركز على مخارج الحروف الشائعة وخروج الهواء الصحيح.',
    mouthGuide: {
      lips: 'شفتان مرتاحتان وتتحركان بمرونة حسب نوع الحرف الصوتي',
      tongue: 'طرف اللسان يتحكم في مخارج الحروف الأمامية والخلفية',
      vocalCords: 'اهتزاز طبيعي مع الحروف المجهورة',
    },
    phonemes: normalizedKey.split('').map((char) => ({
      letterGroup: char,
      ipa: `/${char}/`,
      status: ['p', 'th', 'ch'].includes(char) ? 'error' : 'correct',
    })),
  };

  const playAudio = (rate: number = 1.0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4 shadow-xl">
      
      {/* Word Header with Audio Playback */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white capitalize tracking-wide">
              {word}
            </span>
            <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              {data.fullIpa}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            تقييم الفونيمات ومخارج الحروف على طريقة ELSA Speak
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playAudio(0.7)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 transition text-xs font-bold flex items-center gap-1"
            title="نطق بطيء 0.7x"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">بطيء</span>
          </button>
          <button
            onClick={() => playAudio(1.0)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-600/20"
            title="نطق طبيعي 1.0x"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">طبيعي</span>
          </button>
        </div>
      </div>

      {/* ELSA-Style Phoneme-Level Colored Blocks */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Phoneme Breakdown (تلوين الحروف الصوتية)
        </span>
        
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {data.phonemes.map((ph, idx) => {
            const isError = ph.status === 'error';
            const isWarning = ph.status === 'warning';
            return (
              <div
                key={idx}
                className={`group relative flex flex-col items-center px-3 py-2 rounded-xl border transition-all cursor-default select-none ${
                  isError
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:scale-105'
                    : isWarning
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:scale-105'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:scale-105'
                }`}
              >
                {/* IPA symbol on top */}
                <span className="text-[10px] font-mono opacity-80 mb-0.5">
                  {ph.ipa}
                </span>

                {/* Letter character */}
                <span className="text-base font-black uppercase">
                  {ph.letterGroup}
                </span>

                {/* Status indicator pip */}
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isError ? 'bg-rose-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />

                {/* Tooltip on hover */}
                {ph.egyptianTip && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 w-44 p-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-[10px] text-white shadow-xl pointer-events-none">
                    <span className="font-bold text-amber-300">توجيه: </span>
                    {ph.egyptianTip}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>نطق سليم (100%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>انتبه للمد/النبر</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>موضع الخطأ الشائع</span>
          </span>
        </div>
      </div>

      {/* Egyptian Articulatory Advice Card */}
      {data.generalEgyptianTip && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
          <span className="text-lg shrink-0">🇪🇬</span>
          <div>
            <span className="font-bold text-amber-300 block mb-0.5">سر النطق باللهجة المصرية:</span>
            <p className="leading-relaxed text-[11px] text-amber-100/90">
              {data.generalEgyptianTip}
            </p>
          </div>
        </div>
      )}

      {/* Visual Mouth & Tongue Diagram Card */}
      {showMouthGuide && data.mouthGuide && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>دليل حركة الفم واللسان (Articulatory Guide):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="font-bold text-slate-300 block mb-0.5">👄 الشفتان:</span>
              <span className="text-slate-400 leading-snug">{data.mouthGuide.lips}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="font-bold text-slate-300 block mb-0.5">👅 اللسان:</span>
              <span className="text-slate-400 leading-snug">{data.mouthGuide.tongue}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="font-bold text-slate-300 block mb-0.5">🎵 الحبال الصوتية:</span>
              <span className="text-slate-400 leading-snug">{data.mouthGuide.vocalCords}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Launch Drill Button */}
      {onPracticeClick && (
        <button
          onClick={onPracticeClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 group"
        >
          <span>ابدأ تمرين التكرار الفوري للكلمة (Repeat & Master)</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
        </button>
      )}

    </div>
  );
};
