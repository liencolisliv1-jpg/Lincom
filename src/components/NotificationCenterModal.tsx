import React, { useState, useEffect } from 'react';
import { AppNotification, NotificationSettings, NotificationType, PaymentPurpose } from '../types';
import { notificationService } from '../services/notificationService';
import {
  Bell,
  Star,
  Radio,
  Zap,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Vibrate,
  Smartphone,
  Sparkles,
  ChevronRight,
  Settings,
  Trash2,
  CheckCheck,
  Send,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenPayment: (purpose?: PaymentPurpose) => void;
  isDarkMode: boolean;
  onRefreshUnreadCount?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenPayment,
  isDarkMode,
  onRefreshUnreadCount,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'recruitment' | 'badge' | 'urgent' | 'settings'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    notificationService.getBrowserPermission()
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  const loadData = () => {
    setNotifications(notificationService.getNotifications());
    setSettings(notificationService.getSettings());
    setBrowserPermission(notificationService.getBrowserPermission());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    const result = await notificationService.requestBrowserPermission();
    setBrowserPermission(result);
    setIsRequestingPermission(false);
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();

    if (notif.actionPurpose) {
      onOpenPayment(notif.actionPurpose);
      onClose();
    } else if (notif.targetTab) {
      onNavigateTab(notif.targetTab);
      onClose();
    }
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const updated = notificationService.saveSettings({ [key]: !settings[key] });
    setSettings(updated);
  };

  // Test simulation triggers
  const triggerTestRecruitment = () => {
    notificationService.sendPushNotification({
      type: 'recruitment',
      title: '📢 Recrutement : E-commerce Cotonou (3 Livreurs)',
      body: 'Bénin Express Logistics recrute immédiatement 3 livreurs 2-roues pour livraison de colis e-commerce. Salaire 150 000 FCFA/mois + carburant pris en charge.',
      city: 'Cotonou',
      targetTab: 'classifieds',
      actionLabel: 'Postuler à l\'offre',
    });
    setTestNotificationFeedback('Alerte de recrutement envoyée avec succès !');
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const triggerTestBadgeExpiration = () => {
    notificationService.sendPushNotification({
      type: 'badge_expiration',
      title: '⭐ Rappel Expiration Badge VIP 500F (24h restantes)',
      body: 'Votre badge VIP expire bientôt. Renouvelez pour 500 FCFA/semaine. Support : liencolisdrivercommunauty@gmail.com, +229 01 69 81 46 32 / +229 01 47 65 24 20.',
      city: 'Cotonou',
      actionPurpose: 'premium_badge_week',
      actionLabel: 'Renouveler mon Badge (500F)',
    });
    setTestNotificationFeedback('Rappel d\'expiration du badge VIP 500F envoyé avec succès !');
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const triggerTestUrgentDelivery = () => {
    notificationService.notifyUrgentDelivery(
      'Course Urgente Médicaments Ganhi ➔ Haie Vive',
      'Cotonou',
      2000
    );
    setTestNotificationFeedback('Alerte course urgente 30min envoyée !');
    loadData();
    if (onRefreshUnreadCount) onRefreshUnreadCount();
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'recruitment') return n.type === 'recruitment';
    if (activeTab === 'badge') return n.type === 'badge_expiration' || n.type === 'subscription_expiry';
    if (activeTab === 'urgent') return n.type === 'urgent_delivery';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        id="notification-center-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Notifications Web & Push Livreurs</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow">
                    {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Alertes de recrutement, rappels d'expiration des badges VIP 500F & courses express
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Push Permission Banner */}
        <div className="p-3.5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-emerald-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <Smartphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-white">État du service Web Push : </span>
              {browserPermission === 'granted' ? (
                <span className="text-emerald-400 font-bold">✅ Actif (Alertes système autorisées)</span>
              ) : browserPermission === 'denied' ? (
                <span className="text-rose-400 font-bold">❌ Bloqué dans le navigateur (Mode son & vibration in-app actif)</span>
              ) : (
                <span className="text-amber-300 font-bold">⚠️ En attente d'autorisation</span>
              )}
            </div>
          </div>

          {browserPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isRequestingPermission ? 'Demande en cours...' : 'Autoriser les Notifications Push'}</span>
            </button>
          )}
        </div>

        {/* Interactive Simulation & Test Bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tester les alertes en direct :</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={triggerTestRecruitment}
              className="px-2.5 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
              title="Tester l'alerte nouvelle offre de recrutement"
            >
              <Radio className="w-3 h-3" />
              <span>+ Test Recrutement</span>
            </button>

            <button
              onClick={triggerTestBadgeExpiration}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
              title="Tester le rappel d'expiration du badge VIP 500 FCFA"
            >
              <Star className="w-3 h-3 fill-amber-400" />
              <span>+ Test Expiration Badge VIP</span>
            </button>

            <button
              onClick={triggerTestUrgentDelivery}
              className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
              title="Tester l'alerte course urgente 30min"
            >
              <Zap className="w-3 h-3" />
              <span>+ Test Course Urgente</span>
            </button>
          </div>
        </div>

        {testNotificationFeedback && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-1.5 text-center text-xs font-bold text-emerald-300 animate-in fade-in">
            {testNotificationFeedback}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 text-xs px-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 px-3 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'all'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Toutes ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recruitment')}
            className={`py-2.5 px-3 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'recruitment'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Recrutement</span>
          </button>

          <button
            onClick={() => setActiveTab('badge')}
            className={`py-2.5 px-3 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'badge'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Badge VIP 500F</span>
          </button>

          <button
            onClick={() => setActiveTab('urgent')}
            className={`py-2.5 px-3 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'urgent'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Courses 30m</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 font-bold flex items-center gap-1.5 transition-colors ml-auto ${
              activeTab === 'settings'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Préférences</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {activeTab === 'settings' ? (
            /* Settings View */
            <div className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-3">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Canaux & Alertes Push en Temps Réel
                </h4>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white">📢 Alertes Nouvelles Offres de Recrutement</span>
                      <p className="text-[11px] text-slate-400">
                        Recevoir une notification push dès qu'un restaurant, e-commerce ou particulier cherche des livreurs.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.recruitmentAlerts}
                      onChange={() => handleToggleSetting('recruitmentAlerts')}
                      className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-700/60 my-2"></div>

                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-300">⭐ Rappel Expiration Badge VIP (500 FCFA)</span>
                      <p className="text-[11px] text-slate-400">
                        Être prévenu 24h avant l'expiration de votre étoile dorée et de votre statut épinglé en tête.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.badgeExpirationAlerts}
                      onChange={() => handleToggleSetting('badgeExpirationAlerts')}
                      className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
                    />
                  </label>

                  <div className="border-t border-slate-700/60 my-2"></div>

                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="font-bold text-blue-300">⚡ Alertes Courses Urgentes & Relais (30 min)</span>
                      <p className="text-[11px] text-slate-400">
                        Notification instantanée pour les plis express et courses prioritaires dans votre ville.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.urgentDeliveryAlerts}
                      onChange={() => handleToggleSetting('urgentDeliveryAlerts')}
                      className="w-5 h-5 rounded accent-amber-400 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  Son & Retour Haptique
                </h4>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">Carillon Sonore à l'arrivée d'une alerte</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={() => handleToggleSetting('soundEnabled')}
                      className="w-5 h-5 rounded accent-emerald-400 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white">Vibration sur smartphone (Navigator Vibrate)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.vibrationEnabled}
                      onChange={() => handleToggleSetting('vibrationEnabled')}
                      className="w-5 h-5 rounded accent-emerald-400 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Bell className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Aucune notification dans cette catégorie</p>
              <p className="text-[11px] text-slate-500">
                Utilisez les boutons de test ci-dessus pour simuler une nouvelle alerte.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isUnread
                      ? notif.type === 'badge_expiration'
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : notif.type === 'recruitment'
                        ? 'bg-teal-950/30 border-teal-500/60 shadow-md shadow-teal-500/10'
                        : 'bg-blue-950/30 border-blue-500/60 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                      {notif.type === 'badge_expiration' ? (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ) : notif.type === 'recruitment' ? (
                        <Radio className="w-4 h-4 text-teal-400" />
                      ) : notif.type === 'urgent_delivery' ? (
                        <Zap className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Bell className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{notif.title}</span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(notif.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{notif.body}</p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
                        {notif.city && (
                          <span className="text-[10px] text-slate-400">📍 {notif.city}</span>
                        )}

                        <span className="text-xs font-black text-amber-400 flex items-center gap-1 hover:underline ml-auto">
                          <span>{notif.actionLabel || 'Ouvrir'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== 'settings' && notifications.length > 0 && (
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer tout</span>
            </button>

            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
