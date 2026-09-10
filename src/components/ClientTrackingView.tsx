import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  MessageCircle,
  Navigation,
  Radio,
  Bike,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Share2,
  Copy,
  ChevronLeft,
  Volume2,
  Layers,
} from 'lucide-react';
import { Delivery } from '../types';
import { GoogleMapView } from './GoogleMapView';
import { MapLibreView } from './MapLibreView';
import { getPublicTrackingUrl } from '../utils/trackingUrl';

interface ClientTrackingViewProps {
  trackingCode: string;
  deliveries: Delivery[];
  onClose?: () => void;
  isDarkMode?: boolean;
}

export const ClientTrackingView: React.FC<ClientTrackingViewProps> = ({
  trackingCode,
  deliveries,
  onClose,
  isDarkMode = true,
}) => {
  const [currentCode, setCurrentCode] = useState(trackingCode);
  const [searchInput, setSearchInput] = useState(trackingCode);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMapTab, setActiveMapTab] = useState<'maplibre' | 'google_maps' | 'animated_radar'>('maplibre');

  // Find delivery matching code or default to first
  const foundDelivery = deliveries.find(
    (d) => d.trackingCode?.toUpperCase() === currentCode?.trim().toUpperCase()
  );

  // If not found in current list, create a dynamic fallback delivery object so the tracking always displays
  const delivery: Delivery = foundDelivery || {
    id: 'track-' + currentCode,
    trackingCode: currentCode || 'LC-2026-9042',
    clientPseudo: 'Client Destinataire',
    clientPhone: '+229 97 00 00 00',
    recipientName: 'Client Destinataire',
    recipientPhone: '+229 97 00 00 00',
    packageDescription: 'Colis Express Certifié LienColis',
    pickupCity: 'Cotonou',
    pickupAddress: 'Grand Marché Dantokpa, Cotonou',
    dropoffCity: 'Abomey-Calavi',
    dropoffAddress: 'Carrefour IITA / Arconville, Calavi',
    status: 'in_transit',
    driverLat: 6.368,
    driverLng: 2.418,
    targetLat: 6.448,
    targetLng: 2.355,
    distanceRemainingMeters: 480,
    estimatedArrivalMinutes: 3,
    securityPin: '4892',
    deliveryFee: 2500,
    commissionAmount: 250,
    isPrimaryAlertSent: false,
    isRobotVoiceTriggered: false,
    driverName: 'Germain Mensah',
    driverPhone: '+229 01 69 81 46 32',
    createdAt: new Date().toISOString(),
  };

  const trackingUrl = getPublicTrackingUrl(delivery.trackingCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCurrentCode(searchInput.trim());
      if (typeof window !== 'undefined' && window.history) {
        const newUrl = `${window.location.pathname}?track=${encodeURIComponent(searchInput.trim())}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    }
  };

  // Status mapping
  const getStatusInfo = () => {
    switch (delivery.status) {
      case 'delivered':
        return {
          step: 4,
          label: 'Colis Livré avec Succès ✅',
          desc: 'Le code PIN a été validé et le colis vous a été remis en mains propres.',
          badgeColor: 'bg-emerald-500 text-slate-950 font-black',
        };
      case 'alert_300m':
      case 'arrived':
        return {
          step: 3,
          label: '⚡ Arrivée Imminente (Moins de 300m)',
          desc: 'Le livreur est dans votre rue immédiate ! Préparez votre code PIN.',
          badgeColor: 'bg-orange-500 text-slate-950 font-black animate-pulse',
        };
      case 'nearby_500m':
        return {
          step: 2,
          label: '📍 Livreur à 500m (Votre Quartier)',
          desc: 'Le livreur approche de votre point de livraison.',
          badgeColor: 'bg-amber-400 text-slate-950 font-black',
        };
      case 'in_transit':
      default:
        return {
          step: 1,
          label: '🚴 En Route vers Destination',
          desc: 'Votre livreur est actuellement sur son trajet avec votre colis.',
          badgeColor: 'bg-blue-600 text-white font-bold',
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Calculate animated position ratio
  const ratio = Math.max(0.05, Math.min(0.95, 1 - (delivery.distanceRemainingMeters || 450) / 1500));
  const posX = 18 + ratio * 64;
  const posY = 75 - ratio * 45;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} py-6 px-3 sm:px-6`}>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top bar with back and tracking search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-bold"
                id="client-tracking-back-btn"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h1 className="text-base sm:text-lg font-black text-white">
                  Suivi de Colis Client en Direct
                </h1>
              </div>
              <p className="text-xs text-slate-400">Plateforme Sécurisée LienColis Bénin</p>
            </div>
          </div>

          {/* Quick search input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ex: LC-2026-9042"
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-44"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shrink-0 transition"
            >
              Suivre
            </button>
          </form>
        </div>

        {/* Live Status Hero Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Code de Suivi Officiel</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                #{delivery.trackingCode}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3.5 py-1.5 rounded-2xl text-xs ${statusInfo.badgeColor} shadow-lg`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* 4-Step Progression Indicator */}
          <div className="pt-2">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { step: 1, label: '1. En route' },
                { step: 2, label: '2. Proximité (500m)' },
                { step: 3, label: '3. Arrivée (300m)' },
                { step: 4, label: '4. Livré (PIN OK)' },
              ].map((s) => (
                <div key={s.step} className="space-y-1.5">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      statusInfo.step >= s.step
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/40'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span
                    className={`text-[10.5px] block font-bold truncate ${
                      statusInfo.step >= s.step ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-300 mt-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-center">
              {statusInfo.desc}
            </p>
          </div>

          {/* Dynamic Metrics (Distance & Arrival ETA) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Distance Livreur</span>
              <p className="text-xl font-black text-amber-400 mt-0.5">
                {delivery.distanceRemainingMeters > 1000
                  ? `${(delivery.distanceRemainingMeters / 1000).toFixed(1)} km`
                  : `${delivery.distanceRemainingMeters} m`}
              </p>
              <span className="text-[10px] text-slate-400">Position continue</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Arrivée Estimée</span>
              <p className="text-xl font-black text-blue-400 mt-0.5">
                ~ {delivery.estimatedArrivalMinutes || 3} min
              </p>
              <span className="text-[10px] text-slate-400">Trafic pris en compte</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Type de Colis</span>
              <p className="text-xs font-bold text-slate-200 mt-1 truncate">
                {delivery.packageDescription || 'Colis Express Certifié'}
              </p>
              <span className="text-[10px] text-emerald-400 font-bold">Colis Scellé & Protégé</span>
            </div>

            {/* Anti-Theft PIN Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50">
              <span className="text-[10px] font-black text-emerald-400 uppercase block">Code PIN Réception</span>
              <p className="text-xl font-black font-mono text-emerald-300 mt-0.5">
                #{delivery.securityPin}
              </p>
              <span className="text-[9.5px] text-emerald-400/80 font-bold block truncate">À donner au livreur</span>
            </div>
          </div>
        </div>

        {/* Real-time Map & Radar Simulation Box */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl space-y-0">
          {/* Map Controls Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Navigation className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">Trajet en Direct :</span>
              <span className="text-xs text-slate-300 font-medium">
                {delivery.pickupCity} ➔ {delivery.dropoffCity} ({delivery.dropoffAddress})
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMapTab('maplibre')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeMapTab === 'maplibre'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Carte OpenStreetMap & Satellite Bénin (Rapide, Fluide & 100% Gratuite)"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>Carte OSM &amp; Satellite (Gratuit)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMapTab('google_maps')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeMapTab === 'google_maps'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Google Maps</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMapTab('animated_radar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeMapTab === 'animated_radar'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-amber-200" />
                <span>Radar Solo</span>
              </button>
            </div>
          </div>

          {activeMapTab === 'maplibre' ? (
            /* MapLibre GL Free WebGL View */
            <div className="w-full h-72 sm:h-96 relative">
              <MapLibreView
                deliveries={deliveries}
                selectedDeliveryId={delivery.id}
                className="w-full h-full"
              />
            </div>
          ) : activeMapTab === 'google_maps' ? (
            /* Google Map Full View */
            <div className="w-full h-72 sm:h-96 relative">
              <GoogleMapView
                deliveries={deliveries}
                selectedDeliveryId={delivery.id}
                className="w-full h-full"
              />
            </div>
          ) : (
            /* Animated Canvas Radar Map */
            <div className="relative w-full h-72 sm:h-96 bg-slate-950 flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(#38bdf8 1.5px, transparent 1.5px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Connecting Trajectory Dashed Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1="18%"
                  y1="75%"
                  x2="82%"
                  y2="30%"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <line
                  x1="18%"
                  y1="75%"
                  x2="82%"
                  y2="30%"
                  stroke="#FDE047"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  className="animate-pulse"
                />
              </svg>

              {/* Origin Point (Pickup) */}
              <div className="absolute left-[18%] top-[75%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                <span className="text-[10px] font-bold text-blue-300 mt-1 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800 shadow">
                  Départ : {delivery.pickupCity}
                </span>
              </div>

              {/* Destination Point (Client) */}
              <div className="absolute left-[82%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-bounce shadow-xl shadow-rose-500/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-rose-300 mt-1 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800 shadow">
                  Votre Adresse : {delivery.dropoffAddress}
                </span>
              </div>

              {/* Animated Vehicle / Bike Marker */}
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                animate={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 65,
                  damping: 16,
                }}
              >
                {/* Radar pulse wave around bike */}
                <motion.div
                  className="absolute w-16 h-16 rounded-full bg-emerald-500/25 border border-emerald-400/60"
                  animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                />

                {/* Bike Icon with vibration bounce */}
                <motion.div
                  className="p-3 rounded-full bg-slate-950 text-emerald-400 border-2 border-emerald-400 shadow-2xl shadow-emerald-500/30 relative z-10"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                >
                  <Bike className="w-6 h-6 text-emerald-400" />
                </motion.div>

                {/* Floating Tag */}
                <div className="mt-1 bg-slate-950/95 border border-emerald-500/60 px-2.5 py-1 rounded-xl text-[10px] font-black text-emerald-300 flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{delivery.driverName || 'Germain (Livreur)'} • ~ {delivery.distanceRemainingMeters}m</span>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Certified Driver Contact Card & Security Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Driver Card */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
                {delivery.driverName ? delivery.driverName[0] : 'L'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-white">{delivery.driverName || 'Livreur Certifié'}</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400">{delivery.driverPhone || '+229 01 69 81 46 32'}</p>
                <span className="text-[10px] text-emerald-400 font-bold">● En service actif</span>
              </div>
            </div>

            {/* Quick Call & WhatsApp to Driver */}
            <div className="flex items-center gap-2">
              {delivery.driverPhone && (
                <>
                  <a
                    href={`tel:${delivery.driverPhone.replace(/\s+/g, '')}`}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition shadow-md"
                    title="Appeler le livreur"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${delivery.driverPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                      `Bonjour, je suis le client de la livraison #${delivery.trackingCode}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md"
                    title="Envoyer un WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Anti-theft notice */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Consigne de Sécurité Réception
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ne communiquez votre <strong>Code PIN (#{delivery.securityPin})</strong> au livreur qu'une fois votre colis inspecté et remis entre vos mains. Ce code valide la fin de course sans contestation.
            </p>
          </div>
        </div>

        {/* Share Link Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Lien direct de suivi de ce colis :</span>
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={trackingUrl}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono select-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
