import React from 'react';
import { X, Volume2, Check, Sparkles, User, UserCheck } from 'lucide-react';
import { COACH_VOICES, CoachVoice } from '../data/curriculum';
import { useLanguage } from '../context/LanguageContext';

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const playVoiceSample = (voice: CoachVoice) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let sampleText = "Hello! Let's practice English together!";
      let pitch = 1.0;
      let rate = 1.0;

      if (voice.id === 'Puck') {
        sampleText = "Yo champion! عاش يا بطل! Ready to crush your English today with full energy?";
        pitch = 1.25;
        rate = 1.15;
      } else if (voice.id === 'Aoede') {
        sampleText = "Welcome darling! Let's speak English with poise, elegance, and confidence.";
        pitch = 1.2;
        rate = 0.95;
      } else if (voice.id === 'Kore') {
        sampleText = "Hello dear. براحتك خالص، متقلقش من أي غلطة، إحنا هنا نتعلم سوا خطوة بخطوة.";
        pitch = 1.1;
        rate = 0.85;
      } else if (voice.id === 'Charon') {
        sampleText = "Good day. English is an art of expression and stories. Let's master it together.";
        pitch = 0.65;
        rate = 0.9;
      } else {
        sampleText = "Hey friend! How are you doing today? Ready for an awesome conversation?";
        pitch = 1.0;
        rate = 1.0;
      }

      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = pitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl liquid-glass-elevated border border-white/15 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                اختر نبرة وصوت المدرب (Coach Voice)
              </h3>
              <p className="text-xs text-slate-400">
                أصوات ونبرات مميزة مختلفة تماماً بلهجة مصرية أصيلة من Gemini Live.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl liquid-pill text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voices List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COACH_VOICES.map((voice) => {
            const isSelected = selectedVoiceId === voice.id;
            return (
              <div
                key={voice.id}
                onClick={() => onSelectVoice(voice.id)}
                className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-600/20'
                    : 'liquid-card hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{voice.avatar}</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">{voice.name}</h4>
                        <span className="text-[10px] font-mono uppercase text-indigo-300 font-semibold">
                          {voice.gender === 'female' ? 'أنثى (Female)' : 'ذكر (Male)'}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {language === 'ar' ? voice.toneAr : voice.toneEn}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoiceSample(voice);
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white transition px-2.5 py-1 rounded-xl liquid-pill"
                    title="استمع لعينة"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>عينة تجريبية</span>
                  </button>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30' : 'text-slate-500'
                  }`}>
                    {isSelected ? 'محدد حالياً' : 'اختيار'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition hover:scale-105"
          >
            تأكيد الاختيار
          </button>
        </div>

      </div>
    </div>
  );
};
