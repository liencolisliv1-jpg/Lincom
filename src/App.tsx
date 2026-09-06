import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Delivery,
  ChatMessage,
  ClassifiedAd,
  MarketplaceItem,
  RentalItem,
  AidRequest,
  PaymentTransaction,
  DailyAdministrativeSummary,
  PaymentPurpose,
  AppNotification,
  OfflineSyncState,
} from './types';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { offlineSyncService } from './services/offlineSyncService';
import { firestoreService } from './services/firestoreService';
import { logout as logoutUser, getStoredSession } from './services/authService';
import { themeService, ThemeStatus, ThemeMode } from './services/themeService';
import { SupportedLanguage } from './services/translationService';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { GPSDeliveryTracker } from './components/GPSDeliveryTracker';
import { CommunityChat } from './components/CommunityChat';
import { ClassifiedAdsBoard } from './components/ClassifiedAdsBoard';
import { MarketplaceAndRentals } from './components/MarketplaceAndRentals';
import { MutualAidFund } from './components/MutualAidFund';
import { AdminSupportDashboard } from './components/AdminSupportDashboard';
import { AdminBackoffice } from './components/AdminBackoffice';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { UserProfileModal } from './components/UserProfileModal';
import { RulesAndTermsModal } from './components/RulesAndTermsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { NotificationToast } from './components/NotificationToast';
import { OfflineBanner } from './components/OfflineBanner';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import { PermissionsModal } from './components/PermissionsModal';
import { LiencolisLogo } from './components/LiencolisLogo';
import { UpdatesPanel } from './components/UpdatesPanel';
import { ClientTrackingView } from './components/ClientTrackingView';
import {
  Smartphone,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Download,
  Award,
  Moon,
  Sun,
  Eye,
} from 'lucide-react';

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storageService.getUser());
  const [currentTab, setCurrentTab] = useState<string>('deliveries');
  const [language, setLanguage] = useState<SupportedLanguage>('fr');
  const [themeStatus, setThemeStatus] = useState<ThemeStatus>(() => themeService.getThemeStatus());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [triggerNewDeliveryModal, setTriggerNewDeliveryModal] = useState<number>(0);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('track') || params.get('trackingCode') || null;
    }
    return null;
  });

  const isDarkMode = themeStatus.isDarkMode;

  const requireAuth = () => {
    if (!currentUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleOpenNewDelivery = () => {
    if (!requireAuth()) return;
    setCurrentTab('deliveries');
    setTriggerNewDeliveryModal((prev) => prev + 1);
  };

  useEffect(() => {
    const savedSession = getStoredSession();
    if (savedSession && !currentUser) {
      const restoredUser = storageService.getUser();
      if (restoredUser) {
        setCurrentUser(restoredUser);
      }
    }
  }, [currentUser]);

  // Subscribe to theme auto-detection & system preference changes
  useEffect(() => {
    const unsubscribe = themeService.subscribe((status) => {
      setThemeStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const handleCycleThemeMode = () => {
    const currentMode = themeStatus.mode;
    let nextMode: ThemeMode = 'auto';
    if (currentMode === 'auto') nextMode = 'dark';
    else if (currentMode === 'dark') nextMode = 'light';
    else nextMode = 'auto';

    themeService.setMode(nextMode);
  };

  const handleToggleDarkMode = () => {
    themeService.setMode(isDarkMode ? 'light' : 'dark');
  };

  // Collections State
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => storageService.getDeliveries());
  const [messages, setMessages] = useState<ChatMessage[]>(() => storageService.getMessages());
  const [ads, setAds] = useState<ClassifiedAd[]>(() => storageService.getAds());
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>(() => storageService.getMarketplace());
  const [rentals, setRentals] = useState<RentalItem[]>(() => storageService.getRentals());
  const [aidRequests, setAidRequests] = useState<AidRequest[]>(() => storageService.getAidRequests());
  const [adminSummaries, setAdminSummaries] = useState<DailyAdministrativeSummary[]>(() => storageService.getAdminSummaries());

  // Modal Visibility State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentInitialPurpose, setPaymentInitialPurpose] = useState<PaymentPurpose>('subscription_2wheels');
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [rulesModalOpen, setRulesModalOpen] = useState<boolean>(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  // Notification Center & Offline State
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [activeToastNotification, setActiveToastNotification] = useState<AppNotification | null>(null);
  const [updates, setUpdates] = useState<AppNotification[]>(() => notificationService.getNotifications());
  const [pushUnreadCount, setPushUnreadCount] = useState<number>(() => notificationService.getUnreadCount());
  const [offlineState, setOfflineState] = useState<OfflineSyncState>(() => offlineSyncService.getState());
  const [offlineModalOpen, setOfflineModalOpen] = useState<boolean>(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAdminBackoffice, setShowAdminBackoffice] = useState<boolean>(false);

  const openPaymentWithPurpose = (purpose?: PaymentPurpose | string) => {
    if (!requireAuth()) return;

    let targetPurpose: PaymentPurpose = 'subscription_2wheels';
    if (typeof purpose === 'string' && purpose) {
      targetPurpose = purpose as PaymentPurpose;
    } else if (currentUser?.role === 'driver') {
      targetPurpose = 'wallet_deposit_1200';
    }
    setPaymentInitialPurpose(targetPurpose);
    setPaymentModalOpen(true);
  };

  // Subscribe to real-time push notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotification) => {
      setUpdates(notificationService.getNotifications());
      setActiveToastNotification(newNotification);
      setPushUnreadCount(notificationService.getUnreadCount());
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to offline sync state changes
  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((state) => {
      setOfflineState(state);
    });
    return () => unsubscribe();
  }, []);

  // Check VIP badge expiration reminder periodically
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'driver' || !currentUser.premiumBadgeUntil) return;

    const expiryTime = new Date(currentUser.premiumBadgeUntil).getTime();
    const now = Date.now();
    const diffHours = Math.round((expiryTime - now) / (3600 * 1000));

    // If expiring in 24 hours or less, check if we should notify
    const hasNotifiedKey = `liencolis_notified_badge_exp_${currentUser.id}_${currentUser.premiumBadgeUntil.slice(0, 10)}`;
    if (diffHours <= 24 && diffHours > -24 && !sessionStorage.getItem(hasNotifiedKey)) {
      sessionStorage.setItem(hasNotifiedKey, 'true');
      notificationService.notifyBadgeExpiration(currentUser.name, Math.max(0, diffHours));
    }
  }, [currentUser]);

  // Sync current user to storage whenever it updates
  useEffect(() => {
    if (currentUser) {
      storageService.setUser(currentUser);
    }
  }, [currentUser]);

  // Admin Backoffice Keyboard Shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        setShowAdminBackoffice(!showAdminBackoffice);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdminBackoffice]);

  // Handlers for data mutations (with offline queueing & Firestore Cloud sync)
  const handleUpdateDelivery = (delivery: Delivery) => {
    storageService.updateDelivery(delivery);
    firestoreService.saveDelivery(delivery);
    if (!offlineSyncService.isEffectiveOnline()) {
      offlineSyncService.queueAction(
        'delivery_status_update',
        `Mise à jour course #${delivery.trackingCode} (${delivery.status})`,
        { deliveryId: delivery.id, status: delivery.status }
      );
    }
    setDeliveries(storageService.getDeliveries());
  };

  const handleAddDelivery = (delivery: Delivery) => {
    storageService.addDelivery(delivery);
    firestoreService.saveDelivery(delivery);
    if (!offlineSyncService.isEffectiveOnline()) {
      offlineSyncService.queueAction(
        'delivery_status_update',
        `Nouvelle course #${delivery.trackingCode} enregistrée hors-ligne`,
        { deliveryId: delivery.id, status: delivery.status }
      );
    }
    setDeliveries(storageService.getDeliveries());
  };

  const handleReorderDeliveries = (reordered: Delivery[]) => {
    storageService.saveDeliveries(reordered);
    setDeliveries(reordered);
  };

  const handleSendMessage = (message: ChatMessage) => {
    storageService.addMessage(message);
    if (!offlineSyncService.isEffectiveOnline()) {
      offlineSyncService.queueAction(
        'chat_message_sent',
        `Message dans le salon d'entraide (${message.senderName})`,
        message
      );
    }
    setMessages(storageService.getMessages());
  };

  const handleAddAd = (ad: ClassifiedAd) => {
    storageService.addAd(ad);
    firestoreService.saveClassifiedAd(ad);
    if (!offlineSyncService.isEffectiveOnline()) {
      offlineSyncService.queueAction(
        'new_classified_ad',
        `Petite annonce: ${ad.title}`,
        ad
      );
    }
    setAds(storageService.getAds());
  };

  const handleDeleteAd = (id: string) => {
    storageService.deleteAd(id);
    setAds(storageService.getAds());
  };

  const handleAddMarketplaceItem = (item: MarketplaceItem) => {
    storageService.addMarketplaceItem(item);
    setMarketplace(storageService.getMarketplace());
  };

  const handleAddRentalItem = (rental: RentalItem) => {
    storageService.addRentalItem(rental);
    setRentals(storageService.getRentals());
  };

  const handleAddAidRequest = (req: AidRequest) => {
    storageService.addAidRequest(req);
    firestoreService.saveAidRequest(req);
    if (!offlineSyncService.isEffectiveOnline()) {
      offlineSyncService.queueAction(
        'aid_request_created',
        `Demande d'aide tontine: ${req.incidentType} (${req.requestedAmount} FCFA)`,
        req
      );
    }
    setAidRequests(storageService.getAidRequests());
  };

  const handleManualOfflineSync = async () => {
    setIsSyncing(true);
    await offlineSyncService.syncQueuedActions();
    setIsSyncing(false);
  };

  const handleAddAdminSummary = (sum: DailyAdministrativeSummary) => {
    storageService.addAdminSummary(sum);
    firestoreService.saveAdminSummary(sum);
    setAdminSummaries(storageService.getAdminSummaries());
  };

  const handlePaymentSuccess = (tx: PaymentTransaction, updatedUser: UserProfile) => {
    storageService.addTransaction(tx);
    storageService.setUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  const handleDeleteAccount = () => {
    storageService.deleteAccount();
    setCurrentUser(null);
    alert('Votre compte et vos données ont été définitivement supprimés.');
  };

  const handleLogout = async () => {
    await logoutUser();
    storageService.deleteAccount();
    setCurrentUser(null);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Client Direct Public Parcel Tracking View */}
      {activeTrackingCode && (
        <ClientTrackingView
          trackingCode={activeTrackingCode}
          deliveries={deliveries}
          onClose={() => {
            setActiveTrackingCode(null);
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', window.location.pathname);
            }
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Admin Backoffice View */}
      {!activeTrackingCode && showAdminBackoffice && (
        <AdminBackoffice
          currentUser={currentUser}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
        />
      )}

      {!activeTrackingCode && !showAdminBackoffice && (
        <>
      {/* Top Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenProfile={() => {
          if (!requireAuth()) return;
          setProfileModalOpen(true);
        }}
        onOpenNewDelivery={() => setCurrentTab('deliveries')}
        onOpenRules={() => setRulesModalOpen(true)}
        onOpenPayment={(purpose) => openPaymentWithPurpose(purpose || (currentUser?.role === 'driver' ? 'wallet_deposit_1200' : 'subscription_2wheels'))}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={setLanguage}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        themeStatus={themeStatus}
        onCycleThemeMode={handleCycleThemeMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeDeliveriesCount={deliveries.filter((d) => d.status !== 'delivered').length}
        onInstallApp={() => setShowInstallPrompt(true)}
        onOpenNotificationCenter={() => {
          setNotificationCenterOpen(true);
          setPushUnreadCount(notificationService.getUnreadCount());
        }}
        pushNotificationUnreadCount={pushUnreadCount}
        offlineState={offlineState}
        onOpenOfflineModal={() => setOfflineModalOpen(true)}
        onOpenPermissions={() => setPermissionsModalOpen(true)}
      />

      {/* Real-time Offline Status & Sync Banner */}
      <OfflineBanner
        offlineState={offlineState}
        onOpenSyncModal={() => setOfflineModalOpen(true)}
        onManualSync={handleManualOfflineSync}
        isSyncing={isSyncing}
      />

      <UpdatesPanel
        notifications={updates}
        onOpenAll={() => setNotificationCenterOpen(true)}
        onOpenNotification={(notification) => {
          notificationService.markAsRead(notification.id);
          setUpdates(notificationService.getNotifications());
          if (notification.actionPurpose) {
            openPaymentWithPurpose(notification.actionPurpose);
          } else if (notification.targetTab) {
            setCurrentTab(notification.targetTab);
          } else {
            setNotificationCenterOpen(true);
          }
        }}
        isDarkMode={isDarkMode}
      />

      {/* Night Driving Mode Auto-Detect Notice */}
      {themeStatus.mode === 'auto' && themeStatus.reason === 'night_hours' && (
        <div className="bg-slate-950 border-b border-indigo-500/30 text-indigo-200 text-xs py-1.5 px-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
              <span>
                <strong className="text-amber-300">Conduite Nocturne :</strong> Mode sombre activé automatiquement (19h - 06h) pour la lisibilité sur route.
              </span>
            </span>
            <button
              onClick={handleCycleThemeMode}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2 py-0.5 rounded font-bold shrink-0"
            >
              Option Thème
            </button>
          </div>
        </div>
      )}

      {/* Hero Atmosphere Header on Home / Deliveries tab */}
      {currentTab === 'deliveries' && (
        <HomeHero
          onOpenNewDelivery={handleOpenNewDelivery}
          onOpenAuth={(mode = 'register') => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
          onExploreCommunity={() => setCurrentTab('community')}
          onOpenPayment={() => setPaymentModalOpen(true)}
          onInstallApp={() => setShowInstallPrompt(true)}
          onNavigateToTab={(tab) => setCurrentTab(tab)}
          onTrackParcel={(code) => {
            setActiveTrackingCode(code);
            if (typeof window !== 'undefined' && window.history) {
              const newUrl = `${window.location.pathname}?track=${encodeURIComponent(code)}`;
              window.history.pushState({ path: newUrl }, '', newUrl);
            }
          }}
        />
      )}

      {/* Main Dynamic View Content */}
      <main className="flex-1 pb-16">
        {currentTab === 'deliveries' && (
          <GPSDeliveryTracker
            deliveries={deliveries}
            currentUser={currentUser}
            onUpdateDelivery={handleUpdateDelivery}
            onAddDelivery={handleAddDelivery}
            onReorderDeliveries={handleReorderDeliveries}
            onOpenRules={() => setRulesModalOpen(true)}
            onOpenPayment={(purpose) => openPaymentWithPurpose(purpose || 'wallet_deposit_1200')}
            isDarkMode={isDarkMode}
            triggerNewDeliveryModal={triggerNewDeliveryModal}
          />
        )}

        {currentTab === 'community' && (
          <CommunityChat
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onOpenPayment={(purpose?: PaymentPurpose) => openPaymentWithPurpose(purpose || 'premium_badge_week')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'classifieds' && (
          <ClassifiedAdsBoard
            ads={ads}
            currentUser={currentUser}
            onAddAd={handleAddAd}
            onDeleteAd={handleDeleteAd}
            isDarkMode={isDarkMode}
            onOpenRecharge={() => openPaymentWithPurpose('wallet_deposit_1200')}
          />
        )}

        {(currentTab === 'marketplace' || currentTab === 'rentals') && (
          <MarketplaceAndRentals
            marketplaceItems={marketplace}
            rentalItems={rentals}
            currentUser={currentUser}
            onAddMarketplaceItem={handleAddMarketplaceItem}
            onAddRentalItem={handleAddRentalItem}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'mutual_aid' && (
          <MutualAidFund
            aidRequests={aidRequests}
            currentUser={currentUser}
            onAddAidRequest={handleAddAidRequest}
            onOpenPayment={() => openPaymentWithPurpose('aid_fund_donation')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'admin_support' && (
          <AdminSupportDashboard
            currentUser={currentUser}
            deliveries={deliveries}
            adminSummaries={adminSummaries}
            onAddAdminSummary={handleAddAdminSummary}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-2">
            <LiencolisLogo size="md" showSubtitle={true} />
            <p className="text-slate-300 max-w-md leading-relaxed text-xs">
              <strong>LIENCOLIS Driver Community</strong> est la plateforme communautaire et de sécurité routière conçue pour les livreurs béninois, particuliers, e-commerçants et restaurants.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                🇧🇯 Fait au Bénin
              </span>
              <span className="text-slate-400">Équipe : <strong>Support Liencolis</strong></span>
            </div>
          </div>

          {/* Col 2: Navigation Rapide */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Modules Liencolis</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => setCurrentTab('deliveries')} className="hover:text-amber-400">
                  Navigation GPS & Alertes 300m
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('community')} className="hover:text-amber-400">
                  Grand Groupe & Salons Villes
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('classifieds')} className="hover:text-amber-400">
                  Annonces Éphémères (30 min)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('marketplace')} className="hover:text-amber-400">
                  Matériel & Locations d'Engins
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('mutual_aid')} className="hover:text-amber-400">
                  Caisse d'Entraide Solidarité
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Assistance & Contact */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Support Officiel</h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <a href="mailto:liencolisdrivercommunauty@gmail.com" className="hover:text-amber-300">
                  liencolisdrivercommunauty@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <a href="mailto:liencolis.liv1@gmail.com" className="hover:text-amber-300">liencolis.liv1@gmail.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <a href="tel:+2290169814632" className="hover:text-emerald-300">+229 01 69 81 46 32</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <a href="tel:+2290147652420" className="hover:text-emerald-300">+229 01 47 65 24 20</a>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Cotonou, République du Bénin</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setRulesModalOpen(true)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Consulter la Charte de Sécurité ➔
              </button>
              <button
                onClick={() => setShowAdminBackoffice(true)}
                className="block text-amber-400 hover:underline font-semibold mt-2"
              >
                Espace administration
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© {new Date().getFullYear()} LIENCOLIS Driver Community. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setRulesModalOpen(true)} className="hover:text-white">
              Conditions Générales
            </button>
            <button onClick={() => setRulesModalOpen(true)} className="hover:text-white">
              Confidentialité
            </button>
            <button onClick={() => setPaymentModalOpen(true)} className="hover:text-amber-400 text-amber-300 font-bold">
              Tarifs Abonnements
            </button>
          </div>
        </div>
      </footer>

      {/* PWA / Mobile Install Instructions Modal */}
      {showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Installer Liencolis sur Mobile</h3>
              </div>
              <button onClick={() => setShowInstallPrompt(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>📱 Sur Android (Chrome) :</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Appuyez sur les 3 points verticaux en haut à droite ➔ <strong>"Ajouter à l'écran d'accueil"</strong> ou "Installer l'application".
                </p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>🍏 Sur iPhone (Safari) :</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Appuyez sur le bouton <strong>Partager (flèche vers le haut)</strong> ➔ <strong>"Sur l'écran d'accueil"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallPrompt(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs"
            >
              J'ai Compris
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
        onDeleteAccount={handleDeleteAccount}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        currentUser={currentUser}
        onPaymentSuccess={handlePaymentSuccess}
        isDarkMode={isDarkMode}
        initialPurpose={paymentInitialPurpose}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          storageService.setUser(updated);
          setCurrentUser(updated);
        }}
        onDeleteAccount={handleDeleteAccount}
        onOpenPayment={(purpose) => {
          setProfileModalOpen(false);
          openPaymentWithPurpose(purpose || 'wallet_deposit_1200');
        }}
      />

      <RulesAndTermsModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {/* Web Push Real-Time Toast Alert */}
      <NotificationToast
        notification={activeToastNotification}
        onClose={() => setActiveToastNotification(null)}
        onActionClick={(notif) => {
          if (notif.actionPurpose) {
            openPaymentWithPurpose(notif.actionPurpose);
          } else if (notif.targetTab) {
            setCurrentTab(notif.targetTab);
          }
        }}
      />

      {/* Web Push Notification Center Modal */}
      <NotificationCenterModal
        isOpen={notificationCenterOpen}
        onClose={() => {
          setNotificationCenterOpen(false);
          setPushUnreadCount(notificationService.getUnreadCount());
        }}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenPayment={(purpose) => openPaymentWithPurpose(purpose || 'premium_badge_week')}
        isDarkMode={isDarkMode}
        onRefreshUnreadCount={() => setPushUnreadCount(notificationService.getUnreadCount())}
      />

      {/* Offline Sync & Diagnostics Modal */}
      <OfflineSyncModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
        offlineState={offlineState}
        onTriggerSync={handleManualOfflineSync}
        isSyncing={isSyncing}
      />

      {/* Mobile Install & QR Code Testing Modal */}
      <MobileInstallModal
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />

      {/* Permissions Center Modal */}
      <PermissionsModal
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
      />
        </>
      )}
    </div>
  );
}
