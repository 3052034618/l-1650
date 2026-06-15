import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellOff, Clock, Settings, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { Reminder } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

export default function ReminderSettings() {
  const { user } = useAuthStore();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTriggerRef = useRef<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission as any);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchReminder = async () => {
      try {
        const res = await api.auth.getReminder();
        if (res.success && res.data) {
          setReminder(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch reminder:', err);
      }
    };
    fetchReminder();
  }, [user]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('您的浏览器不支持通知功能');
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationStatus(permission as any);
    });
  };

  const checkAndTriggerReminder = useCallback(() => {
    if (!reminder || !reminder.isEnabled) return;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const reminderTime = reminder.reminderTime.substring(0, 5);
    const todayKey = `${now.toDateString()}-${reminderTime}`;
    if (currentTime === reminderTime && lastTriggerRef.current !== todayKey) {
      lastTriggerRef.current = todayKey;
      if (notificationStatus === 'granted') {
        new Notification('诗意时光', {
          body: '今日诗意盎然，何不挥毫泼墨，记录你的灵感时刻',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📜</text></svg>',
        });
      }
    }
  }, [reminder, notificationStatus]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      checkAndTriggerReminder();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, checkAndTriggerReminder]);

  const handleToggleEnabled = async () => {
    if (!reminder) return;
    const newValue = !reminder.isEnabled;
    updateReminder({ ...reminder, isEnabled: newValue });
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!reminder) return;
    const newTime = e.target.value;
    updateReminder({ ...reminder, reminderTime: newTime.length === 5 ? `${newTime}:00` : newTime });
  };

  const updateReminder = async (data: Reminder) => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.auth.updateReminder({
        reminderTime: data.reminderTime,
        isEnabled: data.isEnabled,
        timezone: data.timezone,
      });
      if (res.success && res.data) {
        setReminder(res.data);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        setError(res.errors?.[0] || '保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#f5d742] to-[#e5c400] flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg shadow-[#f5d742]/30 group"
      title="创作提醒设置"
    >
      {reminder?.isEnabled ? (
        <Bell className="w-6 h-6 text-white" />
      ) : (
        <BellOff className="w-6 h-6 text-white" />
      )}
      {reminder?.isEnabled && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>

    {isOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
        <div
          className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#f5f0e1]/10 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5d742] to-[#e5c400] flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">创作提醒设置</h3>
                <p className="text-sm text-gray-400">每日定时提醒您创作</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-[#f5f0e1]/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showSuccess && (
            <div className="mb-4 p-3 bg-[#4a7c59]/20 border border-[#4a7c59]/30 rounded-lg flex items-center gap-2 text-[#4a7c59] text-sm">
              <CheckCircle className="w-4 h-4" />
              设置已保存
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#f5f0e1]/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  reminder?.isEnabled ? 'bg-[#4a7c59]/20' : 'bg-gray-700'
                )}>
                  {reminder?.isEnabled ? (
                    <Bell className="w-5 h-5 text-[#4a7c59]" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">启用每日提醒</p>
                  <p className="text-sm text-gray-400">到点时发送浏览器通知</p>
                </div>
              </div>
              <button
                onClick={handleToggleEnabled}
                className={cn(
                  'w-14 h-8 rounded-full transition-all relative',
                  reminder?.isEnabled ? 'bg-[#4a7c59]' : 'bg-gray-600'
                )}
                disabled={saving}
              >
                <span className={cn(
                  'absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow',
                  reminder?.isEnabled ? 'left-7' : 'left-1'
                )} />
              </button>
            </div>

            <div className="p-4 bg-[#f5f0e1]/5 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#e94560]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#e94560]" />
              </div>
              <div>
                <p className="text-white font-medium">提醒时间</p>
                <p className="text-sm text-gray-400">每天此时间发送提醒</p>
              </div>
            </div>
              <input
                type="time"
                value={reminder?.reminderTime?.substring(0, 5) || '09:00'}
                onChange={handleTimeChange}
                disabled={!reminder?.isEnabled || saving}
                className={cn(
                  'w-full px-4 py-3 bg-[#0f0f1a] border rounded-lg text-white text-center text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-[#f5d742] transition-all',
                  !reminder?.isEnabled ? 'border-gray-600 text-gray-500 cursor-not-allowed' : 'border-[#f5f0e1]/20'
                )}
              />
            </div>

            {notificationStatus !== 'granted' && (
              <div className="p-4 bg-[#f5d742]/10 border border-[#f5d742]/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#f5d742] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[#f5d742] font-medium mb-1">需要通知权限</p>
                    <p className="text-sm text-gray-400 mb-3">
                      {notificationStatus === 'denied'
                        ? '您已拒绝通知权限，请在浏览器设置中允许通知'
                        : '请允许浏览器通知以接收创作提醒'}
                    </p>
                    {notificationStatus !== 'denied' && (
                      <button
                        onClick={requestNotificationPermission}
                        className="px-4 py-2 bg-[#f5d742] rounded-lg text-[#1a1a2e] font-medium hover:bg-[#e5c400] transition-colors"
                      >
                        允许通知
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {reminder?.isEnabled && notificationStatus === 'granted' && (
              <div className="p-4 bg-[#4a7c59]/10 border border-[#4a7c59]/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#4a7c59]" />
                <div>
                  <p className="text-[#4a7c59] font-medium">提醒已启用</p>
                  <p className="text-sm text-gray-400">
                    每天 {reminder.reminderTime?.substring(0, 5)} 将收到创作提醒
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
