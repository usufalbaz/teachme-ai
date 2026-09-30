import React, { useState } from 'react';
import { 
  Globe, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  Mic, 
  Award, 
  FileText, 
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentTab: 'studio' | 'ielts' | 'analytics' | 'achievements';
  onSelectTab: (tab: 'studio' | 'ielts' | 'analytics' | 'achievements') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
}) => {
  const { user, profile, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const level = profile?.level || 'B1';
  const ieltsBand = profile?.ieltsBand || (level === 'C1' ? 8.0 : level === 'B2' ? 7.0 : level === 'B1' ? 6.0 : level === 'A2' ? 5.0 : 4.0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080d1a]/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Professional Typographic Logo: teachme-ai */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelectTab('studio')}
              className="flex items-center gap-2.5 group text-left transition"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-blue-400 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                    teachme<span className="text-blue-400 font-black">.ai</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700/60">
                    Live
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:block font-medium tracking-wide">
                  Acoustic Spoken Studio & IELTS Benchmark
                </span>
              </div>
            </button>
          </div>

          {/* Minimalist Studio Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-sm">
            <button
              onClick={() => onSelectTab('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'studio'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'استوديو التحدث الصوتي' : 'Spoken Studio'}</span>
            </button>

            <button
              onClick={() => onSelectTab('ielts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'ielts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تحديد المستوى (IELTS)' : 'IELTS Assessment'}</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'سجل التقييمات' : 'Evaluation Logs'}</span>
            </button>

            <button
              onClick={() => onSelectTab('achievements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'achievements'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'صفحة الإنجازات' : 'Achievements'}</span>
            </button>
          </nav>

          {/* Right Controls: Band & Auth & Language */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* IELTS Band Indicator Badge */}
            <div 
              onClick={() => onSelectTab('ielts')}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-xs hover:border-blue-400/40 transition"
              title="Click to view or retake official IELTS diagnostic"
            >
              <span className="text-[10px] text-slate-400 font-medium">IELTS</span>
              <span>Band {ieltsBand.toFixed(1)}</span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              title={language === 'en' ? 'التحويل للعربية' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Profile / Auth Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block mr-1" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-64 rounded-2xl bg-[#0e1424] border border-slate-800 shadow-2xl py-2.5 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-bold text-white truncate">{profile?.displayName || 'Learner'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="px-4 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Current Band:</span>
                        <strong className="text-blue-400">Band {ieltsBand.toFixed(1)} ({level})</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onSelectTab('ielts');
                      }}
                      className="w-full text-left rtl:text-right px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-blue-400" />
                      <span>{language === 'ar' ? 'اختبار الآيلتس لتحديد المستوى' : 'IELTS Diagnostic Exam'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onSelectTab('achievements');
                      }}
                      className="w-full text-left rtl:text-right px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>{language === 'ar' ? 'سجل الشهادات والإنجازات' : 'My Certificates'}</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left rtl:text-right px-4 py-2 text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition hover:scale-105"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-[11px]">
          <button
            onClick={() => onSelectTab('studio')}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-medium transition ${
              currentTab === 'studio' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'التحدث' : 'Studio'}</span>
          </button>

          <button
            onClick={() => onSelectTab('ielts')}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-medium transition ${
              currentTab === 'ielts' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الآيلتس' : 'IELTS'}</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-medium transition ${
              currentTab === 'analytics' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'التقييمات' : 'Logs'}</span>
          </button>

          <button
            onClick={() => onSelectTab('achievements')}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-medium transition ${
              currentTab === 'achievements' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الإنجازات' : 'Badges'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
