import React, { useState, useEffect } from 'react';
import { LiencolisLogo } from './LiencolisLogo';

// Direct ESM imports for local assets so Vite processes them properly in dev and production
import heroDriverImg from '../assets/images/hero_driver_benin_1788086400357.jpg';
import communityCourierImg from '../assets/images/community_courier_benin_1788441002237.jpg';
import driversSolidarityImg from '../assets/images/drivers_solidarity_benin_1788441020195.jpg';
import relayDispatchImg from '../assets/images/relay_dispatch_benin_1788441039563.jpg';
import appLogoImg from '../assets/images/liencolis_official_logo_1788816569316.jpg';

import {
  Shield,
  MapPin,
  Smartphone,
  Users,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Volume2,
  Navigation,
  CheckCircle2,
  Lock,
  Gift,
  Zap,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  HeartHandshake,
  Store,
  Bike,
  Truck,
  X,
  Eye,
  Radio,
  LogIn,
  UserPlus,
  User,
} from 'lucide-react';

interface HomeHeroProps {
  onOpenNewDelivery: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onExploreCommunity: () => void;
  onOpenPayment: () => void;
  onInstallApp?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onTrackParcel?: (code: string) => void;
  currentUser?: any;
}

interface HeroSlide {
  id: string;
  image: string;
  fallbackImage: string;
  category: string;
  categoryColor: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  accentIcon: React.ReactNode;
  callout: {
    title: string;
    detail: string;
    badge: string;
  };
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onOpenNewDelivery,
  onOpenAuth,
  onExploreCommunity,
  onOpenPayment,
  onInstallApp,
  onNavigateToTab,
  onTrackParcel,
  currentUser,
}) => {
  const [heroTrackingCode, setHeroTrackingCode] = useState('');
  // Slides data showing couriers, community ties, shopkeepers and solidarity
  const slides: HeroSlide[] = [
    {
      id: 'driver_gps',
      image: heroDriverImg,
      fallbackImage: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=1200&auto=format&fit=crop&q=80',
      category: 'SÉCURITÉ ROUTIÈRE',
      categoryColor: 'from-amber-500 to-yellow-400',
      title: 'Livreur sur la Route & Guidage Vocal 300m',
      subtitle: 'Protection active du conducteur en circulation',
      description: "Le GPS vocal intelligent avertit automatiquement le livreur et le client à 300 mètres pour éviter de regarder l'écran au guidon.",
      badge: 'Zéro distraction • 100% Sécurité',
      accentIcon: <Volume2 className="w-4 h-4 text-amber-300" />,
      callout: {
        title: 'Alerte Proximité Vocale',
        detail: '"Chauffeur à 300m de votre position • Akpakpa"',
        badge: 'Mains-libres',
      },
    },
    {
      id: 'community_bonds',
      image: communityCourierImg,
      fallbackImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&auto=format&fit=crop&q=80',
      category: 'LIEN COMMUNAUTÉ & COMMERÇANTS',
      categoryColor: 'from-emerald-500 to-teal-400',
      title: 'Confiance & Soutien aux Boutiques de Quartier',
      subtitle: 'La passerelle bienveillante entre commerçants et clients',
      description: "Remise directe et souriante, code secret anti-vol et preuve photo. Liencolis valorise le commerce de proximité et fait vivre les familles.",
      badge: 'Partenariat Gagnant • Confiance Réelle',
      accentIcon: <HeartHandshake className="w-4 h-4 text-emerald-300" />,
      callout: {
        title: 'Code Anti-Vol & Remise Directe',
        detail: 'Boutique vérifiée & client livré avec le sourire',
        badge: 'Anti-Vol',
      },
    },
    {
      id: 'driver_solidarity',
      image: driversSolidarityImg,
      fallbackImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80',
      category: 'FRATERNITÉ & ENTRAIDE MUTUELLE',
      categoryColor: 'from-blue-500 to-indigo-400',
      title: 'Solidarité Chauffeurs & Caisse d’Aide Financière',
      subtitle: 'Une communauté unie pour ne laisser aucun livreur seul',
      description: "En cas de panne, d'incident de circulation ou d'imprévu, le réseau d'entraide et la caisse d'urgence Liencolis interviennent immédiatement.",
      badge: 'Caisse Secours • Dépannage Immédiat',
      accentIcon: <Shield className="w-4 h-4 text-blue-300" />,
      callout: {
        title: 'Caisse de Secours Fraternelle',
        detail: 'Avances d’urgence 0% & assistance rapide entre collègues',
        badge: 'Entraide',
      },
    },
    {
      id: 'relay_logistics',
      image: relayDispatchImg,
      fallbackImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
      category: 'RÉSEAU NATIONAL 77 COMMUNES',
      categoryColor: 'from-purple-500 to-pink-400',
      title: 'Hubs Logistiques & Relais Colis Inter-Villes',
      subtitle: 'De Cotonou à Parakou, Porto-Novo et Calavi',
      description: "Connexion fluide des colis entre villes et départements du Bénin grâce aux points relais partenaires et aux tournées interurbaines.",
      badge: '77 Communes • Transit Sécurisé',
      accentIcon: <Truck className="w-4 h-4 text-purple-300" />,
      callout: {
        title: 'Réseau Transit National',
        detail: 'Cotonou ➔ Calavi ➔ Porto-Novo ➔ Parakou',
        badge: '77 Villes',
      },
    },
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomModalOpen, setZoomModalOpen] = useState<boolean>(false);

  // Auto-play slides every 4.5 seconds
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const currentSlide = slides[currentSlideIndex];

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950/85 to-slate-900 border-b border-slate-800 text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Atmosphere Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-amber-500 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 pt-2">
            {/* Haut de texte : Badge Officiel + Boutons Connexion / Inscription */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>liencolis (driver and communauty) 🇧🇯 • lincom-1ecc6.web.app</span>
              </div>

              {!currentUser && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    id="hero-top-login-btn"
                  >
                    <LogIn className="w-3.5 h-3.5 text-sky-400" />
                    <span>Connexion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all active:scale-95"
                    id="hero-top-register-btn"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    <span>Inscription</span>
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight">
              L'Application Communautaire des <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400">Livreurs & Conducteurs</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Fini les risques d'accidents en consultant son téléphone : <strong>liencolis (driver and communauty)</strong> crée le <strong>lien direct et solidaire entre commerçants, clients et livreurs</strong> avec un GPS sonore mains-libres, des alertes automatiques à 300m et une caisse de secours fraternelle.
            </p>

            {/* 4 Pillars Grid: Community and App Features */}
            {/* Value Highlights Feature Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(0)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between aspect-[1/0.85] [transform-style:preserve-3d] hover:[transform:rotateX(6deg)_rotateY(-6deg)_translateZ(10px)] ${
                  currentSlideIndex === 0
                    ? 'bg-amber-950/60 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/50 backdrop-blur-md'
                    : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 backdrop-blur-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg border border-amber-500/30">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Sécurité & GPS Vocal 3D</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Alerte 300m mains-libres</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCurrentSlideIndex(1)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between aspect-[1/0.85] [transform-style:preserve-3d] hover:[transform:rotateX(6deg)_rotateY(6deg)_translateZ(10px)] ${
                  currentSlideIndex === 1
                    ? 'bg-emerald-950/60 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/50 backdrop-blur-md'
                    : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 backdrop-blur-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg border border-emerald-500/30">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Boutiques & Clients</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Code OTP anti-vol & confiance</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCurrentSlideIndex(2)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between aspect-[1/0.85] [transform-style:preserve-3d] hover:[transform:rotateX(-6deg)_rotateY(-6deg)_translateZ(10px)] ${
                  currentSlideIndex === 2
                    ? 'bg-blue-950/60 border-blue-400 shadow-xl shadow-blue-500/20 ring-2 ring-blue-400/50 backdrop-blur-md'
                    : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 backdrop-blur-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg border border-blue-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Fraternité Chauffeurs</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Entraide & dépannage route</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCurrentSlideIndex(3)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between aspect-[1/0.85] [transform-style:preserve-3d] hover:[transform:rotateX(-6deg)_rotateY(6deg)_translateZ(10px)] ${
                  currentSlideIndex === 3
                    ? 'bg-purple-950/60 border-purple-400 shadow-xl shadow-purple-500/20 ring-2 ring-purple-400/50 backdrop-blur-md'
                    : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 backdrop-blur-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-lg border border-purple-500/30">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Réseau 77 Communes</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Cotonou, Calavi, Parakou...</p>
                </div>
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenNewDelivery}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                id="hero-launch-delivery-btn"
              >
                <Navigation className="w-4 h-4" />
                <span>Lancer une Livraison GPS</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onInstallApp && (
                <button
                  onClick={onInstallApp}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-4 py-3 rounded-2xl text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-emerald-400/40"
                  id="hero-install-app-btn"
                >
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                  <span>Installer l'Appli Mobile</span>
                </button>
              )}

              <button
                onClick={onExploreCommunity}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-2xl text-sm border border-slate-700 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                id="hero-join-community-btn"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Rejoindre la Communauté</span>
              </button>

              <button
                onClick={onOpenPayment}
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4 px-2 py-1"
              >
                <Gift className="w-4 h-4" />
                <span>Offre 150 premiers : -10% + 10j offerts</span>
              </button>
            </div>

            {/* Client Direct Package Tracking Fast Search Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
                  <span>Suivre un Colis en Direct (Client / Destinataire) :</span>
                </span>
                <span className="text-[10.5px] text-slate-400">Suivi GPS sans compte</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (heroTrackingCode.trim() && onTrackParcel) {
                    onTrackParcel(heroTrackingCode.trim());
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={heroTrackingCode}
                  onChange={(e) => setHeroTrackingCode(e.target.value)}
                  placeholder="Collez votre code de suivi (ex: LC-2026-9042)..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  id="hero-tracking-input"
                />
                <button
                  type="submit"
                  disabled={!heroTrackingCode.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 transition shrink-0"
                  id="hero-track-submit-btn"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Suivre mon colis</span>
                </button>
              </form>
            </div>

            {/* Quick Access Bar to Core Functional Modules */}
            {onNavigateToTab && (
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modules Clés (Accès Instantané) :</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('deliveries')}
                    className="p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[11px] font-black truncate w-full">Livraisons & GPS 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('community')}
                    className="p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-black truncate w-full">Communauté & Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPayment()}
                    className="p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 text-blue-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-[11px] font-black truncate w-full">Portefeuille & Recharges</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Hero: Multi-Photo Interactive Gallery & Carousel */}
          <div className="lg:col-span-6 relative flex flex-col items-center">
            <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/90 border border-slate-700/80 p-3 shadow-2xl overflow-hidden group">
              
              {/* Top Bar of Carousel: Category + Controls */}
              <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r ${currentSlide.categoryColor} text-slate-950 shadow-sm flex items-center gap-1`}>
                    {currentSlide.accentIcon}
                    <span>{currentSlide.category}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {currentSlideIndex + 1} / {slides.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title={isPlaying ? 'Mettre en pause' : 'Lancer le diaporama'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomModalOpen(true)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Agrandir la photo"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />
                  <button
                    type="button"
                    onClick={goToPrevSlide}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Photo précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSlide}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Photo suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Image Container */}
              <div 
                className="relative w-full aspect-[16/10] sm:aspect-[16/9.5] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer select-none"
                onClick={() => setZoomModalOpen(true)}
              >
                <img
                  key={currentSlide.id}
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = currentSlide.fallbackImage;
                  }}
                />

                {/* Overlays for high legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40"></div>

                {/* Top Badge Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg">
                    <img
                      src={appLogoImg}
                      alt="Logo Liencolis"
                      className="w-5 h-5 rounded-full object-cover border border-amber-400"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[11px] font-black text-white">LIENCOLIS BÉNIN</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-slate-950 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                    <span>{currentSlide.badge}</span>
                  </div>
                </div>

                {/* Bottom Context Callout */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-xl flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentSlide.categoryColor} text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md`}>
                    {currentSlide.accentIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-100">{currentSlide.callout.title}</p>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {currentSlide.callout.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">{currentSlide.callout.detail}</p>
                  </div>
                </div>
              </div>

              {/* Slide Title & Dynamic Description */}
              <div className="mt-3 px-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    <span>{currentSlide.title}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setZoomModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  {currentSlide.description}
                </p>
              </div>

              {/* 4 Interactive Thumbnails Navigation with Progress Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="grid grid-cols-4 gap-2">
                  {slides.map((s, idx) => {
                    const isSelected = idx === currentSlideIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`relative rounded-xl overflow-hidden border text-left transition-all p-1 flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-amber-400 bg-slate-800 shadow-md ring-2 ring-amber-400/30'
                            : 'border-slate-800 bg-slate-900/60 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden bg-slate-950 relative">
                          <img
                            src={s.image}
                            alt={s.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = s.fallbackImage;
                            }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 border-2 border-amber-400 rounded-lg pointer-events-none" />
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-200 truncate w-full text-center">
                          {idx === 0 && '🏍️ GPS & Alerte'}
                          {idx === 1 && '🤝 Commerçants'}
                          {idx === 2 && '🛡️ Solidarité'}
                          {idx === 3 && '📦 77 Communes'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress bar animation */}
                {isPlaying && (
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2.5 overflow-hidden">
                    <div
                      key={currentSlideIndex}
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all"
                      style={{
                        animation: 'progress 4.5s linear forwards',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-200">Écosystème Actif au Bénin</p>
                    <p className="text-[10px] text-slate-400">Livreurs • Commerçants • Clients connectés</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-xs font-black text-amber-400">386+</span>
                    <p className="text-[9px] text-slate-400">Courses Réelles</p>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-800" />
                  <div>
                    <span className="text-xs font-black text-emerald-400">77</span>
                    <p className="text-[9px] text-slate-400">Communes</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Zoom / Full Inspection Modal for Photo Details */}
      {zoomModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r ${currentSlide.categoryColor} text-slate-950`}>
                  {currentSlide.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Photo {currentSlideIndex + 1} sur {slides.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentSlide.fallbackImage;
                }}
              />
              <button
                type="button"
                onClick={goToPrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700 transition-all shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goToNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700 transition-all shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Mission explanation */}
            <div className="p-5 space-y-3 overflow-y-auto">
              <h2 className="text-xl font-black text-white">{currentSlide.title}</h2>
              <p className="text-sm font-semibold text-amber-400">{currentSlide.subtitle}</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {currentSlide.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Bénéfice Clé</p>
                  <p className="text-xs font-bold text-slate-100 mt-0.5">{currentSlide.badge}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Impact Terrain</p>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">{currentSlide.callout.title}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Couverture</p>
                  <p className="text-xs font-bold text-amber-400 mt-0.5">Bénin 77 Communes</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setZoomModalOpen(false);
                    onOpenNewDelivery();
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Tester cette fonction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

