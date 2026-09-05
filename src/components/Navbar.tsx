import React, { useState } from 'react';
import { LiencolisLogo } from './LiencolisLogo';
import { UserProfile, OfflineSyncState, PaymentPurpose } from '../types';
import { SUPPORTED_LANGUAGES, SupportedLanguage, TRANSLATIONS } from '../services/translationService';
import { ThemeStatus, ThemeMode, themeService } from '../services/themeService';
import { storageService } from '../services/storageService';
import { ALL_COUNTRIES, getCountryByCode } from '../constants/countries';
import { ThemeSwitcher } from './ThemeSwitcher';
import {
  MapPin,
  MessageSquare,
  Radio,
  ShoppingBag,
  Bike,
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Search,
  Globe,
  Sun,
  Moon,
  Smartphone,
  User,
  LogOut,
  Bell,
  Sparkles,
  AlertTriangle,
  Menu,
  X,
  PlusCircle,
  Award,
  WifiOff,
  Wifi,
  Database,
  Clock,
  Mail,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onOpenNewDelivery: () => void;
  onOpenRules: () => void;
  onOpenPayment: (purpose?: PaymentPurpose) => void;
  onLogout: () => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  themeStatus?: ThemeStatus;
  onCycleThemeMode?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadCount?: number;
  activeDeliveriesCount?: number;
  onInstallApp: () => void;
  onOpenNotificationCenter?: () => void;
  pushNotificationUnreadCount?: number;
  offlineState?: OfflineSyncState;
  onOpenOfflineModal?: () => void;
  onOpenPermissions?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenNewDelivery,
  onOpenRules,
  onOpenPayment,
  onLogout,
  language,
  onLanguageChange,
  isDarkMode,
  onToggleDarkMode,
  themeStatus,
  onCycleThemeMode,
  searchQuery,
  onSearchChange,
  unreadCount = 3,
  activeDeliveriesCount = 2,
  onInstallApp,
  onOpenNotificationCenter,
  pushNotificationUnreadCount = 0,
  offlineState,
  onOpenOfflineModal,
  onOpenPermissions,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const activeCountryCode = currentUser?.countryCode || storageService.getSelectedCountry();
  const currentCountry = getCountryByCode(activeCountryCode);

  const t = TRANSLATIONS[language] || TRANSLATIONS.fr;

  const isOwner = storageService.isOwnerAccount(currentUser);

  interface NavItem {
    id: string;
    label: string;
    subtitle: string;
    icon: any;
    badge?: number;
    highlight?: boolean;
    isOwnerOnly?: boolean;
    iconBg: string;
    activeBorder: string;
    activeBg: string;
  }

  const baseNavItems: NavItem[] = [
    {
      id: 'deliveries',
      label: 'Livraisons & GPS 3D',
      subtitle: 'Navigation Pro',
      icon: MapPin,
      badge: activeDeliveriesCount,
      iconBg: 'bg-amber-500/20 text-amber-400',
      activeBorder: 'border-amber-400',
      activeBg: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 backdrop-blur-md',
    },
    {
      id: 'community',
      label: 'Communauté Chauffeurs',
      subtitle: 'Chat & Audio',
      icon: MessageSquare,
      badge: unreadCount,
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      activeBorder: 'border-emerald-400',
      activeBg: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50 backdrop-blur-md',
    },
    {
      id: 'classifieds',
      label: 'Offres & Recrutement',
      subtitle: 'Alertes 24h',
      icon: Radio,
      highlight: true,
      iconBg: 'bg-purple-500/20 text-purple-400',
      activeBorder: 'border-purple-400',
      activeBg: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/50 backdrop-blur-md',
    },
    {
      id: 'mutual_aid',
      label: 'Aides Financières',
      subtitle: 'Fonds de Secours 0%',
      icon: HeartHandshake,
      iconBg: 'bg-rose-500/20 text-rose-400',
      activeBorder: 'border-rose-400',
      activeBg: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/50 backdrop-blur-md',
    },
  ];

  // Restrict the Admin tab strictly to the owner / admin account
  const navItems: NavItem[] = isOwner
    ? [
        ...baseNavItems,
        {
          id: 'admin_support',
          label: 'Direction Admin',
          subtitle: 'Supervision',
          icon: ShieldCheck,
          isOwnerOnly: true,
          iconBg: 'bg-slate-800 text-amber-400',
          activeBorder: 'border-amber-400',
          activeBg: 'bg-slate-800 text-amber-300 ring-1 ring-amber-400/40',
        },
      ]
    : baseNavItems;

  return (
    <header
      id="liencolis-header-navbar"
      className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-200 border-b bg-slate-900/95 border-slate-800 text-slate-100"
    >
      {/* Top Banner for Trial & International Network */}
      <div className="bg-gradient-to-r from-emerald-600 via-blue-700 to-amber-600 text-white text-xs py-1.5 px-3 font-semibold text-center flex items-center justify-center gap-2 overflow-x-auto shadow-inner">
        <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
        <span className="truncate">
          🌍 <strong className="text-amber-200">Réseau International Liencolis :</strong> Disponible au Bénin, dans toute l'Afrique & partout dans le monde • 10 jours d'essai GRATUIT !
        </span>
        <button
          onClick={() => onOpenPayment?.()}
          className="ml-2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-amber-300 transition-colors shrink-0"
        >
          Voir Offres
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3 shrink-0">
            <LiencolisLogo
              size="md"
              showSubtitle={true}
              onClick={() => onSelectTab('deliveries')}
            />
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full pl-9 pr-4 py-1.5 rounded-full text-xs bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Tools: Lang, DarkMode, Install, Post Delivery */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Quick Delivery Action */}
            <button
              onClick={onOpenNewDelivery}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              id="nav-new-delivery-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.new_delivery}</span>
            </button>

            {/* Country Selector */}
            <div className="relative">
              <button
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="p-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                title={`Pays actif : ${currentCountry.name} (${currentCountry.currency})`}
              >
                <span>{currentCountry.flag}</span>
                <span className="font-bold text-slate-200">{currentCountry.code}</span>
                <span className="text-[10px] text-amber-400 font-semibold">({currentCountry.currency})</span>
              </button>

              {isCountryDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 scrollbar-thin">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>🌍 Pays & Devises</span>
                    <span className="text-[10px] text-amber-400 font-normal">Afrique & Monde</span>
                  </div>
                  {ALL_COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        storageService.setSelectedCountry(country.code);
                        storageService.setSelectedCurrency(country.currency);
                        setIsCountryDropdownOpen(false);
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        activeCountryCode === country.code ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 ml-2 shrink-0">{country.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="p-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Changer de langue"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="uppercase">{language}</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    Langues / Gbe lɛ
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        language === lang.code ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      {language === lang.code && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Sync State Button */}
            {offlineState && (
              <button
                onClick={onOpenOfflineModal}
                className={`relative p-1.5 rounded-lg text-xs border transition-colors flex items-center gap-1 ${
                  !offlineState.isOnline
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                    : offlineState.pendingActionsCount > 0
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                }`}
                title={
                  !offlineState.isOnline
                    ? 'Mode Hors-Ligne Actif'
                    : offlineState.pendingActionsCount > 0
                    ? `${offlineState.pendingActionsCount} action(s) en attente de synchronisation`
                    : 'En Ligne • Cache PWA Actif'
                }
                id="nav-offline-sync-btn"
              >
                {!offlineState.isOnline ? (
                  <WifiOff className="w-4 h-4 text-amber-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                )}
                {offlineState.pendingActionsCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
                    {offlineState.pendingActionsCount}
                  </span>
                )}
              </button>
            )}

            {/* Web Push Notification Center Bell */}
            <button
              onClick={onOpenNotificationCenter}
              className="relative p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 transition-colors"
              title="Centre de notifications Web Push"
              id="nav-notification-bell-btn"
            >
              <Bell className="w-4 h-4" />
              {pushNotificationUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
                  {pushNotificationUnreadCount}
                </span>
              )}
            </button>

            {/* Direct Install PWA button */}
            <button
              onClick={onInstallApp}
              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              title="Installer Liencolis sur smartphone (Android / iOS)"
              id="nav-install-app-btn"
            >
              <Smartphone className="w-4 h-4 text-slate-950" />
              <span className="text-xs font-bold">Installer l'App</span>
            </button>

            {/* Day / Night / Auto Mode Switcher with Interactive Dropdown */}
            {themeStatus && (
              <ThemeSwitcher
                themeStatus={themeStatus}
                onCycleThemeMode={onCycleThemeMode || onToggleDarkMode}
                onSetThemeMode={(mode) => themeService.setMode(mode)}
              />
            )}

            {/* Driver Rules & Safety Charter */}
            <button
              onClick={onOpenRules}
              className="p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 flex items-center gap-1 transition-colors"
              title="Règles des livreurs & Sécurité"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Smartphone & Browser Permissions Center */}
            {onOpenPermissions && (
              <button
                onClick={onOpenPermissions}
                className="px-2 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold flex items-center gap-1 transition-colors"
                title="Centre d'autorisations GPS, Micro, Caméra & Contacts"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline text-[11px]">Permissions</span>
              </button>
            )}
          </div>

          {/* User Account / Profile Menu */}
          <div className="flex items-center gap-2">
            {currentUser && currentUser.role === 'driver' && (() => {
              const isMuted = storageService.isDriverMuted(currentUser);
              const balance = currentUser.driverWallet?.balance ?? 0;
              return (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                    isMuted
                      ? 'bg-red-950/80 hover:bg-red-900 border-red-500/70 text-red-300 animate-pulse'
                      : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-emerald-400'
                  }`}
                  title={
                    isMuted
                      ? 'Compte en sourdine (solde < 50 FCFA) : Cliquez pour recharger'
                      : 'Portefeuille chauffeur lié : Cliquez pour gérer retraits et dépôts'
                  }
                >
                  {isMuted ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="font-mono">{balance.toLocaleString()} F</span>
                  {isMuted && (
                    <span className="hidden md:inline text-[10px] px-1 py-0.2 rounded bg-red-500/30 text-red-200 uppercase font-black">
                      Sourdine
                    </span>
                  )}
                </button>
              );
            })()}

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-xs text-white shadow">
                    {currentUser.firstName ? currentUser.firstName[0] : 'G'}
                  </div>
                  <div className="hidden sm:flex flex-col pr-1">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                      {currentUser.name}
                      {currentUser.isCertified && (
                        <span className="text-[10px] text-emerald-400" title="Compte Certifié Liencolis">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium capitalize">
                      {currentUser.role === 'driver' ? 'Livreur Pro' : currentUser.role === 'merchant' ? 'Commerçant' : 'Particulier'} • {currentUser.city}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {currentUser.role.toUpperCase()}
                        </span>
                        {currentUser.hasFirstMonthDiscount && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            -10% Actif
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onOpenNotificationCenter) onOpenNotificationCenter();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-amber-300 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>Notifications Push</span>
                      </span>
                      {pushNotificationUnreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                          {pushNotificationUnreadCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenOfflineModal) onOpenOfflineModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {offlineState && !offlineState.isOnline ? (
                          <WifiOff className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Wifi className="w-4 h-4 text-emerald-400" />
                        )}
                        <span>Mode Hors-Ligne & Synchro</span>
                      </span>
                      {offlineState && offlineState.pendingActionsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                          {offlineState.pendingActionsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onOpenProfile();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <span>Mon Profil & Pièces d'identité</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenPayment(currentUser.role === 'driver' ? 'wallet_deposit_1200' : 'subscription_2wheels');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-amber-300 font-bold hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <span>{currentUser.role === 'driver' ? 'Recharger mon Portefeuille (Dépôt)' : 'Recharger / Paiements'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenPayment('subscription_2wheels');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Abonnements & Badge Premium</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenRules();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Charte Livreur & Conditions</span>
                    </button>

                    <div className="border-t border-slate-800 my-1"></div>

                    {/* Owner / Founder Discreet Access Entry */}
                    <button
                      onClick={() => {
                        onSelectTab('admin_support');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-amber-300 hover:bg-amber-500/10 flex items-center justify-between font-bold"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Espace Propriétaire / Direction</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        🔒 PIN
                      </span>
                    </button>

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs text-slate-300 hover:text-white px-3 py-1.5 font-medium transition-colors"
                >
                  Connexion
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-md transition-colors"
                >
                  Inscription
                </button>
              </div>
            )}

            {/* Quick Dark/Light/Auto Theme Toggle for Mobile Header */}
            <button
              onClick={onCycleThemeMode || onToggleDarkMode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 lg:hidden border border-slate-700 flex items-center justify-center transition-colors active:scale-95"
              title={
                themeStatus
                  ? `Mode actuel : ${themeStatus.mode === 'auto' ? 'Automatique (Nuit 19h-6h)' : themeStatus.mode === 'dark' ? 'Sombre' : 'Clair'}. Cliquez pour basculer.`
                  : isDarkMode
                  ? 'Passer en mode Jour'
                  : 'Passer en mode Nuit'
              }
              id="mobile-theme-toggle-btn"
            >
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 lg:hidden border border-slate-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Main Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-2 py-2.5 overflow-x-auto border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 relative border ${
                  isActive
                    ? item.activeBg + ' ' + item.activeBorder + ' shadow-lg'
                    : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
                } hover:scale-[1.02] active:scale-[0.98]`}
                id={`tab-btn-${item.id}`}
              >
                {/* Styled Squared Icon Box */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-slate-950 text-white shadow-inner' : item.iconBg
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-tight">{item.label}</span>
                  <span className="text-[10px] font-medium text-slate-400 opacity-80 leading-none">
                    {item.subtitle}
                  </span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-blue-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => {
              onOpenNewDelivery();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-lg active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.new_delivery}</span>
          </button>

          {/* Quick Gmail / Login shortcuts in mobile drawer for unauthenticated visitors */}
          {!currentUser && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onOpenAuth('register');
                  setIsMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>Inscription Gmail</span>
              </button>
              <button
                onClick={() => {
                  onOpenAuth('login');
                  setIsMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Se Connecter</span>
              </button>
            </div>
          )}

          {/* Navigation Links - Squared Grid on Mobile */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-between p-3.5 rounded-2xl text-center transition-all border aspect-[1/0.95] ${
                    isActive
                      ? item.activeBg + ' ' + item.activeBorder + ' shadow-md'
                      : 'bg-slate-850/90 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-full flex justify-end">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${item.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block truncate leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{item.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Country Selection in Mobile Menu */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">🌍 Pays & Devise :</span>
            <select
              value={activeCountryCode}
              onChange={(e) => {
                const code = e.target.value;
                const country = getCountryByCode(code);
                storageService.setSelectedCountry(country.code);
                storageService.setSelectedCurrency(country.currency);
                window.dispatchEvent(new Event('storage'));
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-amber-300 focus:outline-none"
            >
              {ALL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Jour / Nuit / Auto Selector in Mobile Menu */}
          {themeStatus && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Mode Affichage :</span>
              <ThemeSwitcher
                themeStatus={themeStatus}
                onCycleThemeMode={onCycleThemeMode || onToggleDarkMode}
                onSetThemeMode={(mode) => themeService.setMode(mode)}
                variant="pill"
              />
            </div>
          )}

          {/* Language and Install tools in mobile */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
            {offlineState && (
              <button
                onClick={() => {
                  if (onOpenOfflineModal) onOpenOfflineModal();
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                  !offlineState.isOnline
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-emerald-400 border-slate-700'
                }`}
              >
                {!offlineState.isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                <span>{offlineState.isOnline ? 'Online' : 'Hors-Ligne'}</span>
                {offlineState.pendingActionsCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                    {offlineState.pendingActionsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (onOpenNotificationCenter) onOpenNotificationCenter();
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded-lg bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 relative"
            >
              <Bell className="w-4 h-4" />
              <span>Alertes</span>
              {pushNotificationUnreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                  {pushNotificationUnreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onLanguageChange(l.code)}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    language === l.code ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onInstallApp();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Smartphone className="w-4 h-4 text-slate-950" />
              <span>Installer l'App</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
