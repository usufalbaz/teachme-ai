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
  const { language, toggleLanguage } = useLanguage();

  const navItems = [
    { id: 'studio', labelAr: 'الاستوديو', labelEn: 'Studio', icon: '🎙️' },
    { id: 'roadmap', labelAr: 'الخريطة', labelEn: 'Roadmap', icon: '🗺️' },
    { id: 'ielts', labelAr: 'IELTS', labelEn: 'IELTS', icon: '🎓' },
    { id: 'analytics', labelAr: 'التحليلات', labelEn: 'Analytics', icon: '📊' },
    { id: 'achievements', labelAr: 'الإنجازات', labelEn: 'Badges', icon: '🏆' },
  ] as const;

  return (
    <>
      {/* Top Header Optimized for Mobile Screens */}
      <header className="sticky top-0 z-40 w-full bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3.5 h-14 flex items-center justify-between gap-2">
          
          {/* Logo */}
          <div onClick={() => onSelectTab('studio')} className="flex items-center gap-2 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-base font-bold shadow-md">
              ⚡
            </div>
            <span className="font-black text-base text-white tracking-tight">
              teachme<span className="text-blue-500">.ai</span>
            </span>
          </div>

          {/* Right Mobile Controls: Streak + Lang + Auth */}
          <div className="flex items-center gap-1.5">
            {/* Streak */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <span>🔥</span>
              <span>{profile?.streak ?? 1}</span>
            </div>

            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div onClick={onOpenAuth} className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 cursor-pointer">
                {(profile?.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-bold"
              >
                {language === 'ar' ? 'دخول' : 'Login'}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Bottom App Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-blue-400 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <span className={`text-lg ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5">
                {language === 'ar' ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
