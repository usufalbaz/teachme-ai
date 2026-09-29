import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Clock, 
  Flame, 
  Volume2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  playReminderChime, 
  requestNotificationPermission, 
  sendPushNotification 
} from '../services/notificationService';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTestReminder: () => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  onTriggerTestReminder,
}) => {
  const { profile, updateReminderSettings } = useAuth();
  const { language, t } = useLanguage();

  const [enabled, setEnabled] = useState<boolean>(profile?.reminderEnabled ?? true);
  const [time, setTime] = useState<string>(profile?.reminderTime || '20:00');
  const [dailyGoal, setDailyGoal] = useState<number>(profile?.dailyXpGoal || 50);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    return 'Notification' in window ? Notification.permission : 'denied';
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermissionState(status);
  };

  const handleSave = async () => {
    await updateReminderSettings({
      reminderEnabled: enabled,
      reminderTime: time,
      dailyXpGoal: dailyGoal,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleTest = () => {
    playReminderChime();
    sendPushNotification(
      '🔥 TeachMe Test Reminder',
      'Daily goal reminder is working! Don\'t break your English practice streak.'
    );
    onTriggerTestReminder();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {t('reminderSettings')}
              </h2>
              <p className="text-xs text-slate-400">
                Track and protect your daily speaking streak.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enabled Toggle */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-bold text-white">Daily Streak Reminder</label>
            <p className="text-xs text-slate-400">Notify me if I haven't practiced by set time</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reminder Time Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{t('reminderTime')}</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base focus:outline-none focus:border-indigo-500 transition"
            />
            <span className="text-xs text-slate-400">
              Alerts if practice streak is pending at this time each evening.
            </span>
          </div>
        </div>

        {/* Daily XP Target Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{t('dailyXpTarget')}</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { xp: 30, label: 'Casual', sub: '1 Lesson' },
              { xp: 50, label: 'Regular', sub: '1 Call' },
              { xp: 100, label: 'Serious', sub: 'Mastery' },
            ].map((target) => {
              const isSelected = dailyGoal === target.xp;
              return (
                <button
                  key={target.xp}
                  type="button"
                  onClick={() => setDailyGoal(target.xp)}
                  className={`p-3 rounded-2xl border text-center transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{target.xp} XP</div>
                  <div className="text-[11px] font-medium text-indigo-300">{target.label}</div>
                  <div className="text-[10px] text-slate-500">{target.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser Push Permission & Test Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Browser Push Permission</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold capitalize ${
              permissionState === 'granted'
                ? 'bg-emerald-500/20 text-emerald-400'
                : permissionState === 'denied'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {permissionState}
            </span>
          </div>

          {permissionState !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              {t('enableNotifications')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTest}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t('testReminder')}</span>
            </button>
          )}
        </div>

        {/* Save & Close */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
