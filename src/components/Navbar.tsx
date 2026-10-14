import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface NavbarProps {
  currentTab: 'studio' | 'roadmap' | 'ielts' | 'analytics' | 'achievements';
  onSelectTab: (tab: 'studio' | 'roadmap' | 'ielts' | 'analytics' | 'achievements') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const navItems = [
    { id: 'studio', labelAr: 'الاستوديو الصوتي', labelEn: 'Voice Studio', icon: '🎙️' },
    { id: 'roadmap', labelAr: 'خريطة التعلم', labelEn: 'Roadmap', icon: '🗺️' },
    { id: 'ielts', labelAr: 'اختبار IELTS', labelEn: 'IELTS Exam', icon: '🎓' },
    { id: 'analytics', labelAr: 'سجل التقييمات', labelEn: 'Analytics', icon: '📊' },
    { id: 'achievements', labelAr: 'الإنجازات والشهادات', labelEn: 'Portfolio', icon: '🏆' },
  ] as const;

  return (
    <>
      {/* ========================================================= */}
      {/* 1. Desktop & Tablet Top Navigation Bar                   */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Model Tag */}
          <div 
            onClick={() => onSelectTab('studio')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-800 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  teachme<span className="text-blue-500">.ai</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Gemini Live
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                {language === 'ar' ? 'تعلم التحدث بالذكاء الاصطناعي' : 'Acoustic Conversational English'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800/80">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar (Streak, Language Toggle, User Auth) */}
          <div className="flex items-center gap-2.5">
            
            {/* Daily Streak Counter Badge */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 select-none"
              title={language === 'ar' ? 'أيام التدريب المتتالية' : 'Daily Practice Streak'}
            >
              <span className="text-sm animate-pulse">🔥</span>
              <span className="text-xs font-black">{profile?.streakCount ?? 1}</span>
              <span className="text-[10px] font-bold text-amber-500/80 hidden sm:inline">
                {language === 'ar' ? 'يوم' : 'days'}
              </span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition"
              title="تغيير لغة الواجهة"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* User Profile or Login Trigger */}
            {user ? (
              <div 
                onClick={onOpenAuth}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none"
              >
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                    {profile?.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-400">
                    {profile?.targetLevel || 'B1'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    (profile?.displayName || user.email || 'U')[0].toUpperCase()
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/25 transition active:scale-95"
              >
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            )}

          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. Mobile Native Bottom Navigation Dock (PWA / Android UX) */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-blue-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300 font-medium'
              }`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                {language === 'ar' ? item.labelAr : item.labelEn}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute -bottom-1" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
