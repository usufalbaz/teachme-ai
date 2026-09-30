import React, { useState } from 'react';
import { 
  Flame, 
  Globe, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  BookOpen, 
  Mic, 
  BarChart3, 
  ChevronDown,
  Bell,
  Smartphone,
  Headphones,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CEFRLevel } from '../types';

interface NavbarProps {
  currentTab: 'roadmap' | 'call' | 'analytics';
  onSelectTab: (tab: 'roadmap' | 'call' | 'analytics') => void;
  onOpenAuth: () => void;
  onOpenPlacementTest: () => void;
  onOpenHostingGuide: () => void;
  onOpenReminderSettings: () => void;
  onOpenAndroidModal: () => void;
}

const LEVEL_COLORS: Record<CEFRLevel, { bg: string; text: string; border: string }> = {
  A1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  A2: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/25' },
  B1: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/25' },
  B2: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/25' },
  C1: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/25' },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenPlacementTest,
  onOpenReminderSettings,
  onOpenAndroidModal,
}) => {
  const { user, profile, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const level = profile?.level || 'A1';
  const levelStyle = LEVEL_COLORS[level] || LEVEL_COLORS.A1;
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 1;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#070b16]/75 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelectTab('roadmap')}
              className="flex items-center gap-3 group text-left transition"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0a0f1d] rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Headphones className="w-5 h-5 text-indigo-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    TeachMe
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.07] text-indigo-300 border border-white/10 font-sans">
                    تيتش مي
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                  Interactive Spoken English Mastery
                </p>
              </div>
            </button>
          </div>

          {/* Apple Liquid Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1.5 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-inner">
            <button
              onClick={() => onSelectTab('roadmap')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'roadmap'
                  ? 'bg-gradient-to-b from-indigo-500/90 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('roadmap')}</span>
            </button>

            <button
              onClick={() => onSelectTab('call')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                currentTab === 'call'
                  ? 'bg-gradient-to-b from-violet-500/90 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-violet-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <Mic className="w-4 h-4" />
              <span>{t('callHub')}</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-gradient-to-b from-indigo-500/90 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('analytics')}</span>
            </button>
          </nav>

          {/* Gamification Stats & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Daily Reminder Bell */}
            <button
              onClick={onOpenReminderSettings}
              className="relative p-2.5 rounded-2xl liquid-pill text-slate-300 hover:text-white transition"
              title={t('reminderSettings')}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {profile?.lastActiveDate !== new Date().toISOString().split('T')[0] && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Android APK Button */}
            <button
              onClick={onOpenAndroidModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-bold text-xs transition hover:scale-105"
              title="تطبيق أندرويد & تثبيت التطبيق"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">أندرويد / APK</span>
            </button>

            {/* Streak */}
            <div 
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs"
              title={`${streak} ${t('activeStreak')}`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streak}</span>
            </div>

            {/* XP */}
            <div 
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl liquid-pill text-indigo-300 font-bold text-xs"
              title={`${xp} ${t('totalXp')}`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>{xp}</span>
              <span className="text-[10px] uppercase font-semibold text-indigo-300/80">XP</span>
            </div>

            {/* Level Badge with Placement Trigger */}
            <button
              onClick={onOpenPlacementTest}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition hover:scale-105 ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
              title="Click to change CEFR Level or retake test"
            >
              <span>{level}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl liquid-pill text-slate-200 hover:text-white text-xs font-semibold transition"
              title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* User Profile / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl liquid-pill hover:border-white/20 transition"
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-3xl liquid-glass-elevated border border-white/15 shadow-2xl py-3 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-white/[0.08]">
                      <p className="font-semibold text-white truncate">{profile?.displayName || 'Learner'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="px-4 py-2.5 border-b border-white/[0.08] text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>الهندسة والتطوير</span>
                      </div>
                      <p className="text-slate-300 font-medium">المهندس يوسف الباز</p>
                      <p className="text-[10px] text-slate-500">Eng. Yousuf Albaz • AI & Systems Engineer</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenPlacementTest();
                      }}
                      className="w-full text-left px-4 py-2 text-slate-300 hover:bg-white/[0.06] hover:text-white transition flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span>{t('levelPlacementTest')}</span>
                    </button>

                    <div className="my-1 border-t border-white/[0.08]" />
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('signOut')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition hover:scale-105"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('loginWithGoogle')}</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-white/[0.06] text-xs">
          <button
            onClick={() => onSelectTab('roadmap')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-medium transition ${
              currentTab === 'roadmap' ? 'liquid-pill text-indigo-300 font-bold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('roadmap')}</span>
          </button>
          <button
            onClick={() => onSelectTab('call')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-medium transition ${
              currentTab === 'call' ? 'liquid-pill text-indigo-300 font-bold' : 'text-slate-400'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t('callHub')}</span>
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-medium transition ${
              currentTab === 'analytics' ? 'liquid-pill text-indigo-300 font-bold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t('analytics')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
