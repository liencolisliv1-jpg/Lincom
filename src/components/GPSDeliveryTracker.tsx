import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Delivery, DeliveryStatus, UserProfile, PaymentPurpose } from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { voiceService } from '../services/voiceService';
import { storageService } from '../services/storageService';
import { calculateDeliveryCommission } from '../utils/pricingCalculator';
import { notificationService } from '../services/notificationService';
import { InAppCallScreen } from './InAppCallScreen';
import { LiveTrackingModal } from './LiveTrackingModal';
import { RouteOptimizerModal } from './RouteOptimizerModal';
import { DailyDeliveryMidnightDigestModal } from './DailyDeliveryMidnightDigestModal';
import { GoogleMapView } from './GoogleMapView';
import { MapLibreView } from './MapLibreView';
import {
  Navigation,
  MapPin,
  Phone,
  PhoneCall,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Star,
  Shield,
  ShieldAlert,
  Volume2,
  Mic,
  MicOff,
  UserCheck,
  QrCode,
  Sparkles,
  Clock,
  Layers,
  ArrowUpRight,
  Plus,
  Play,
  RotateCcw,
  Smartphone,
  Info,
  LocateFixed,
  Radio,
  Gauge,
  Zap,
  Share2,
  LifeBuoy,
  ExternalLink,
  Mail,
  Map as MapIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Computes exact SVG coordinates (x, y) and heading angle (deg) along the delivery route path
function getVehiclePositionAndHeading(distanceMeters: number) {
  const maxDistance = 1500;
  const ratio = Math.max(0, Math.min(1, 1 - distanceMeters / maxDistance));
  const totalLength = 480; // Total length of SVG route path (100 + 80 + 240 + 60)
  const dist = ratio * totalLength;

  let x = 120;
  let y = 120;
  let angle = 0; // heading angle in degrees

  if (dist <= 100) {
    // Segment 1: (120, 120) -> (220, 120), heading east (0 deg)
    x = 120 + dist;
    y = 120;
    angle = 0;
  } else if (dist <= 180) {
    // Segment 2: (220, 120) -> (220, 200), heading south (90 deg)
    const segDist = dist - 100;
    x = 220;
    y = 120 + segDist;
    angle = 90;
  } else if (dist <= 420) {
    // Segment 3: (220, 200) -> (460, 200), heading east (0 deg)
    const segDist = dist - 180;
    x = 220 + segDist;
    y = 200;
    angle = 0;
  } else {
    // Segment 4: (460, 200) -> (460, 260), heading south (90 deg)
    const segDist = dist - 420;
    x = 460;
    y = 200 + segDist;
    angle = 90;
  }

  return { x, y, angle };
}

interface GPSDeliveryTrackerProps {
  deliveries: Delivery[];
  currentUser: UserProfile | null;
  onUpdateDelivery: (delivery: Delivery) => void;
  onAddDelivery: (delivery: Delivery) => void;
  onReorderDeliveries?: (deliveries: Delivery[]) => void;
  onOpenRules: () => void;
  onOpenPayment?: (purpose?: PaymentPurpose) => void;
  isDarkMode: boolean;
  triggerNewDeliveryModal?: number;
}

export const GPSDeliveryTracker: React.FC<GPSDeliveryTrackerProps> = ({
  deliveries,
  currentUser,
  onUpdateDelivery,
  onAddDelivery,
  onReorderDeliveries,
  onOpenRules,
  onOpenPayment,
  isDarkMode,
  triggerNewDeliveryModal,
}) => {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(
    deliveries.length > 0 ? deliveries[0].id : ''
  );
  const [isSimulatingMotion, setIsSimulatingMotion] = useState(false);
  const [isRealGpsActive, setIsRealGpsActive] = useState(false);
  const [realGpsCoords, setRealGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [realGpsAccuracy, setRealGpsAccuracy] = useState<number | null>(null);
  const [realGpsSpeedKmH, setRealGpsSpeedKmH] = useState<number | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string>('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState<string>('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showInAppCallModal, setShowInAppCallModal] = useState(false);
  const [callTarget, setCallTarget] = useState<'client' | 'emergency'>('client');
  const [showLiveTrackingModal, setShowLiveTrackingModal] = useState(false);
  const [showRouteOptimizerModal, setShowRouteOptimizerModal] = useState(false);
  const [showMidnightDigestModal, setShowMidnightDigestModal] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [mapMode, setMapMode] = useState<'maplibre' | 'google_maps' | 'vector_radar'>('maplibre');
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);

  useEffect(() => {
    if (triggerNewDeliveryModal && triggerNewDeliveryModal > 0) {
      setShowNewDeliveryModal(true);
    }
  }, [triggerNewDeliveryModal]);

  // New Delivery Form State
  const [newClientPseudo, setNewClientPseudo] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('+229 ');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('+229 ');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newPickupAddress, setNewPickupAddress] = useState('');
  const [newPickupCity, setNewPickupCity] = useState('Cotonou');
  const [newDropoffAddress, setNewDropoffAddress] = useState('');
  const [newDropoffCity, setNewDropoffCity] = useState('Cotonou');
  const [newPackageDesc, setNewPackageDesc] = useState('');
  const [newFee, setNewFee] = useState('1500');

  const selectedDelivery = deliveries.find((d) => d.id === selectedDeliveryId) || deliveries[0];

  // Simulation step timer
  const simulationRef = useRef<number | null>(null);
  // Real GPS Watcher ID
  const gpsWatchIdRef = useRef<number | null>(null);

  // Handle Real GPS Geolocation tracking from smartphone sensor
  const toggleRealGpsTracking = () => {
    if (isRealGpsActive) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      setIsRealGpsActive(false);
      setGpsStatusMessage('GPS Smartphone désactivé.');
      voiceService.speak('GPS direct smartphone désactivé.');
      return;
    }

    if (!navigator.geolocation) {
      alert("La géolocalisation GPS n'est pas supportée par votre navigateur.");
      return;
    }

    setIsSimulatingMotion(false); // Stop simulation if active
    setIsRealGpsActive(true);
    setGpsStatusMessage('Recherche des satellites GPS...');
    voiceService.speak('GPS Smartphone activé. Connexion satellite en cours.');

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        setRealGpsCoords({ lat: latitude, lng: longitude });
        setRealGpsAccuracy(Math.round(accuracy));
        setRealGpsSpeedKmH(speed ? Math.round(speed * 3.6) : 0);
        setGpsStatusMessage(`GPS Fixé • Précision ±${Math.round(accuracy)}m`);

        if (selectedDelivery && selectedDelivery.status !== 'delivered') {
          const targetLat = selectedDelivery.targetLat || 6.3622;
          const targetLng = selectedDelivery.targetLng || 2.3951;
          const distanceMeters = calculateHaversineDistanceMeters(latitude, longitude, targetLat, targetLng);

          let nextStatus = selectedDelivery.status;
          let isPrimaryAlertSent = selectedDelivery.isPrimaryAlertSent;
          let isRobotVoiceTriggered = selectedDelivery.isRobotVoiceTriggered;

          // 500m Trigger: Automated message dispatched to client
          if (distanceMeters <= 500 && distanceMeters > 300 && !isPrimaryAlertSent) {
            nextStatus = 'nearby_500m';
            isPrimaryAlertSent = true;
            voiceService.triggerProximityVibration('500m');
            voiceService.playAlertSound('primary_500m');
            voiceService.speak("Alerte Liencolis 500 mètres. Message automatique de proximité transmis au client.");
          }

          // 300m Trigger: Hands-free automatic call to client
          if (distanceMeters <= 300 && distanceMeters > 0 && !isRobotVoiceTriggered) {
            nextStatus = 'alert_300m';
            isRobotVoiceTriggered = true;
            voiceService.triggerProximityVibration('300m');
            voiceService.playAlertSound('warning_300m');
            setCallTarget('client');
            setShowInAppCallModal(true);
            voiceService.speak(
              "Attention ! Vous êtes à 300 mètres du point de livraison. Déclenchement automatique de l'appel vers votre client. Gardez vos mains sur le guidon.",
              'fr-FR'
            );
          }

          if (distanceMeters <= 25) {
            nextStatus = 'arrived';
          }

          const updated: Delivery = {
            ...selectedDelivery,
            driverLat: latitude,
            driverLng: longitude,
            distanceRemainingMeters: distanceMeters,
            status: nextStatus,
            isPrimaryAlertSent,
            isRobotVoiceTriggered,
            estimatedArrivalMinutes: Math.max(1, Math.ceil(distanceMeters / 300)),
          };

          onUpdateDelivery(updated);
        }
      },
      (err) => {
        console.warn('GPS watch error:', err);
        setGpsStatusMessage(`Erreur signal GPS (${err.message}). Veuillez autoriser la localisation.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  };

  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSimulatingMotion && selectedDelivery && selectedDelivery.status !== 'delivered') {
      simulationRef.current = window.setInterval(() => {
        if (!selectedDelivery) return;

        let nextDistance = Math.max(0, selectedDelivery.distanceRemainingMeters - 120);
        let nextStatus: DeliveryStatus = selectedDelivery.status;
        let isPrimaryAlertSent = selectedDelivery.isPrimaryAlertSent;
        let isRobotVoiceTriggered = selectedDelivery.isRobotVoiceTriggered;

        // 500m Trigger: Automated proximity message to client
        if (nextDistance <= 500 && nextDistance > 300 && !isPrimaryAlertSent) {
          nextStatus = 'nearby_500m';
          isPrimaryAlertSent = true;
          voiceService.triggerProximityVibration('500m');
          voiceService.playAlertSound('primary_500m');
          voiceService.speak("Alerte Liencolis 500 mètres. Message automatique de proximité transmis au client.");
        }

        // 300m Trigger: Hands-Free auto call to client without touching phone
        if (nextDistance <= 300 && nextDistance > 0 && !isRobotVoiceTriggered) {
          nextStatus = 'alert_300m';
          isRobotVoiceTriggered = true;
          voiceService.triggerProximityVibration('300m');
          voiceService.playAlertSound('warning_300m');
          setCallTarget('client');
          setShowInAppCallModal(true);
          voiceService.speak(
            "Attention ! Vous êtes à 300 mètres du point de livraison. Déclenchement automatique de l'appel vers votre client. Gardez vos mains sur le guidon.",
            'fr-FR'
          );
        }

        // 0m Trigger: Arrived
        if (nextDistance === 0) {
          nextStatus = 'arrived';
          setIsSimulatingMotion(false);
          voiceService.triggerProximityVibration('arrived');
          voiceService.playAlertSound('warning_300m');
          voiceService.speak("Vous êtes arrivé au point de livraison prévu. Présentez le bouton de validation au client.");
        }

        const updated: Delivery = {
          ...selectedDelivery,
          distanceRemainingMeters: nextDistance,
          status: nextStatus,
          isPrimaryAlertSent,
          isRobotVoiceTriggered,
          estimatedArrivalMinutes: Math.ceil(nextDistance / 300),
        };

        onUpdateDelivery(updated);
      }, 1500);
    }

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [isSimulatingMotion, selectedDelivery]);

  // Handle voice command recognition
  const handleVoiceCommand = (transcript: string, action: string) => {
    setLastVoiceTranscript(`Commande détectée: "${transcript}"`);

    if (!selectedDelivery) return;

    if (action === 'call_client') {
      voiceService.speak(`Appel direct du client ${selectedDelivery.clientPseudo} en cours.`);
      window.location.href = `tel:${selectedDelivery.clientPhone.replace(/\s+/g, '')}`;
    } else if (action === 'call_emergency') {
      voiceService.speak(`Appel d'urgence vers le numéro de secours ${selectedDelivery.emergencyContactName || ''} en cours.`);
      window.location.href = `tel:${selectedDelivery.emergencyPhone.replace(/\s+/g, '')}`;
    } else if (action === 'whatsapp_client') {
      voiceService.speak(`Ouverture du canal WhatsApp client.`);
      const cleanPhone = selectedDelivery.clientPhone.replace(/[^\d]/g, '');
      const text = encodeURIComponent(`Bonjour ${selectedDelivery.clientPseudo}, votre livreur Liencolis est à proximité de votre adresse avec votre colis.`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    } else if (action === 'report_incident') {
      voiceService.speak(`Incident enregistré. Veuillez rester prudent. Assistance commerciale avertie.`);
    } else if (action === 'confirm_delivered') {
      setShowRatingModal(true);
    }
  };

  const startHandsFreeListening = () => {
    setIsVoiceListening(true);
    const success = voiceService.startVoiceCommandListener(
      (transcript, action) => handleVoiceCommand(transcript, action),
      (err) => {
        console.warn('Voice recognition error:', err);
        setIsVoiceListening(false);
      }
    );
    if (!success) {
      setIsVoiceListening(false);
    }
  };

  const stopHandsFreeListening = () => {
    voiceService.stopVoiceCommandListener();
    setIsVoiceListening(false);
  };

  const isDriver = currentUser?.role === 'driver';
  const isMuted = isDriver && storageService.isDriverMuted(currentUser);

  // Automated 00h00 Midnight Delivery Digest Background Runner
  // Dispatches the daily summary automatically every night at 00:00 without requiring the driver to touch their phone
  useEffect(() => {
    const checkMidnightAutoDispatch = async () => {
      try {
        const midnightSettings = storageService.getMidnightSettings();
        if (!midnightSettings.enabled) return;

        const now = new Date();
        const beninTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Porto_Novo' }));
        const hours = beninTime.getHours();
        const minutes = beninTime.getMinutes();
        const todayStr = beninTime.toISOString().split('T')[0];

        const lastDispatched = localStorage.getItem('liencolis_midnight_auto_dispatched_day');

        // Trigger if midnight (00h00) is reached or first open
        if (hours === 0 && minutes === 0 && lastDispatched !== todayStr) {
          localStorage.setItem('liencolis_midnight_auto_dispatched_day', todayStr);

          const completedCount = deliveries.filter((d) => d.status === 'delivered').length;
          const turnover = deliveries.filter((d) => d.status === 'delivered').reduce((s, d) => s + (d.deliveryFee || 0), 0);
          const comm = deliveries.filter((d) => d.status === 'delivered').reduce((s, d) => s + (d.commissionAmount || 0), 0);
          const net = turnover - comm;

          await fetch('/api/admin/dispatch-midnight-digest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverName: currentUser?.name || 'Livreur Partenaire',
              driverEmail: currentUser?.email || midnightSettings.email,
              driverPhone: currentUser?.phone || midnightSettings.phone,
              channel: midnightSettings.channel,
              date: todayStr,
              deliveries,
              turnoverFcfa: turnover,
              netEarningsFcfa: net,
            }),
          });

          storageService.addMidnightDispatchLog({
            date: todayStr,
            totalDeliveries: deliveries.length,
            completedCount,
            netEarningsFcfa: net,
            channel: midnightSettings.channel,
            recipient: `${currentUser?.phone || midnightSettings.phone} / ${currentUser?.email || midnightSettings.email}`,
            status: 'success',
          });

          setGpsStatusMessage('🌙 Bilan journalier de 00h00 expédié automatiquement à votre WhatsApp / E-mail !');
          setTimeout(() => setGpsStatusMessage(''), 8000);
        }
      } catch (e) {
        console.warn('Midnight auto-dispatcher error:', e);
      }
    };

    const interval = setInterval(checkMidnightAutoDispatch, 30000);
    checkMidnightAutoDispatch();
    return () => clearInterval(interval);
  }, [deliveries, currentUser]);

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMuted) {
      alert(
        `🔒 Action impossible : Votre compte est en sourdine car votre solde prépayé est de ${currentUser?.driverWallet?.balance ?? 0} FCFA (inférieur au seuil de 50 FCFA).\n\nVeuillez recharger votre portefeuille (à partir de 250 FCFA) pour démarrer une nouvelle livraison.`
      );
      return;
    }

    if (!newClientPseudo || !newClientPhone || !newEmergencyPhone || !newDropoffAddress) {
      alert('Veuillez remplir tous les champs obligatoires (incluant le Numéro de Secours).');
      return;
    }

    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newDel: Delivery = {
      id: `del_${Date.now()}`,
      trackingCode: `LC-BJ-${Math.floor(1000 + Math.random() * 9000)}`,
      clientPseudo: newClientPseudo,
      clientPhone: newClientPhone,
      emergencyPhone: newEmergencyPhone,
      emergencyContactName: newEmergencyName || 'Personne de confiance',
      pickupAddress: newPickupAddress || 'Boutique Cotonou',
      pickupCity: newPickupCity,
      dropoffAddress: newDropoffAddress,
      dropoffCity: newDropoffCity,
      packageDescription: newPackageDesc || 'Colis standard',
      deliveryFee: parseInt(newFee) || 1500,
      status: 'in_transit',
      driverId: currentUser?.id || 'usr_driver_01',
      driverName: currentUser?.name || 'Germain Mensah',
      driverPhone: currentUser?.phone || '+229 01 69 81 46 31',
      driverLat: 6.3703,
      driverLng: 2.4183,
      targetLat: 6.3622,
      targetLng: 2.3951,
      distanceRemainingMeters: 1400,
      estimatedArrivalMinutes: 6,
      securityPin: randomPin,
      isPrimaryAlertSent: false,
      isRobotVoiceTriggered: false,
      createdAt: new Date().toISOString(),
    };

    onAddDelivery(newDel);
    setSelectedDeliveryId(newDel.id);
    setShowNewDeliveryModal(false);
    voiceService.speak("Nouvelle livraison enregistrée. GPS et itinéraire activés. Alerte de sécurité mains-libres prête.");
  };

  const handleApplyOptimizedOrder = (reorderedDeliveryIds: string[]) => {
    if (!reorderedDeliveryIds || reorderedDeliveryIds.length === 0) return;

    const reorderedList: Delivery[] = [];
    reorderedDeliveryIds.forEach((id) => {
      const match = deliveries.find((d) => d.id === id);
      if (match) reorderedList.push(match);
    });

    deliveries.forEach((d) => {
      if (!reorderedDeliveryIds.includes(d.id)) {
        reorderedList.push(d);
      }
    });

    if (onReorderDeliveries) {
      onReorderDeliveries(reorderedList);
    }
    if (reorderedList.length > 0) {
      setSelectedDeliveryId(reorderedList[0].id);
    }

    voiceService.speak(
      "Tournée optimisée via Google Maps appliquée avec succès. Le premier arrêt de livraison est sélectionné."
    );
  };

  const handleValidateDelivery = () => {
    if (!selectedDelivery) return;

    if (pinInput && pinInput !== selectedDelivery.securityPin) {
      setPinError(true);
      return;
    }

    const driverPlan = currentUser?.pricingPlan || currentUser?.driverWallet?.pricingPlan || 'commission';
    const commCalc = calculateDeliveryCommission(
      selectedDelivery.deliveryFee,
      selectedDelivery.isFromAd ?? true,
      driverPlan
    );

    const updated: Delivery = {
      ...selectedDelivery,
      status: 'delivered',
      rating: ratingScore,
      reviewComment: reviewComment || 'Colis bien réceptionné en main propre.',
      deliveredAt: new Date().toISOString(),
      commissionAmount: commCalc.commissionAmount,
      commissionRate: commCalc.ratePercent,
      netDriverPayout: commCalc.netDriverPayout,
    };

    // Debit commission if driver is on commission plan and delivery is from ad
    if (driverPlan === 'commission' && commCalc.commissionAmount > 0) {
      const debitRes = storageService.debitCommission(updated);
      if (debitRes) {
        notificationService.sendPushNotification({
          type: 'system_alert',
          title: `💰 COMMISSION DÉBITÉE (${commCalc.ratePercent}%)`,
          body: `Course #${selectedDelivery.trackingCode} : ${commCalc.commissionAmount.toLocaleString()} FCFA prélevés. Nouveau solde : ${debitRes.updatedUser.driverWallet?.balance.toLocaleString()} FCFA.`,
        });
      }
    }

    // Escrow unlock notification
    notificationService.sendPushNotification({
      type: 'aid_approved',
      title: '🔓 SÉQUESTRE LEVÉ : RETRAITS DÉBLOQUÉS',
      body: `Colis #${selectedDelivery.trackingCode} validé par le client avec succès ! Votre accès au retrait et retour de dépôt est réactivé.`,
    });

    onUpdateDelivery(updated);
    setShowRatingModal(false);
    setPinInput('');
    setPinError(false);
    voiceService.playAlertSound('delivered');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const voiceMsg = commCalc.commissionAmount > 0
      ? `Félicitations ! Livraison confirmée avec succès par le client. Commission de ${commCalc.commissionAmount} Francs CFA prélevée, et votre accès au retrait est à nouveau disponible.`
      : "Félicitations ! Livraison confirmée avec succès par le client. Vos fonds et accès aux retraits sont à nouveau disponibles.";
    voiceService.speak(voiceMsg);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Alert / Hands-Free Voice Control Status */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Technologie GPS & Sécurité Mains-Libres Liencolis</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GUIDAGE VOCAL MAINS-LIBRES
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                VIBREUR HAPTIQUE 300M/500M
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Vibrations haptiques distinctes + alerte sonore 500m & alerte vocale automatique 300m : restez alerté même en conduite moto guidon/poche.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Haptic Vibration Test Button */}
          <button
            onClick={() => {
              const triggered = voiceService.triggerProximityVibration('300m');
              if (triggered) {
                voiceService.playAlertSound('warning_300m');
                setGpsStatusMessage('📳 Vibration Haptique 300m activée sur votre téléphone !');
                setTimeout(() => setGpsStatusMessage(''), 3000);
              } else {
                alert("Le vibreur n'est pas pris en charge par ce navigateur ou nécessite un appareil mobile.");
              }
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-[1.02]"
            id="test-haptic-vibration-btn"
            title="Tester le vibreur du téléphone pour l'alerte 300m en conduite"
          >
            <Smartphone className="w-4 h-4 text-amber-200 animate-bounce" />
            <span>Tester Vibreur 300m</span>
          </button>


          {/* Midnight Daily Digest Button (00h00) */}
          <button
            type="button"
            onClick={() => setShowMidnightDigestModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 hover:from-purple-800 hover:to-indigo-800 text-amber-300 border border-purple-500/40 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-[1.02]"
            id="open-midnight-digest-btn"
            title="Consulter ou programmer l'envoi du récapitulatif de toutes les courses à 00h00"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Bilan Minuit (00h00)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-[10px] font-mono text-amber-300">
              SMS/Mail
            </span>
          </button>

          {/* Route Optimization Google Maps Button */}
          <button
            onClick={() => setShowRouteOptimizerModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-[1.02]"
            id="open-route-optimizer-btn"
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>Optimiser Tournée Multi-Arrêts</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-950/80 text-[10px] font-mono border border-blue-400/40 text-blue-200">
              Google Maps
            </span>
          </button>

          {/* Hands-Free Voice Guidance Switch */}
          <button
            onClick={() => {
              if (isVoiceListening) {
                stopHandsFreeListening();
              } else {
                startHandsFreeListening();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all ${
              isVoiceListening
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            id="hands-free-toggle-btn"
          >
            {isVoiceListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>{isVoiceListening ? 'Micro Oreillette Actif (Parlez)' : 'Activer Commande Vocale'}</span>
          </button>

          <button
            onClick={() => setShowNewDeliveryModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer Livraison</span>
          </button>
        </div>
      </div>

      {/* SOURDINE INACTIVE ACCOUNT BANNER FOR DRIVERS (< 50 FCFA) */}
      {isMuted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-500/70 text-xs shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-red-300 flex items-center gap-2">
                <span>COMPTE EN SOURDINE (INACTIF - SOLDE &lt; 50 FCFA)</span>
              </h4>
              <p className="text-[11.5px] text-red-200">
                Votre solde prépayé est actuellement de <strong>{currentUser?.driverWallet?.balance ?? 0} FCFA</strong>. L'enregistrement et la réception de nouvelles livraisons sont temporairement suspendus.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenPayment ? onOpenPayment('wallet_deposit_1200') : onOpenRules()}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Recharger (Dès 250 F)</span>
          </button>
        </div>
      )}

      {/* Voice Transcript Toast */}
      {lastVoiceTranscript && (
        <div className="bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-400" />
            <span>{lastVoiceTranscript}</span>
          </div>
          <button onClick={() => setLastVoiceTranscript('')} className="text-amber-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Deliveries Queue Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setShowRouteOptimizerModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 shadow-sm shrink-0 transition-all hover:scale-[1.02]"
          title="Optimiser l'ordre de passage avec Google Maps API"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>Calculer Ordre Optimal ({deliveries.length} arrêts)</span>
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mx-1">
          Mes Courses :
        </span>
        {deliveries.map((del) => {
          const isSelected = del.id === selectedDelivery?.id;
          const statusColors: Record<DeliveryStatus, string> = {
            pending: 'bg-slate-700 text-slate-200 border-slate-600',
            in_transit: 'bg-blue-600 text-white border-blue-400',
            nearby_500m: 'bg-amber-500 text-slate-950 border-amber-300 font-bold',
            alert_300m: 'bg-orange-600 text-white border-orange-400 animate-pulse font-bold',
            arrived: 'bg-purple-600 text-white border-purple-400 font-bold',
            delivered: 'bg-emerald-600 text-white border-emerald-400',
            cancelled: 'bg-red-600 text-white border-red-400',
          };

          return (
            <button
              key={del.id}
              onClick={() => setSelectedDeliveryId(del.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                isSelected
                  ? 'ring-2 ring-amber-400 shadow-lg scale-[1.02] ' + statusColors[del.status]
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{del.trackingCode}</span>
              <span className="opacity-80">({del.clientPseudo})</span>
              {del.status === 'in_transit' && (
                <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded font-mono">
                  {del.distanceRemainingMeters}m
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDelivery ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map & Interactive Route Navigation View (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 overflow-hidden shadow-2xl">
              {/* TOP MASTER MAP TOOLBAR - ALWAYS VISIBLE, SHARP & UNCLUTTERED */}
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                {/* Destination and Security Anti-Theft Pin */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                    <span className="font-extrabold text-white">{selectedDelivery.dropoffCity}</span>
                    <span className="text-slate-400"> • Vers {selectedDelivery.dropoffAddress}</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300">Code PIN :</span>
                    <span className="font-mono font-bold text-amber-400">#{selectedDelivery.securityPin}</span>
                  </div>
                </div>

                {/* Map Mode Buttons ("OpenStreetMap", "Google Maps", "Simulation Radar") + ETA + Smartphone GPS */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mode Toggles */}
                  <div className="bg-slate-900 border border-slate-700 p-1 rounded-xl flex items-center gap-1 shadow-md">
                    <button
                      type="button"
                      onClick={() => setMapMode('maplibre')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                        mapMode === 'maplibre'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      id="toggle-mode-maplibre"
                      title="Carte MapLibre GL WebGL (Rapide, Fluide & Gratuite)"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                      <span>MapLibre GL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMapMode('google_maps')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                        mapMode === 'google_maps'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      id="toggle-mode-google-maps"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>Google Maps</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMapMode('vector_radar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                        mapMode === 'vector_radar'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      id="toggle-mode-vector-radar"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-300" />
                      <span>Radar Solo</span>
                    </button>
                  </div>

                  {/* ETA Badge */}
                  <div className="bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs shadow-md flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-950" />
                    <span>~ {selectedDelivery.estimatedArrivalMinutes} min</span>
                    <span className="text-[10px] opacity-80 font-mono">({selectedDelivery.distanceRemainingMeters}m)</span>
                  </div>

                  {/* GPS Smartphone Activator Button */}
                  <button
                    onClick={toggleRealGpsTracking}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all ${
                      isRealGpsActive
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                    title="Activer la géolocalisation GPS en direct de votre smartphone"
                    id="map-toggle-real-gps-btn"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>{isRealGpsActive ? '🛰️ GPS Smartphone Actif' : 'Activer GPS Smartphone'}</span>
                  </button>
                </div>
              </div>

              {/* Conditional Display: MapLibre GL, Google Maps, or Vector Simulation */}
              {mapMode === 'maplibre' ? (
                <div className="w-full h-[460px] sm:h-[540px] lg:h-[620px] relative">
                  <MapLibreView
                    deliveries={deliveries}
                    selectedDeliveryId={selectedDelivery.id}
                    onSelectDelivery={(id) => setSelectedDeliveryId(id)}
                    userCoords={realGpsCoords}
                    className="w-full h-full"
                  />
                </div>
              ) : mapMode === 'google_maps' ? (
                <div className="w-full h-[460px] sm:h-[540px] lg:h-[620px] relative">
                  <GoogleMapView
                    deliveries={deliveries}
                    selectedDeliveryId={selectedDelivery.id}
                    onSelectDelivery={(id) => setSelectedDeliveryId(id)}
                    userCoords={realGpsCoords}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                /* Vector Interactive Map Simulation Stage */
                <div className="w-full h-[460px] sm:h-[540px] lg:h-[620px] bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {/* SVG Detailed City Grid Map (Cotonou / Calavi style) */}
                <svg viewBox="0 0 600 400" className="w-full h-full object-cover">
                  {/* Water / Lagoon background */}
                  <rect width="600" height="400" fill="#091422" />
                  <path d="M 0 320 Q 200 280 400 350 T 600 310 L 600 400 L 0 400 Z" fill="#0C2340" />
                  <text x="520" y="380" fill="#38BDF8" opacity="0.4" fontSize="10" fontWeight="bold">Océan Atlantique</text>
                  <text x="30" y="380" fill="#38BDF8" opacity="0.4" fontSize="10" fontWeight="bold">Plage de Fidjrossè</text>

                  {/* Road Network Grid */}
                  <g stroke="#1E293B" strokeWidth="12" strokeLinecap="round">
                    <line x1="40" y1="40" x2="560" y2="40" />
                    <line x1="40" y1="120" x2="560" y2="120" />
                    <line x1="40" y1="200" x2="560" y2="200" />
                    <line x1="40" y1="280" x2="560" y2="280" />
                    <line x1="100" y1="20" x2="100" y2="300" />
                    <line x1="220" y1="20" x2="220" y2="300" />
                    <line x1="360" y1="20" x2="360" y2="300" />
                    <line x1="480" y1="20" x2="480" y2="300" />
                  </g>

                  {/* City Landmarks */}
                  <rect x="70" y="70" width="80" height="40" rx="6" fill="#111C2E" stroke="#1E293B" />
                  <text x="110" y="94" fill="#94A3B8" fontSize="8" textAnchor="middle">Étoile Rouge</text>

                  <rect x="230" y="50" width="100" height="50" rx="6" fill="#111C2E" stroke="#1E293B" />
                  <text x="280" y="80" fill="#94A3B8" fontSize="8" textAnchor="middle">Marché Dantokpa</text>

                  <rect x="380" y="140" width="80" height="40" rx="6" fill="#111C2E" stroke="#1E293B" />
                  <text x="420" y="164" fill="#94A3B8" fontSize="8" textAnchor="middle">Haie Vive</text>

                  {/* Calculated Active Delivery Route Highlight */}
                  <path
                    d="M 120 120 L 220 120 L 220 200 L 460 200 L 460 260"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.85"
                  />
                  <path
                    d="M 120 120 L 220 120 L 220 200 L 460 200 L 460 260"
                    stroke="#FDE047"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    fill="none"
                    className="animate-pulse"
                  />

                  {/* 500m Safety Perimeter Circle */}
                  <circle cx="460" cy="260" r="100" fill="#F59E0B" opacity="0.1" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth="1.5" />
                  {/* 300m Voice Alert Circle */}
                  <circle cx="460" cy="260" r="60" fill="#EF4444" opacity="0.15" stroke="#EF4444" strokeDasharray="3 3" strokeWidth="2" />

                  {/* Origin Pickup Pin */}
                  <g transform="translate(120, 120)">
                    <circle cx="0" cy="0" r="8" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="0" y="-12" fill="#93C5FD" fontSize="9" fontWeight="bold" textAnchor="middle">Départ: {selectedDelivery.pickupAddress}</text>
                  </g>

                  {/* Target Dropoff Pin */}
                  <g transform="translate(460, 260)">
                    <circle cx="0" cy="0" r="18" fill="#EF4444" opacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="10" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="0" y="-14" fill="#FCA5A5" fontSize="10" fontWeight="bold" textAnchor="middle">Arrivée: {selectedDelivery.clientPseudo}</text>
                    <text x="0" y="22" fill="#FDE047" fontSize="8" fontWeight="bold" textAnchor="middle">Numéro Secours Activé</text>
                  </g>

                  {/* Moving Driver Motorcycle Position with Framer Motion Animation */}
                  {(() => {
                    const { x: curX, y: curY, angle: headingAngle } = getVehiclePositionAndHeading(
                      selectedDelivery.distanceRemainingMeters
                    );

                    return (
                      <motion.g
                        animate={{
                          x: curX,
                          y: curY,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 70,
                          damping: 18,
                          mass: 0.8,
                        }}
                      >
                        {/* Dynamic Expanding Radar Pulse */}
                        <motion.circle
                          cx={0}
                          cy={0}
                          r={24}
                          fill="#10B981"
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: [0.8, 1.8, 2.4], opacity: [0.5, 0.2, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                        />

                        {/* Outer Halo ring */}
                        <motion.circle
                          cx={0}
                          cy={0}
                          r={14}
                          fill="#0B192C"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          animate={{
                            stroke:
                              selectedDelivery.status === 'alert_300m'
                                ? ['#EF4444', '#F59E0B', '#EF4444']
                                : '#10B981',
                            scale: isSimulatingMotion || isRealGpsActive ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />

                        {/* Directional Motorcycle Body Group with Heading Rotation & Engine Bounce */}
                        <motion.g
                          animate={{
                            rotate: headingAngle,
                            scale: isSimulatingMotion || isRealGpsActive ? [1, 1.06, 1] : 1,
                          }}
                          transition={{
                            rotate: { type: 'spring', stiffness: 100, damping: 14 },
                            scale: { repeat: Infinity, duration: 0.7, ease: 'easeInOut' },
                          }}
                        >
                          {/* Headlight Cone Beam */}
                          <path
                            d="M 6 0 L 38 -14 L 38 14 Z"
                            fill="#FDE047"
                            opacity={isSimulatingMotion || isRealGpsActive ? 0.45 : 0.2}
                          />

                          {/* Motorcycle Circle Icon */}
                          <circle cx={0} cy={0} r={11} fill="#0B192C" stroke="#34D399" strokeWidth={2} />
                          <text x={0} y={4} fontSize={10} textAnchor="middle" fill="#FFFFFF">
                            🛵
                          </text>
                        </motion.g>

                        {/* Dynamic Speed & Driver Badge Tag floating above */}
                        <motion.g
                          animate={{ y: [0, -2, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          transform="translate(0, -22)"
                        >
                          <rect
                            x={-50}
                            y={-12}
                            width={100}
                            height={18}
                            rx={9}
                            fill="#0F172A"
                            stroke={
                              selectedDelivery.status === 'alert_300m'
                                ? '#EF4444'
                                : isRealGpsActive
                                ? '#10B981'
                                : '#38BDF8'
                            }
                            strokeWidth={1.5}
                            opacity={0.95}
                          />
                          <text
                            x={0}
                            y={0}
                            fill="#F8FAFC"
                            fontSize={8}
                            fontWeight="black"
                            textAnchor="middle"
                          >
                            {selectedDelivery.driverName || 'Livreur'} {isSimulatingMotion ? '⚡' : ''}
                          </text>
                        </motion.g>
                      </motion.g>
                    );
                  })()}
                </svg>

                {/* Status Float in Bottom of Map */}
                <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
                  <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200">Anti-Vol Scellé Code : </span>
                    <span className="font-mono font-bold text-amber-400 tracking-wider">#{selectedDelivery.securityPin}</span>
                  </div>

                  {/* Simulation Play / Pause / Reset button & Real GPS Button */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={toggleRealGpsTracking}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all ${
                        isRealGpsActive
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title="Activer le GPS réel de votre smartphone"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span>{isRealGpsActive ? '🛰️ GPS Smartphone Actif' : 'Activer GPS Smartphone'}</span>
                    </button>

                    <button
                      onClick={() => setIsSimulatingMotion(!isSimulatingMotion)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 ${
                        isSimulatingMotion ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isSimulatingMotion ? 'Pause Trajet' : 'Simuler Avance'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const reset: Delivery = {
                          ...selectedDelivery,
                          distanceRemainingMeters: 1200,
                          status: 'in_transit',
                          isPrimaryAlertSent: false,
                          isRobotVoiceTriggered: false,
                        };
                        onUpdateDelivery(reset);
                        setIsSimulatingMotion(false);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Réinitialiser la simulation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Real GPS Info Bar if active */}
              {isRealGpsActive && (
                <div className="px-4 py-2 bg-emerald-950/70 border-t border-emerald-500/40 text-emerald-300 text-[11px] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="font-bold">{gpsStatusMessage || 'Signal GPS Smartphone en direct'}</span>
                  </div>
                  {realGpsCoords && (
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span>Lat: {realGpsCoords.lat.toFixed(4)}°</span>
                      <span>Lng: {realGpsCoords.lng.toFixed(4)}°</span>
                      {realGpsAccuracy !== null && <span>Précision: ±{realGpsAccuracy}m</span>}
                      {realGpsSpeedKmH !== null && (
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          <span>{realGpsSpeedKmH} km/h</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar for Distance */}
              <div className="p-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedDelivery.status === 'alert_300m' ? 'bg-red-500 animate-ping' :
                    selectedDelivery.status === 'nearby_500m' ? 'bg-amber-400 animate-pulse' :
                    selectedDelivery.status === 'arrived' ? 'bg-purple-400' :
                    selectedDelivery.status === 'delivered' ? 'bg-emerald-400' : 'bg-blue-400'
                  }`}></span>
                  <span className="font-bold text-white capitalize">
                    {selectedDelivery.status === 'alert_300m' ? '🚨 Alerte Vocale 300m Déclenchée' :
                     selectedDelivery.status === 'nearby_500m' ? '⚠️ Alerte Primaire 500m Transmise' :
                     selectedDelivery.status === 'arrived' ? '📍 Arrivé au Point de Livraison' :
                     selectedDelivery.status === 'delivered' ? '✅ Colis Réceptionné & Noté' : 'Livraison en cours'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Reste :</span>
                  <span className="font-mono font-bold text-amber-400">{selectedDelivery.distanceRemainingMeters} mètres</span>
                </div>
              </div>

              {/* Direct External Navigation GPS & In-App Call Quick Bar */}
              <div className="p-3 bg-slate-900 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Applications GPS Externes :</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedDelivery.dropoffAddress}, ${selectedDelivery.dropoffCity}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-blue-200" />
                  </a>

                  <a
                    href={`https://waze.com/ul?q=${encodeURIComponent(`${selectedDelivery.dropoffAddress} ${selectedDelivery.dropoffCity}`)}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Waze</span>
                    <ExternalLink className="w-3 h-3 text-cyan-200" />
                  </a>

                  <button
                    onClick={() => {
                      setCallTarget('client');
                      setShowInAppCallModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Écran d'Appel Intégré</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Guidance Instructions Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-white">Guide de Sécurité Mains-Libres (Écouteurs / Oreillettes)</h4>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">100% Mains Libres</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Lorsque la sonnerie retentit à <strong>300m</strong>, dites simplement à voix haute :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                  <p className="font-bold text-amber-300">"Appelle le client"</p>
                  <p className="text-[10px] text-slate-400">Lance l'appel téléphonique direct</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                  <p className="font-bold text-emerald-300">"Appelle numéro secours"</p>
                  <p className="text-[10px] text-slate-400">Joint le proche de confiance</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                  <p className="font-bold text-blue-300">"WhatsApp"</p>
                  <p className="text-[10px] text-slate-400">Envoie le message de position</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Delivery Details & Client Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Delivery Card */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Code Suivi</span>
                  <p className="text-base font-extrabold text-white">{selectedDelivery.trackingCode}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400">Tarif Course</span>
                  <p className="text-base font-extrabold text-amber-400">{selectedDelivery.deliveryFee} FCFA</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">POINT DE DÉPART (Récupération)</p>
                    <p className="font-bold text-slate-100">{selectedDelivery.pickupAddress}</p>
                    <p className="text-slate-400 text-[11px]">{selectedDelivery.pickupCity}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">POINT D'ARRIVÉE (Destination Client)</p>
                    <p className="font-bold text-slate-100">{selectedDelivery.dropoffAddress}</p>
                    <p className="text-slate-400 text-[11px]">{selectedDelivery.dropoffCity}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                  <span className="text-[10px] text-slate-400 block font-semibold">DESCRIPTION DU COLIS</span>
                  <span className="font-medium">{selectedDelivery.packageDescription}</span>
                </div>
              </div>

              {/* Client Direct Contact & In-App Call Screen Buttons */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Client : {selectedDelivery.clientPseudo}</span>
                  <span className="font-mono text-slate-300">{selectedDelivery.clientPhone}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCallTarget('client');
                      setShowInAppCallModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appel Mains-Libres</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => notificationService.openWhatsAppAlert(selectedDelivery, currentUser?.name)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-400 border border-emerald-500/50 font-bold text-xs shadow transition-colors"
                    title="Alerter le client via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Alerter WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => notificationService.openSmsAlert(selectedDelivery, currentUser?.name)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 font-bold text-xs shadow transition-colors"
                    title="Envoyer un SMS au client"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Alerter par SMS</span>
                  </button>
                </div>

                {/* Share Live Tracking Link Button */}
                <button
                  type="button"
                  onClick={() => setShowLiveTrackingModal(true)}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mt-1"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Partager le Lien de Suivi GPS & PIN au Client</span>
                </button>
              </div>

              {/* Emergency Secours Contact Card (Facultatif) */}
              {selectedDelivery.emergencyPhone && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-300">Numéro de Secours (Facultatif)</span>
                    </div>
                    <span className="text-[10px] text-amber-200/80">{selectedDelivery.emergencyContactName || 'Personne de confiance'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Proche à contacter si le destinataire ne répond pas.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCallTarget('emergency');
                      setShowInAppCallModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors w-full"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Lancer Appel Secours ({selectedDelivery.emergencyPhone})</span>
                  </button>
                </div>
              )}

              {/* Client Confirmation Button (on driver's phone) */}
              <div className="pt-2">
                {selectedDelivery.status === 'delivered' ? (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                      <CheckCircle className="w-5 h-5" />
                      <span>Colis Reçu & Validé par le Client</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-amber-400">
                      {[...Array(selectedDelivery.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    {selectedDelivery.reviewComment && (
                      <p className="text-xs text-slate-300 italic">"{selectedDelivery.reviewComment}"</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="client-validate-delivery-btn"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>CLIENT : APPUYER POUR VALIDER COLIS REÇU</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Client Validation & Rating Modal */}
      {showRatingModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Validation Réception du Colis</h3>
              <p className="text-xs text-slate-300">
                Bonjour {selectedDelivery.clientPseudo}, veuillez confirmer la réception et attribuer une note à votre livreur.
              </p>
            </div>

            {/* Anti-Theft Security PIN Check */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Code Secret Anti-Vol (indiqué sur votre commande) :
              </label>
              <input
                type="text"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder={`Ex: ${selectedDelivery.securityPin}`}
                className="w-full px-3 py-2 rounded-xl text-center font-mono text-base font-bold bg-slate-800 border border-slate-700 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {pinError && (
                <p className="text-[11px] text-red-400 font-medium text-center">
                  Code incorrect. Le code de ce colis est #{selectedDelivery.securityPin}.
                </p>
              )}
            </div>

            {/* Rating Stars */}
            <div className="space-y-2 text-center pt-2">
              <p className="text-xs font-semibold text-slate-300">Notez la prestation du livreur :</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= ratingScore ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Commission and Earnings Summary for Delivery */}
            {selectedDelivery && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Montant de la Course :</span>
                  <span className="font-mono font-bold text-amber-400">
                    {selectedDelivery.deliveryFee.toLocaleString()} FCFA
                  </span>
                </div>
                {(() => {
                  const plan = currentUser?.pricingPlan || currentUser?.driverWallet?.pricingPlan || 'commission';
                  const calc = calculateDeliveryCommission(
                    selectedDelivery.deliveryFee,
                    selectedDelivery.isFromAd ?? true,
                    plan
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Formule Livreur :</span>
                        <span className="font-semibold text-slate-200 capitalize">
                          {plan === 'subscription' ? 'Abonnement (0% commission)' : `Commission (${calc.ratePercent}%)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>Commission Liencolis :</span>
                        <span className="font-mono font-bold text-amber-300">
                          {calc.commissionAmount > 0 ? `-${calc.commissionAmount.toLocaleString()} FCFA` : '0 FCFA (Exempté)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-1 border-t border-slate-800">
                        <span>Gain Net Livreur :</span>
                        <span className="font-mono">{calc.netDriverPayout.toLocaleString()} FCFA</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Review Comment */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Votre commentaire (optionnel) :</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Ex: Livreur très ponctuel, poli et respectueux du code..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleValidateDelivery}
                className="py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg transition-colors"
              >
                Confirmer & Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Delivery Registration Modal */}
      {showNewDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Enregistrer une Nouvelle Livraison</h3>
              </div>
              <button onClick={() => setShowNewDeliveryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Pseudo / Nom Client *</label>
                  <input
                    type="text"
                    required
                    value={newClientPseudo}
                    onChange={(e) => setNewClientPseudo(e.target.value)}
                    placeholder="Ex: Mme Chimène"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">N° WhatsApp Client *</label>
                  <input
                    type="text"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Emergency Contact (Facultatif) */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Numéro de Secours (Facultatif - Personne de Confiance)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newEmergencyPhone}
                    onChange={(e) => setNewEmergencyPhone(e.target.value)}
                    placeholder="N° Secours facultatif (+229 ...)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    value={newEmergencyName}
                    onChange={(e) => setNewEmergencyName(e.target.value)}
                    placeholder="Lien (ex: Frère, Voisin)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Adresse de Ramassage</label>
                  <input
                    type="text"
                    value={newPickupAddress}
                    onChange={(e) => setNewPickupAddress(e.target.value)}
                    placeholder="Boutique Dantokpa"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ville de Départ (Bénin)</label>
                  <select
                    value={newPickupCity}
                    onChange={(e) => setNewPickupCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {BENIN_CITY_NAMES.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Adresse de Destination *</label>
                  <input
                    type="text"
                    required
                    value={newDropoffAddress}
                    onChange={(e) => setNewDropoffAddress(e.target.value)}
                    placeholder="Haie Vive, Rue 312"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ville d'Arrivée (Bénin)</label>
                  <select
                    value={newDropoffCity}
                    onChange={(e) => setNewDropoffCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {BENIN_CITY_NAMES.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Contenu du Colis</label>
                  <input
                    type="text"
                    value={newPackageDesc}
                    onChange={(e) => setNewPackageDesc(e.target.value)}
                    placeholder="Plats, vêtements, pièces..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Prix de la Course (FCFA)</label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg mt-2 transition-transform hover:scale-[1.01]"
              >
                Créer & Démarrer la Livraison
              </button>
            </form>
          </div>
        </div>
      )}

      {/* In-App Call Screen Modal (Triggered automatically at 300m or manually) */}
      {selectedDelivery && (
        <InAppCallScreen
          isOpen={showInAppCallModal}
          onClose={() => setShowInAppCallModal(false)}
          delivery={selectedDelivery}
          callTarget={callTarget}
          autoDial={true}
        />
      )}

      {/* Live Tracking and GPS Position Sharing Modal */}
      {selectedDelivery && (
        <LiveTrackingModal
          isOpen={showLiveTrackingModal}
          onClose={() => setShowLiveTrackingModal(false)}
          delivery={selectedDelivery}
        />
      )}

      {/* Multi-Stop Route Optimizer Modal (Google Maps Routes API) */}
      <RouteOptimizerModal
        isOpen={showRouteOptimizerModal}
        onClose={() => setShowRouteOptimizerModal(false)}
        deliveries={deliveries}
        currentDriverCoords={
          realGpsCoords ||
          (selectedDelivery
            ? { lat: selectedDelivery.driverLat, lng: selectedDelivery.driverLng }
            : undefined)
        }
        onApplyOptimizedOrder={handleApplyOptimizedOrder}
      />

      {/* Daily Midnight Delivery Summary Modal (00h00) */}
      <DailyDeliveryMidnightDigestModal
        isOpen={showMidnightDigestModal}
        onClose={() => setShowMidnightDigestModal(false)}
        currentUser={currentUser}
        deliveries={deliveries}
      />
    </div>
  );
};
