import React, { useState, useEffect, useRef } from 'react';
import { Flame, Bell, X, ArrowRight, Clock, CheckCircle2, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { playReminderChime, sendPushNotification } from '../services/notificationService';

interface DailyReminderToastProps {
  onPracticeNow: () => void;
  onOpenSettings: () => void;
}

export const DailyReminderToast: React.FC<DailyReminderToastProps> = ({
  onPracticeNow,
  onOpenSettings,
}) => {
  const { profile } = useAuth();
  const { language, t } = useLanguage();

  const [visible, setVisible] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'pending' | 'achieved'>('pending');
  const lastCheckTimeRef = useRef<string>('');

  const reminderEnabled = profile?.reminderEnabled ?? true;
  const reminderTime = profile?.reminderTime || '20:00'; // HH:mm
  const streak = profile?.streak || 1;
  const today = new Date().toISOString().split('T')[0];
  const hasPracticedToday = profile?.lastActiveDate === today;

  useEffect(() => {
    if (!reminderEnabled) {
      setVisible(false);
      return;
    }

    const checkReminder = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Check snooze
      const snoozeUntil = localStorage.getItem('teachme_snooze_until');
      if (snoozeUntil && Date.now() < parseInt(snoozeUntil, 10)) {
        return;
      }

      // Check if dismissed for today
      const dismissedDate = localStorage.getItem('teachme_reminder_dismissed_date');
      if (dismissedDate === today) {
        return;
      }

      const [targetH, targetM] = reminderTime.split(':').map((n) => parseInt(n, 10));
      const targetTotalMinutes = (targetH || 20) * 60 + (targetM || 0);
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      // Trigger if current time is at or after reminder time and user hasn't practiced yet
      if (!hasPracticedToday && currentTotalMinutes >= targetTotalMinutes) {
        if (lastCheckTimeRef.current !== today) {
          lastCheckTimeRef.current = today;
          setToastType('pending');
          setVisible(true);
          playReminderChime();
          sendPushNotification(
            `🔥 TeachMe Daily Reminder (${streak}-Day Streak!)`,
            'Keep your English streak alive! Spend 2 minutes practicing a spoken session now.'
          );
        }
      } else if (hasPracticedToday && visible && toastType === 'pending') {
        // If practiced while toast was visible, celebrate!
        setToastType('achieved');
        setTimeout(() => setVisible(false), 5000);
      }
    };

    // Check immediately and every 30 seconds
    checkReminder();
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime, hasPracticedToday, today, streak]);

  const handleSnooze = () => {
    // Snooze for 1 hour
    const oneHourLater = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('teachme_snooze_until', oneHourLater.toString());
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('teachme_reminder_dismissed_date', today);
    setVisible(false);
  };

  const handlePracticeClick = () => {
    setVisible(false);
    onPracticeNow();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-fade-in">
      <div className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
        toastType === 'achieved'
          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-900/30'
          : 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-900/20'
      }`}>
        <div className="flex items-start justify-between gap-3">
          
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-2xl shrink-0 ${
              toastType === 'achieved'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400 animate-bounce'
            }`}>
              {toastType === 'achieved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Flame className="w-5 h-5 fill-amber-500" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-white">
                  {toastType === 'achieved' ? t('dailyGoalAchieved') : t('dailyReminderTitle')}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  🔥 {streak} {t('activeStreak')}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {toastType === 'achieved'
                  ? 'Your practice streak is safe for today. See you tomorrow!'
                  : t('dailyReminderText')}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title={t('dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        {toastType === 'pending' && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={handleSnooze}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('snooze')}</span>
            </button>

            <button
              onClick={handlePracticeClick}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 hover:scale-105"
            >
              <span>{t('practiceNow')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
