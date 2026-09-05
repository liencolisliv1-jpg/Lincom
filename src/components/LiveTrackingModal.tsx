import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Navigation,
  Clock,
  ShieldCheck,
  Phone,
  MessageCircle,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  X,
  Radio,
  Package,
  Bike,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Delivery } from '../types';

interface LiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !delivery) return null;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${encodeURIComponent(delivery.trackingCode)}`
    : `https://ais-dev-zxavitnsxwmknftolyo2hv-626045602467.europe-west1.run.app/?track=${delivery.trackingCode}`;

  const shareText = `Bonjour ! Suivez en direct la livraison de votre colis (${delivery.packageDescription}) par le livreur ${delivery.driverName || 'LIENCOLIS'} : ${trackingUrl} - Code de suivi : #${delivery.trackingCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(
      delivery.clientPhone.replace(/\s+/g, '')
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleSmsShare = () => {
    const smsUrl = `sms:${delivery.clientPhone.replace(/\s+/g, '')}?body=${encodeURIComponent(shareText)}`;
    window.location.href = smsUrl;
  };

  // Status mapping
  const getStatusBadge = () => {
    switch (delivery.status) {
      case 'in_transit':
        return { label: 'En Transit / En Route', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'nearby_500m':
        return { label: 'À 500m du Client (Proche)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' };
      case 'alert_300m':
        return { label: 'À 300m (Arrivée Imminente)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse' };
      case 'arrived':
        return { label: 'Livreur sur Place', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'delivered':
        return { label: 'Colis Livré & Confirmé ✓', color: 'bg-emerald-500/30 text-emerald-200 border-emerald-400' };
      default:
        return { label: 'En Préparation', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        id="live-tracking-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Suivi de Colis & GPS Direct</h3>
                <span className="font-mono text-xs font-bold text-amber-400">#{delivery.trackingCode}</span>
              </div>
              <p className="text-[11px] text-slate-400">Partage de position et heure d'arrivée en temps réel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 scrollbar-thin">
          {/* Status and ETA Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-black">
                <Radio className="w-3.5 h-3.5 animate-ping" />
                <span>GPS EN DIRECT</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Distance Restante</span>
                <span className="text-base font-black text-amber-400">
                  {delivery.distanceRemainingMeters > 1000
                    ? `${(delivery.distanceRemainingMeters / 1000).toFixed(1)} km`
                    : `${delivery.distanceRemainingMeters} m`}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Arrivée Estimée</span>
                <span className="text-base font-black text-blue-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~ {delivery.estimatedArrivalMinutes || 3} min</span>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Map Visual with Framer Motion Vehicle Movement */}
          {(() => {
            const ratio = Math.max(0, Math.min(1, 1 - delivery.distanceRemainingMeters / 1500));
            // Start: 20% left, 75% top. End: 78% left, 30% top
            const posX = 20 + ratio * 58;
            const posY = 75 - ratio * 45;

            return (
              <div className="relative w-full h-44 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
                {/* Grid background simulation */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* Connecting trajectory dashed line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1="20%"
                    y1="75%"
                    x2="78%"
                    y2="30%"
                    stroke="#10B981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <line
                    x1="20%"
                    y1="75%"
                    x2="78%"
                    y2="30%"
                    stroke="#FDE047"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    className="animate-pulse"
                  />
                </svg>

                {/* Origin Point (Pickup) */}
                <div className="absolute left-[18%] top-[75%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                  <span className="text-[9px] font-bold text-blue-300 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                    Départ
                  </span>
                </div>

                {/* Destination Point (Client Dropoff) */}
                <div className="absolute left-[78%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="p-2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-bounce shadow-lg shadow-rose-500/20">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-300 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                    Client : {delivery.dropoffAddress}
                  </span>
                </div>

                {/* Smooth Animated Driver Vehicle Marker */}
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
                    className="absolute w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50"
                    animate={{ scale: [0.8, 1.7, 0.8], opacity: [0.6, 0.15, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  />

                  {/* Bike Icon with vibration bounce */}
                  <motion.div
                    className="p-2.5 rounded-full bg-slate-950 text-amber-400 border-2 border-emerald-400 shadow-xl shadow-emerald-500/25 relative z-10"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                  >
                    <Bike className="w-5 h-5 text-emerald-400" />
                  </motion.div>

                  {/* Floating Tag */}
                  <div className="mt-1 bg-slate-950/95 border border-emerald-500/60 px-2 py-0.5 rounded-lg text-[10px] font-black text-emerald-300 flex items-center gap-1 shadow-lg whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{delivery.driverName || 'Livreur en route'}</span>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {/* Certified Driver Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-base shadow-md">
                {delivery.driverName ? delivery.driverName[0] : 'L'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-white">{delivery.driverName || 'Livreur Certifié'}</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">{delivery.driverPhone || '+229 01 69 81 46 31'}</p>
              </div>
            </div>

            {/* Quick call buttons */}
            <div className="flex items-center gap-1.5">
              {delivery.driverPhone && (
                <a
                  href={`tel:${delivery.driverPhone.replace(/\s+/g, '')}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                  title="Appeler le livreur"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Security PIN Box for Client */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-300 block">Code PIN Secret Anti-Vol</span>
              <span className="text-[11px] text-slate-300">À communiquer au livreur à la réception</span>
            </div>
            <span className="font-mono text-lg font-black text-emerald-400 bg-slate-950 px-3 py-1 rounded-xl border border-emerald-500/50">
              #{delivery.securityPin}
            </span>
          </div>

          {/* Share Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Partager le lien de suivi en direct au client :</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={trackingUrl}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono select-all"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp and SMS 1-Click Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer sur WhatsApp</span>
              </button>

              <button
                onClick={handleSmsShare}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Envoyer par SMS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">LIENCOLIS Live GPS Tracking</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
