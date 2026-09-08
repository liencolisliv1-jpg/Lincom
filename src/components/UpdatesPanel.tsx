import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Bell, ChevronRight, Radio, Star, Zap, Trash2, X, ArrowLeftRight } from 'lucide-react';
import { AppNotification } from '../types';

interface UpdatesPanelProps {
  notifications: AppNotification[];
  onOpenAll: () => void;
  onOpenNotification: (notification: AppNotification) => void;
  onDismissNotification?: (id: string) => void;
  isDarkMode: boolean;
}

const getNotificationIcon = (type: AppNotification['type']) => {
  if (type === 'recruitment') return <Radio className="w-4 h-4 text-teal-400" />;
  if (type === 'badge_expiration') return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
  if (type === 'urgent_delivery') return <Zap className="w-4 h-4 text-blue-400" />;
  return <Bell className="w-4 h-4 text-emerald-400" />;
};

interface SwipeableCardProps {
  notification: AppNotification;
  isDarkMode: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  notification,
  isDarkMode,
  onOpen,
  onDismiss,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('right');
  const x = useMotionValue(0);

  // Dynamic visual indicators based on swipe distance
  const bgOpacity = useTransform(x, [-120, -25, 0, 25, 120], [1, 0.7, 0, 0.7, 1]);
  const leftActionOpacity = useTransform(x, [15, 55], [0, 1]);
  const rightActionOpacity = useTransform(x, [-15, -55], [0, 1]);
  const actionScale = useTransform(x, [-100, -30, 0, 30, 100], [1.1, 1, 0.9, 1, 1.1]);

  const isDraggingRef = useRef(false);

  const handleDismiss = (direction: 'left' | 'right') => {
    setIsDismissing(true);
    setExitDirection(direction);
    setTimeout(() => {
      onDismiss();
    }, 180);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{
        opacity: isDismissing ? 0 : 1,
        x: isDismissing ? (exitDirection === 'right' ? 380 : -380) : 0,
        scale: isDismissing ? 0.8 : 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        height: 0,
        margin: 0,
        padding: 0,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl group select-none touch-pan-y"
    >
      {/* Background action reveal (Red gradient + Trash icons) */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-between px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-inner pointer-events-none"
      >
        {/* Swiping Right: reveals Delete on the left */}
        <motion.div
          style={{ opacity: leftActionOpacity, scale: actionScale }}
          className="flex items-center gap-1.5 text-xs font-black"
        >
          <Trash2 className="w-4 h-4 text-white" />
          <span>Effacé</span>
        </motion.div>

        {/* Swiping Left: reveals Delete on the right */}
        <motion.div
          style={{ opacity: rightActionOpacity, scale: actionScale }}
          className="flex items-center gap-1.5 text-xs font-black"
        >
          <span>Effacé</span>
          <Trash2 className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>

      {/* Foreground Swipeable Card */}
      <motion.div
        style={{ x: isDismissing ? 0 : x }}
        drag={isDismissing ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={(e, info) => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 60);

          const distance = Math.abs(info.offset.x);
          const velocity = Math.abs(info.velocity.x);

          // If dragged past threshold (40px) or flicked with velocity (>160px/s)
          if (distance > 40 || velocity > 160) {
            const dir = (info.offset.x !== 0 ? info.offset.x : info.velocity.x) > 0 ? 'right' : 'left';
            handleDismiss(dir);
          } else {
            x.set(0);
          }
        }}
        onClick={() => {
          if (!isDraggingRef.current && Math.abs(x.get()) < 10 && !isDismissing) {
            onOpen();
          }
        }}
        className={`relative z-10 w-full text-left p-3.5 rounded-2xl border transition-colors cursor-grab active:cursor-grabbing ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0 mt-0.5 shadow-sm">
            {getNotificationIcon(notification.type)}
          </span>

          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5">
              <span className={`block text-xs font-black line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {notification.title}
              </span>
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              )}
            </div>

            <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {notification.body}
            </p>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/40 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-medium text-amber-400/90">
                <ArrowLeftRight className="w-3 h-3" />
                <span>Glisser pour effacer</span>
              </span>
              <span className="font-mono text-slate-400">
                {new Date(notification.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Dismiss "X" button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss('right');
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors z-20"
          title="Effacer cette notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  notifications,
  onOpenAll,
  onOpenNotification,
  onDismissNotification,
  isDarkMode,
}) => {
  // Track dismissed IDs locally to ensure instantaneous, clean removal with zero bounce-back
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    if (onDismissNotification) {
      onDismissNotification(id);
    }
  };

  // Only take notifications that have not been dismissed by the user
  const activeNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const displayList = activeNotifications.slice(0, 3);

  if (displayList.length === 0) return null;

  return (
    <section
      aria-labelledby="updates-title"
      className={`border-b transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-black">Actualités Liencolis</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                <span>Glisser pour effacer</span>
              </span>
            </div>
            <h2 id="updates-title" className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Dernières mises à jour & alertes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAll}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
            >
              <span>Centre d'alertes ({activeNotifications.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {displayList.map((notification) => (
              <SwipeableCard
                key={notification.id}
                notification={notification}
                isDarkMode={isDarkMode}
                onOpen={() => onOpenNotification(notification)}
                onDismiss={() => handleDismiss(notification.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
