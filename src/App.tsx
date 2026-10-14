import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { VoiceCallHub } from './components/VoiceCallHub';
import { RoadmapView } from './components/RoadmapView';
import { AnalyticsView } from './components/AnalyticsView';
import { AchievementsView } from './components/AchievementsView';
import { IeltsAssessmentModal } from './components/IeltsAssessmentModal';
import { LessonModal } from './components/LessonModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { DailyReminderToast } from './components/DailyReminderToast';
import { AuthModal } from './components/AuthModal';
import { Lesson } from './types';

function MainApp() {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<'studio' | 'roadmap' | 'ielts' | 'analytics' | 'achievements'>('studio');

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [ieltsModalOpen, setIeltsModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState<boolean>(false);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-500/25 selection:text-blue-200 relative overflow-x-hidden">
      
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />

      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'ielts') {
            setIeltsModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'studio' && (
          <VoiceCallHub
            onOpenIeltsTest={() => setIeltsModalOpen(true)}
          />
        )}

        {currentTab === 'roadmap' && (
          <RoadmapView
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            onStartVoiceCall={() => setCurrentTab('studio')}
            onOpenPlacementTest={() => setOnboardingOpen(true)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            onStartVoicePractice={() => setCurrentTab('studio')}
          />
        )}

        {currentTab === 'achievements' && (
          <AchievementsView
            onStartVoiceCall={() => setCurrentTab('studio')}
            onOpenIeltsTest={() => setIeltsModalOpen(true)}
          />
        )}
      </main>

      <LessonModal
        lesson={selectedLesson}
        isOpen={Boolean(selectedLesson)}
        onClose={() => setSelectedLesson(null)}
        onStartVoiceCall={() => {
          setSelectedLesson(null);
          setCurrentTab('studio');
        }}
      />

      <IeltsAssessmentModal
        isOpen={ieltsModalOpen}
        onClose={() => setIeltsModalOpen(false)}
        onAssessmentCompleted={() => {
          setCurrentTab('achievements');
        }}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      <ReminderSettingsModal
        isOpen={reminderSettingsOpen}
        onClose={() => setReminderSettingsOpen(false)}
        onTriggerTestReminder={() => {}}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <DailyReminderToast
        onPracticeNow={() => setCurrentTab('studio')}
        onOpenSettings={() => setReminderSettingsOpen(true)}
      />

      <footer className="border-t border-slate-800/80 bg-[#060912] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">teachme.ai</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Acoustic Conversational Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <button
              onClick={() => setReminderSettingsOpen(true)}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition"
            >
              ⚙️ {language === 'ar' ? 'المنبه اليومي' : 'Daily Alarm'}
            </button>

            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium">
              Architected & Engineered by: <strong className="text-slate-200 font-bold">Eng. Yousuf Albaz</strong>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
