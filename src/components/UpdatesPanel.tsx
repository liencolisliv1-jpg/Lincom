import React from 'react';
import { Bell, ChevronRight, Radio, Star, Zap } from 'lucide-react';
import { AppNotification } from '../types';

interface UpdatesPanelProps {
  notifications: AppNotification[];
  onOpenAll: () => void;
  onOpenNotification: (notification: AppNotification) => void;
  isDarkMode: boolean;
}

const getNotificationIcon = (type: AppNotification['type']) => {
  if (type === 'recruitment') return <Radio className="w-4 h-4 text-teal-400" />;
  if (type === 'badge_expiration') return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
  if (type === 'urgent_delivery') return <Zap className="w-4 h-4 text-blue-400" />;
  return <Bell className="w-4 h-4 text-emerald-400" />;
};

export const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  notifications,
  onOpenAll,
  onOpenNotification,
  isDarkMode,
}) => {
  const updates = notifications.slice(0, 3);

  if (updates.length === 0) return null;

  return (
    <section
      aria-labelledby="updates-title"
      className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-black">Actualités Liencolis</p>
            <h2 id="updates-title" className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Dernières mises à jour
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenAll}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
          >
            Tout afficher <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {updates.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => onOpenNotification(notification)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-slate-950/60 border-slate-800 hover:border-amber-500/50'
                  : 'bg-slate-50 border-slate-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="p-2 rounded-lg bg-slate-800 shrink-0">{getNotificationIcon(notification.type)}</span>
                <span className="min-w-0">
                  <span className={`block text-xs font-black line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {notification.title}
                  </span>
                  <span className={`block text-[11px] mt-1 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {notification.body}
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};