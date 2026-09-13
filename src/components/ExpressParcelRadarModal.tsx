import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Radar,
  Volume2,
  VolumeX,
  Navigation,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Bike,
  Truck,
  Car,
  Phone,
  Share2,
  Zap,
  Sliders,
  Filter,
  Play,
  RotateCw,
  Award,
} from 'lucide-react';
import { Delivery, ClassifiedAd, UserProfile } from '../types';
import { notificationService } from '../services/notificationService';
import { voiceService } from '../services/voiceService';
import confetti from 'canvas-confetti';

interface ExpressParcelRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: Delivery[];
  ads: ClassifiedAd[];
  currentUser?: UserProfile | null;
  onAcceptDelivery?: (delivery: Delivery) => void;
  onOpenPriceCalculator?: (pickup: string, dropoff: string) => void;
  isDarkMode?: boolean;
}

interface DetectedParcel {
  id: string;
  source: 'delivery' | 'ad';
  title: string;
  pickup: string;
  dropoff: string;
  city: string;
  priceFcfa: number;
  distanceKm: number;
  vehicleNeeded: 'moto' | 'tricycle' | 'car';
  urgency: 'high' | 'medium';
  timeAgoMinutes: number;
  contactPhone?: string;
  isPrivilegedSender?: boolean;
  senderBadge?: string;
  originalItem: Delivery | ClassifiedAd;
}

export const ExpressParcelRadarModal: React.FC<ExpressParcelRadarModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  ads,
  currentUser,
  onAcceptDelivery,
  onOpenPriceCalculator,
  isDarkMode = true,
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(5);
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'moto' | 'tricycle' | 'car'>('all');
  const [userLocation, setUserLocation] = useState<string>('Cadjehoun, Cotonou');
  const [recentPings, setRecentPings] = useState<number>(0);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  // Generate radar detected items based on active deliveries and classified ads
  const detectedParcels = useMemo<DetectedParcel[]>(() => {
    const list: DetectedParcel[] = [];

    // From active deliveries waiting for assignment
    deliveries
      .filter((d) => d.status === 'pending' || !d.driverId)
      .slice(0, 8)
      .forEach((d, idx) => {
        const dist = Number((0.8 + idx * 0.9).toFixed(1));
        list.push({
          id: d.id,
          source: 'delivery',
          title: `Colis ${d.packageDescription || 'Express'} (#${d.trackingCode})`,
          pickup: d.pickupAddress || d.pickupCity || 'Cadjehoun',
          dropoff: d.dropoffAddress || d.dropoffCity,
          city: d.dropoffCity || 'Cotonou',
          priceFcfa: d.deliveryFee || 2000,
          distanceKm: dist,
          vehicleNeeded: d.packageDescription?.toLowerCase().includes('sac') ? 'tricycle' : 'moto',
          urgency: 'high',
          timeAgoMinutes: Math.max(2, (idx + 1) * 4),
          contactPhone: d.clientPhone,
          isPrivilegedSender: d.isPrivilegedSender,
          senderBadge: d.privilegedSenderBadge,
          originalItem: d,
        });
      });

    // From classified ads (relays & individual urgent needs)
    ads
      .filter((ad) => ad.category === 'individual_need' || ad.category === 'driver_relay')
      .slice(0, 6)
      .forEach((ad, idx) => {
        const dist = Number((1.2 + idx * 1.1).toFixed(1));
        list.push({
          id: ad.id,
          source: 'ad',
          title: ad.title,
          pickup: ad.city || 'Akpakpa',
          dropoff: ad.description.includes('Calavi') ? 'Calavi Kpota' : 'Haie Vive',
          city: ad.city || 'Cotonou',
          priceFcfa: ad.price || 1800,
          distanceKm: dist,
          vehicleNeeded: 'moto',
          urgency: 'high',
          timeAgoMinutes: Math.max(3, (idx + 2) * 5),
          contactPhone: ad.phone,
          isPrivilegedSender: ad.isPrivilegedSender,
          senderBadge: ad.senderBadge,
          originalItem: ad,
        });
      });

    // Sort by priority (Privileged subscribers first), then proximity
    return list
      .filter((p) => p.distanceKm <= maxRadiusKm)
      .filter((p) => (vehicleFilter === 'all' ? true : p.vehicleNeeded === vehicleFilter))
      .sort((a, b) => {
        if (a.isPrivilegedSender && !b.isPrivilegedSender) return -1;
        if (!a.isPrivilegedSender && b.isPrivilegedSender) return 1;
        return a.distanceKm - b.distanceKm;
      });
  }, [deliveries, ads, maxRadiusKm, vehicleFilter]);

  // Audio radar pulse when radar opens or detects new items
  useEffect(() => {
    if (isOpen && isScanning && soundEnabled && detectedParcels.length > 0) {
      const topParcel = detectedParcels[0];
      voiceService.playAlertSound('primary_500m');
      setTimeout(() => {
        voiceService.speak(`Radar Liencolis : Colis express détecté à ${topParcel.distanceKm} kilomètres.`);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatePing = () => {
    setRecentPings((prev) => prev + 1);
    voiceService.playAlertSound('warning_300m');
    voiceService.triggerProximityVibration('300m');
    voiceService.speak("Nouveau colis express détecté à 900 mètres !");
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.5 } });
  };

  const handleAccept = (parcel: DetectedParcel) => {
    setAcceptedId(parcel.id);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    notificationService.speak(`Course acceptée. Direction ${parcel.pickup}.`);
    if (onAcceptDelivery) {
      if (parcel.source === 'delivery') {
        onAcceptDelivery(parcel.originalItem as Delivery);
      } else {
        const ad = parcel.originalItem as ClassifiedAd;
        const newDel: Delivery = {
          id: `del_${Date.now()}`,
          trackingCode: `LC-BJ-${Math.floor(1000 + Math.random() * 9000)}`,
          clientPseudo: ad.authorName || 'Client Annonce',
          clientPhone: ad.phone,
          pickupAddress: parcel.pickup,
          pickupCity: parcel.city,
          dropoffAddress: parcel.dropoff,
          dropoffCity: parcel.city,
          packageDescription: parcel.title,
          deliveryFee: parcel.priceFcfa,
          status: 'in_transit',
          driverId: currentUser?.id || 'usr_driver_01',
          driverName: currentUser?.name || 'Livreur Demo',
          driverPhone: currentUser?.phone || '+229 00 00 00 00',
          driverLat: 6.3654,
          driverLng: 2.4285,
          targetLat: 6.3538,
          targetLng: 2.3982,
          distanceRemainingMeters: Math.round(parcel.distanceKm * 1000),
          estimatedArrivalMinutes: Math.round(parcel.distanceKm * 3),
          securityPin: `${Math.floor(1000 + Math.random() * 9000)}`,
          isPrimaryAlertSent: false,
          isRobotVoiceTriggered: false,
          isPrivilegedSender: ad.isPrivilegedSender,
          privilegedSenderBadge: ad.senderBadge,
          isPriorityDispatch: ad.isPrivilegedSender,
          createdAt: new Date().toISOString(),
        };
        onAcceptDelivery(newDel);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radar className={`w-6 h-6 ${isScanning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              </div>
              {isScanning && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Radar de Colis Express</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {detectedParcels.length} à proximité
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Détection en temps réel des colis postés autour de vous ({userLocation})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Désactiver les alertes vocales' : 'Activer les alertes vocales'}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sonar Radar Screen Visual */}
        <div className="relative bg-slate-950 p-4 border-b border-slate-800 flex flex-col items-center justify-center overflow-hidden">
          {/* Circular grid sonar */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-emerald-500/30 flex items-center justify-center my-2">
            {/* Center dot (Driver) */}
            <div className="absolute w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 z-20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>

            {/* Inner rings */}
            <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20"></div>
            <div className="absolute w-20 h-20 rounded-full border border-emerald-500/25"></div>
            <div className="absolute w-10 h-10 rounded-full border border-emerald-500/30"></div>

            {/* Cross hairs */}
            <div className="absolute w-full h-[1px] bg-emerald-500/15"></div>
            <div className="absolute h-full w-[1px] bg-emerald-500/15"></div>

            {/* Sonar sweep beam */}
            {isScanning && (
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-emerald-500/10 to-emerald-400/30 pointer-events-none animate-spin"
                style={{ animationDuration: '3.5s' }}
              />
            )}

            {/* Blips for detected parcels */}
            {detectedParcels.slice(0, 5).map((p, i) => {
              const angles = [45, 120, 210, 300, 160];
              const angle = angles[i % angles.length];
              const rad = (angle * Math.PI) / 180;
              const radiusPercent = Math.min(85, (p.distanceKm / maxRadiusKm) * 80 + 15);
              const top = 50 - (Math.cos(rad) * radiusPercent) / 2;
              const left = 50 + (Math.sin(rad) * radiusPercent) / 2;

              return (
                <div
                  key={p.id}
                  style={{ top: `${top}%`, left: `${left}%` }}
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  onClick={() => handleAccept(p)}
                >
                  <div className="relative">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 shadow-md"></span>
                    <div className="hidden group-hover:block absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 border border-amber-400/40 px-2 py-0.5 rounded text-[9px] text-amber-300 font-bold z-40">
                      {p.distanceKm} km • {p.priceFcfa} F
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Radar Status Bar & Radius selector */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Rayon de scan :</span>
              {[
                { label: '2 km', value: 2 },
                { label: '5 km', value: 5 },
                { label: '10 km', value: 10 },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setMaxRadiusKm(r.value)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                    maxRadiusKm === r.value
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulatePing}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Tester une Alerte Sonore</span>
              </button>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  isScanning
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                }`}
              >
                {isScanning ? 'Mettre en pause' : 'Reprendre le Scan'}
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Filter Pills */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtrer :
          </span>
          {[
            { id: 'all', label: 'Tous Véhicules' },
            { id: 'moto', label: 'Moto Zémidjan', icon: Bike },
            { id: 'tricycle', label: 'Tricycle Cargo', icon: Truck },
            { id: 'car', label: 'Voiture / Camionnette', icon: Car },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setVehicleFilter(v.id as any)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                vehicleFilter === v.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        {/* Parcel List (Detected nearby) */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/60">
          {detectedParcels.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Radar className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-xs font-bold text-slate-300">Aucun colis dans un rayon de {maxRadiusKm} km</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Élargissez le rayon de scan à 10 km ou cliquez sur "Tester une Alerte Sonore" pour simuler une détection.
              </p>
              <button
                onClick={() => setMaxRadiusKm(10)}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Élargir le Rayon à 10 km
              </button>
            </div>
          ) : (
            detectedParcels.map((p) => {
              const isAccepted = acceptedId === p.id;
              return (
                <div
                  key={p.id}
                  className={`pt-2.5 first:pt-0 rounded-2xl transition-all ${
                    isAccepted
                      ? 'bg-emerald-950/30 p-3 border border-emerald-500/40'
                      : p.isPrivilegedSender
                      ? 'bg-amber-500/10 p-3 border border-amber-500/40 shadow-sm'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.isPrivilegedSender && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/25 text-amber-300 font-bold text-[10px] border border-amber-500/50 flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>{p.senderBadge || '⭐ Abonné Privilégié (Prioritaire)'}</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> à {p.distanceKm} km
                        </span>
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        <span className="text-[10px] text-slate-500">• Il y a {p.timeAgoMinutes} min</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <strong className="text-slate-200">{p.pickup}</strong>
                        </span>
                        <span className="text-slate-500">➔</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <strong className="text-slate-200">{p.dropoff}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
                      <div className="text-right sm:mr-2">
                        <span className="text-sm font-black text-amber-400 font-mono block">
                          {p.priceFcfa.toLocaleString()} FCFA
                        </span>
                        <span className="text-[9px] text-emerald-400 font-semibold block">Gain Garanti</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onOpenPriceCalculator && (
                          <button
                            onClick={() => onOpenPriceCalculator(p.pickup, p.dropoff)}
                            title="Vérifier le barème équitable"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                          >
                            Barème
                          </button>
                        )}
                        <button
                          onClick={() => handleAccept(p)}
                          disabled={isAccepted}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAccepted
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-md'
                          }`}
                        >
                          {isAccepted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Acceptée !</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Prendre la Course</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>🔔 Alertes sonores et vocales optimisées pour conduite moto &amp; casque Bluetooth.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold hover:text-white"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
