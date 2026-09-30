import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { RoadmapView } from './components/RoadmapView';
import { VoiceCallHub } from './components/VoiceCallHub';
import { AnalyticsView } from './components/AnalyticsView';
import { LessonModal } from './components/LessonModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { HostingGuideModal } from './components/HostingGuideModal';
import { DailyReminderToast } from './components/DailyReminderToast';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { Lesson } from './types';

function MainApp() {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<'roadmap' | 'call' | 'analytics'>('roadmap');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [hostingGuideOpen, setHostingGuideOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const [androidModalOpen, setAndroidModalOpen] = useState(false);
  const [testReminderKey, setTestReminderKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Ambient background glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenPlacementTest={() => setPlacementModalOpen(true)}
        onOpenHostingGuide={() => setHostingGuideOpen(true)}
        onOpenReminderSettings={() => setReminderSettingsOpen(true)}
        onOpenAndroidModal={() => setAndroidModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {currentTab === 'roadmap' && (
          <RoadmapView
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            onStartVoiceCall={() => setCurrentTab('call')}
            onOpenPlacementTest={() => setPlacementModalOpen(true)}
          />
        )}

        {currentTab === 'call' && (
          <VoiceCallHub
            onExit={() => setCurrentTab('roadmap')}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            onStartVoicePractice={() => setCurrentTab('call')}
          />
        )}
      </main>

      {/* Daily Goal Reminder Toast Banner */}
      <DailyReminderToast
        key={testReminderKey}
        onPracticeNow={() => setCurrentTab('call')}
        onOpenSettings={() => setReminderSettingsOpen(true)}
      />

      {/* Modals */}
      <LessonModal
        lesson={selectedLesson}
        isOpen={Boolean(selectedLesson)}
        onClose={() => setSelectedLesson(null)}
        onStartVoiceCall={() => {
          setSelectedLesson(null);
          setCurrentTab('call');
        }}
      />

      <OnboardingModal
        isOpen={placementModalOpen}
        onClose={() => setPlacementModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <HostingGuideModal
        isOpen={hostingGuideOpen}
        onClose={() => setHostingGuideOpen(false)}
      />

      <ReminderSettingsModal
        isOpen={reminderSettingsOpen}
        onClose={() => setReminderSettingsOpen(false)}
        onTriggerTestReminder={() => {
          localStorage.removeItem('teachme_reminder_dismissed_date');
          localStorage.removeItem('teachme_snooze_until');
          setTestReminderKey((prev) => prev + 1);
        }}
      />

      <AndroidInstallModal
        isOpen={androidModalOpen}
        onClose={() => setAndroidModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#070b16]/90 backdrop-blur-2xl py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">TeachMe (تيتش مي)</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">منظومة التدريب الصوتي التفاعلي للغة الإنجليزية</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-medium">
              تطوير وإنشاء: <strong className="text-white font-bold">المهندس يوسف الباز</strong> (Yousuf Albaz • AI & Systems Engineer)
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
