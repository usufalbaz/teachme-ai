import React, { useState } from 'react';
import { Search, X, Sparkles, Filter, Check, ArrowRight } from 'lucide-react';
import { voiceScenarios, OPEN_CONVERSATION_SCENARIO } from '../data/curriculum';
import { VoiceScenario, CEFRLevel } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface TopicExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScenarioId: string;
  onSelectScenario: (scenario: VoiceScenario) => void;
  onSelectCustomTopic: (customTopic: string) => void;
}

const CATEGORIES = ['All', 'General', 'Technology', 'Daily Life', 'Food', 'Lifestyle', 'Career', 'Debate', 'Travel'];

export const TopicExplorerModal: React.FC<TopicExplorerModalProps> = ({
  isOpen,
  onClose,
  selectedScenarioId,
  onSelectScenario,
  onSelectCustomTopic,
}) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const filteredScenarios = voiceScenarios.filter((sc) => {
    const matchesSearch =
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.titleAr.includes(searchQuery) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.descriptionAr.includes(searchQuery) ||
      sc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'All' ||
      sc.category.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleApplyCustomTopic = () => {
    if (!customInput.trim()) return;
    onSelectCustomTopic(customInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                مكتبة ومحرك بحث المواضيع (Topic Explorer)
              </h3>
              <p className="text-xs text-slate-400">
                ابحث في أكثر من 30 سيناريو ومجال أو اكتب أي موضوع مخصص من اختيارك!
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

        {/* Custom Topic Input */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-950/60 border border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4" />
            <span>اكتب أي موضوع خاص بك في المطلق (Custom Dynamic Topic):</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="مثلاً: مناقشة فيلم Oppenheimer، التحضير لمقابلة فيزا، دردشة عن الكرة..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomTopic()}
            />
            <button
              onClick={handleApplyCustomTopic}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>بدء هذا الموضوع</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Categories */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الكلمة المفتاحية (سفر، أكل، جيم، ذكاء اصطناعي، شغل...)"
              className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredScenarios.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between w-full mb-2">
                    <span className="text-2xl">{sc.avatar}</span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                      {sc.level}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-0.5">
                    {language === 'ar' ? sc.titleAr : sc.title}
                  </h4>
                  <p className="text-xs text-indigo-300 font-medium mb-1">
                    {sc.personaName} • {sc.personaRole}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {language === 'ar' ? sc.descriptionAr : sc.description}
                  </p>
                </div>

                <div className="pt-2 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{sc.category}</span>
                  <span className={`font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {isSelected ? 'الموضوع الحالي' : 'اختر الموضوع ←'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredScenarios.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            لا توجد سيناريوهات مطابقة لبحثك. يمكنك كتابة موضوعك المخصص في الخانة بالأعلى وسيتفاعل معك المدرب فوراً!
          </div>
        )}

      </div>
    </div>
  );
};
