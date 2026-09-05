import React, { useEffect, useState } from 'react';
import { AppNotification, PaymentPurpose } from '../types';
import {
  Bell,
  Star,
  Radio,
  Zap,
  HeartHandshake,
  ShieldAlert,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onActionClick: (notification: AppNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onActionClick,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 7000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    const dismissTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification?.id, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'badge_expiration':
        return <Star className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />;
      case 'recruitment':
        return <Radio className="w-5 h-5 text-teal-400" />;
      case 'urgent_delivery':
        return <Zap className="w-5 h-5 text-amber-400 animate-bounce" />;
      case 'aid_fund':
        return <HeartHandshake className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getCardStyle = () => {
    switch (notification.type) {
      case 'badge_expiration':
        return 'bg-slate-900 border-2 border-amber-500/80 shadow-amber-500/20';
      case 'recruitment':
        return 'bg-slate-900 border-2 border-teal-500/80 shadow-teal-500/20';
      case 'urgent_delivery':
        return 'bg-slate-900 border-2 border-blue-500/80 shadow-blue-500/20';
      default:
        return 'bg-slate-900 border border-slate-700 shadow-slate-900/50';
    }
  };

  return (
    <div
      id="liencolis-push-notification-toast"
      className="fixed top-20 right-4 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div
        className={`rounded-3xl p-4 shadow-2xl text-white backdrop-blur-md relative overflow-hidden ${getCardStyle()}`}
      >
        {/* Top Progress Bar */}
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shrink-0 shadow-inner">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                {notification.type === 'badge_expiration'
                  ? '⭐ Badge VIP 500F'
                  : notification.type === 'recruitment'
                  ? '📢 Recrutement'
                  : notification.type === 'urgent_delivery'
                  ? '⚡ Course Urgente'
                  : 'Alerte Push'}
              </span>
              {notification.city && (
                <span className="text-[10px] text-slate-400">📍 {notification.city}</span>
              )}
            </div>

            <h4 className="text-xs font-black text-white mt-1 leading-snug">
              {notification.title}
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-3">
              {notification.body}
            </p>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  onActionClick(notification);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs shadow hover:scale-102 active:scale-98 transition-all flex items-center gap-1"
                id="btn-toast-action"
              >
                <span>{notification.actionLabel || 'Consulter'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Close X */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
