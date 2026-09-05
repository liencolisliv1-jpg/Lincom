import { AppNotification, NotificationSettings, NotificationType, PaymentPurpose, ClassifiedAd, Delivery } from '../types';
import { firestoreService } from './firestoreService';

const STORAGE_KEYS = {
  NOTIFICATIONS: 'liencolis_notifications',
  SETTINGS: 'liencolis_notification_settings',
};

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  recruitmentAlerts: true,
  badgeExpirationAlerts: true,
  urgentDeliveryAlerts: true,
  aidFundAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_01',
    type: 'recruitment',
    title: '📢 Recrutement Urgent Livreur (Cotonou)',
    body: 'Le Restaurant Le Privilège (Haie Vive) recherche 3 livreurs 2-roues pour tournées midi/soir. Rémunération : 140 000 FCFA/mois + primes de course.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isRead: false,
    city: 'Cotonou',
    targetTab: 'classifieds',
    actionLabel: 'Voir l\'offre de recrutement',
  },
  {
    id: 'notif_02',
    type: 'badge_expiration',
    title: '⭐ Rappel Expiration Badge VIP 500 FCFA',
    body: 'Votre étoile dorée et votre profil épinglé en tête de liste dans les salons expirent dans 24h. Renouvelez votre abonnement hebdomadaire pour conserver la priorité.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: false,
    city: 'Cotonou',
    actionPurpose: 'premium_badge_week',
    actionLabel: 'Renouveler mon Badge (500F)',
  },
  {
    id: 'notif_03',
    type: 'urgent_delivery',
    title: '⚡ Relais Colis Urgent (Abomey-Calavi)',
    body: 'Colis fragile en attente de prise en charge à Kpota vers Zogbadjè. Tarif garanti : 2 500 FCFA.',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    isRead: true,
    city: 'Abomey-Calavi',
    targetTab: 'classifieds',
    actionLabel: 'Prendre la course',
  },
];

type NotificationListener = (notification: AppNotification) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  public getSettings(): NotificationSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<NotificationSettings>): NotificationSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  public getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  }

  public getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.isRead).length;
  }

  public markAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  public markAllAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  public clearAll(): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      return Notification.permission;
    } catch {
      return 'unsupported';
    }
  }

  public async requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      if (typeof Notification.requestPermission === 'function') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.saveSettings({ pushEnabled: true });
          this.playNotificationSound();
        }
        return permission;
      }
      return 'unsupported';
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  public playNotificationSound(): void {
    const settings = this.getSettings();
    if (!settings.soundEnabled) return;

    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx || typeof AudioCtx !== 'function') return;

      if (!this.audioContext) {
        try {
          this.audioContext = new AudioCtx();
        } catch {
          return;
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (!this.audioContext) return;
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      // Harmonic chime (A5 -> E6)
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }

    if (settings.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {}
    }
  }

  private showNativeNotification(fullNotification: AppNotification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      if (Notification.permission !== 'granted') return;

      if ('serviceWorker' in navigator && navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((registration) => {
            if (registration && typeof registration.showNotification === 'function') {
              registration.showNotification(fullNotification.title, {
                body: fullNotification.body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: fullNotification.type,
                data: {
                  url: window.location.href,
                  targetTab: fullNotification.targetTab,
                  purpose: fullNotification.actionPurpose,
                },
              } as any).catch(() => {});
            }
          })
          .catch(() => {});
      }
    } catch {
      // Safe fallback - In-app UI handles notifications seamlessly
    }
  }

  public sendPushNotification(notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification {
    const settings = this.getSettings();

    // Check if category is enabled in settings
    if (notificationData.type === 'recruitment' && !settings.recruitmentAlerts) return null as any;
    if (notificationData.type === 'badge_expiration' && !settings.badgeExpirationAlerts) return null as any;
    if (notificationData.type === 'urgent_delivery' && !settings.urgentDeliveryAlerts) return null as any;
    if (notificationData.type === 'aid_fund' && !settings.aidFundAlerts) return null as any;

    const fullNotification: AppNotification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Save to local storage
    const list = this.getNotifications();
    list.unshift(fullNotification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 50)));

    // Sync to Firestore Cloud in background
    firestoreService.saveNotification(fullNotification).catch(() => {});

    // Play chime sound & vibration
    this.playNotificationSound();

    // Native Web Push Notification if granted
    this.showNativeNotification(fullNotification);

    // Broadcast to UI subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(fullNotification);
      } catch (err) {
        console.error('Error notifying listener', err);
      }
    });

    return fullNotification;
  }

  /**
   * Text-to-speech vocal synthesizer for voice alerts
   */
  public speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const SpeechUtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!SpeechUtteranceClass || typeof SpeechUtteranceClass !== 'function') return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechUtteranceClass(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }

  /**
   * Dispatches an alert when a new recruitment ad is posted
   */
  public notifyNewRecruitmentAd(ad: ClassifiedAd): void {
    this.sendPushNotification({
      type: 'recruitment',
      title: `📢 Offre de Recrutement : ${ad.title}`,
      body: `${ad.authorName} recrute des livreurs à ${ad.city} : "${ad.description.slice(0, 100)}..." Contact : ${ad.phone}`,
      city: ad.city,
      targetTab: 'classifieds',
      actionLabel: 'Postuler / Contacter',
      metadata: { adId: ad.id, phone: ad.phone },
    });
  }

  /**
   * Dispatches an alert for badge VIP expiration reminder
   */
  public notifyBadgeExpiration(driverName: string, hoursRemaining: number = 24): void {
    const isExpired = hoursRemaining <= 0;
    this.sendPushNotification({
      type: 'badge_expiration',
      title: isExpired ? '⭐ Badge VIP Expiré !' : `⭐ Rappel Expiration Badge VIP (${hoursRemaining}h restantes)`,
      body: isExpired
        ? `${driverName}, votre étoile dorée a expiré. Votre profil n'est plus épinglé en tête de liste. Renouvelez pour 500 FCFA/semaine.`
        : `${driverName}, votre badge VIP et votre épinglage en tête de liste expirent dans ${hoursRemaining}h. Renouvelez pour 500 FCFA/semaine pour maintenir vos courses prioritaires.`,
      actionPurpose: 'premium_badge_week',
      actionLabel: 'Renouveler pour 500 FCFA',
      metadata: { hoursRemaining },
    });
  }

  /**
   * Dispatches an alert for urgent order
   */
  public notifyUrgentDelivery(title: string, city: string, priceFcfa: number): void {
    this.sendPushNotification({
      type: 'urgent_delivery',
      title: `⚡ Course Urgente Disponible (${city})`,
      body: `${title} • Tarif immédiat garanti : ${priceFcfa.toLocaleString('fr-FR')} FCFA. Cliquez pour accepter la course.`,
      city: city,
      targetTab: 'classifieds',
      actionLabel: 'Prendre la course',
    });
  }

  /**
   * Generates formatted WhatsApp text for customer updates
   */
  public generateWhatsAppClientAlert(delivery: Delivery, driverName?: string): string {
    const courier = driverName || delivery.driverName || 'Votre livreur Liencolis';
    const cleanTracking = delivery.trackingCode || delivery.id.slice(0, 6);
    
    let statusText = 'est prise en charge';
    if (delivery.status === 'in_transit') {
      statusText = 'est EN ROUTE vers votre adresse';
    } else if (delivery.status === 'delivered') {
      statusText = 'a été LIVRÉ avec succès !';
    } else if (delivery.status === 'pending') {
      statusText = 'est en attente de départ';
    }

    const pinNotice = delivery.securityPin ? `\n🔐 Code PIN de remise : *${delivery.securityPin}*` : '';

    return `📦 *LIENCOLIS EXPRESS - Mise à jour Course #${cleanTracking}*\n\n` +
      `Bonjour ! Votre colis (${delivery.packageDescription || 'Colis'}) ${statusText}.\n` +
      `👤 Livreur : ${courier}\n` +
      `📍 Destination : ${delivery.dropoffAddress} (${delivery.dropoffCity})\n` +
      `💰 Montant livraison : ${(delivery.deliveryFee || 0).toLocaleString('fr-FR')} FCFA${pinNotice}\n\n` +
      `Merci pour votre confiance sur le réseau des livreurs du Bénin 🇧🇯 !`;
  }

  /**
   * Opens direct WhatsApp with pre-filled status notification to client
   */
  public openWhatsAppAlert(delivery: Delivery, driverName?: string): void {
    if (typeof window === 'undefined') return;
    const phone = (delivery.clientPhone || '').replace(/[^\d]/g, '');
    const text = this.generateWhatsAppClientAlert(delivery, driverName);
    const waUrl = `https://wa.me/${phone.startsWith('229') ? phone : '229' + phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Opens direct SMS intent to client with status update
   */
  public openSmsAlert(delivery: Delivery, driverName?: string): void {
    if (typeof window === 'undefined') return;
    const phone = (delivery.clientPhone || '').replace(/[^\d+]/g, '');
    const text = this.generateWhatsAppClientAlert(delivery, driverName);
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(text)}`;
    window.location.href = smsUrl;
  }

  /**
   * Notifies when a delivery changes status (Web Push + Voice synthesizer)
   */
  public notifyDeliveryStatusChange(delivery: Delivery, driverName?: string): void {
    const tracking = delivery.trackingCode || delivery.id.slice(0, 6);
    let title = `📦 Course #${tracking}`;
    let body = `Mise à jour du statut : ${delivery.status}`;

    if (delivery.status === 'in_transit') {
      title = `🚴 Colis #${tracking} En Route !`;
      body = `Le coursier ${driverName || delivery.driverName || ''} est en chemin vers ${delivery.dropoffAddress} (${delivery.dropoffCity}).`;
      this.speak(`Course ${tracking} en route vers la destination.`);
    } else if (delivery.status === 'delivered') {
      title = `✅ Colis #${tracking} Livré !`;
      body = `La livraison à ${delivery.dropoffAddress} a été validée avec succès avec le code PIN sécurisé.`;
      this.speak(`Colis ${tracking} livré avec succès. Bravo.`);
    }

    this.sendPushNotification({
      type: 'urgent_delivery',
      title,
      body,
      city: delivery.dropoffCity,
      targetTab: 'deliveries',
      actionLabel: 'Suivre la course',
    });
  }
}

export const notificationService = new NotificationService();

