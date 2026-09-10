import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Phone,
  Shield,
  MapPin,
  User,
  Compass,
  Coins,
  X,
  Clipboard,
  CheckCircle2,
  RefreshCw,
  LocateFixed,
  Zap,
} from 'lucide-react';
import { Delivery, UserProfile } from '../types';
import { voiceService } from '../services/voiceService';

interface QuickDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isMuted?: boolean;
  onAddDelivery: (delivery: Delivery) => void;
  onOpenPayment?: (purpose?: any) => void;
}

const POPULAR_BENIN_DESTINATIONS = [
  'Haie Vive',
  'Akpakpa',
  'Fidjrossè',
  'Cadjehoun',
  'Menontin',
  'Agla',
  'Dantokpa',
  'Ganhi',
  'Godomey',
  'Calavi Kpota',
  'Tankpè',
  'Porto-Novo',
  'St Michel',
  'Kouhounou',
  'Zogbo',
  'Agontikon',
  'Arconville',
  'Ouidah',
  'Parakou',
  'Bohicon',
];

const DESTINATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Haie Vive': { lat: 6.3534, lng: 2.3921 },
  'Akpakpa': { lat: 6.3672, lng: 2.4514 },
  'Fidjrossè': { lat: 6.3601, lng: 2.3689 },
  'Cadjehoun': { lat: 6.3638, lng: 2.4045 },
  'Menontin': { lat: 6.3812, lng: 2.3904 },
  'Agla': { lat: 6.3889, lng: 2.3812 },
  'Dantokpa': { lat: 6.3725, lng: 2.4348 },
  'Ganhi': { lat: 6.3604, lng: 2.4312 },
  'Godomey': { lat: 6.3982, lng: 2.3411 },
  'Calavi Kpota': { lat: 6.4498, lng: 2.3551 },
  'Tankpè': { lat: 6.4312, lng: 2.3387 },
  'Porto-Novo': { lat: 6.4969, lng: 2.6289 },
  'St Michel': { lat: 6.3681, lng: 2.4215 },
  'Kouhounou': { lat: 6.3845, lng: 2.4011 },
  'Zogbo': { lat: 6.3831, lng: 2.3965 },
  'Agontikon': { lat: 6.3765, lng: 2.4089 },
  'Arconville': { lat: 6.4412, lng: 2.3489 },
  'Ouidah': { lat: 6.3631, lng: 2.0851 },
  'Parakou': { lat: 9.3371, lng: 2.6303 },
  'Bohicon': { lat: 7.1782, lng: 2.0667 },
};

const QUICK_PRICES = [500, 1000, 1500, 2000, 2500, 3000, 5000];

export const QuickDeliveryModal: React.FC<QuickDeliveryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isMuted = false,
  onAddDelivery,
  onOpenPayment,
}) => {
  // 1. Numéro du client
  const [clientPhone, setClientPhone] = useState('+229 ');

  // 2. Numéro de secours (facultatif)
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // 3. Coordonnées GPS
  const [gpsLat, setGpsLat] = useState<number>(6.3703);
  const [gpsLng, setGpsLng] = useState<number>(2.4183);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsStatusText, setGpsStatusText] = useState<string>('Coordonnées détectées automatiquement');

  // 4. Pseudo du client (facultatif)
  const [clientPseudo, setClientPseudo] = useState('');

  // 5. Quartier de destination
  const [dropoffAddress, setDropoffAddress] = useState('');

  // Tarif & Options
  const [deliveryFee, setDeliveryFee] = useState('1500');

  // Fetch Live GPS Coordinates on Modal Open
  const refreshGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatusText('Géolocalisation non disponible sur ce navigateur');
      return;
    }

    setIsLocating(true);
    setGpsStatusText('Recherche satellite GPS en cours...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy);

        setGpsLat(lat);
        setGpsLng(lng);
        setGpsAccuracy(acc);
        setIsLocating(false);
        setGpsStatusText(`Signal GPS Verrouillé (Précision ±${acc}m)`);
      },
      (err) => {
        console.warn('Geolocation warning/error:', err.message);
        setIsLocating(false);
        // Default to Cotonou center
        setGpsLat(6.3703);
        setGpsLng(2.4183);
        setGpsStatusText('Position par défaut : Cotonou Centre (6.3703° N, 2.4183° E)');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setClientPhone('+229 ');
      setEmergencyPhone('');
      setClientPseudo('');
      setDropoffAddress('');
      setDeliveryFee('1500');
      refreshGpsLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Quick Paste from Clipboard
  const handlePastePhone = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = text.trim();
          if (cleaned.startsWith('+229')) {
            setClientPhone(cleaned);
          } else if (cleaned.length >= 8) {
            setClientPhone(`+229 ${cleaned}`);
          } else {
            setClientPhone(cleaned);
          }
        }
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  };

  const handlePasteEmergencyPhone = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = text.trim();
          if (cleaned.startsWith('+229')) {
            setEmergencyPhone(cleaned);
          } else if (cleaned.length >= 8) {
            setEmergencyPhone(`+229 ${cleaned}`);
          } else {
            setEmergencyPhone(cleaned);
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isMuted) {
      alert(
        `🔒 Action impossible : Votre compte est en sourdine car votre solde prépayé est de ${
          currentUser?.driverWallet?.balance ?? 0
        } FCFA (inférieur à 50 FCFA).\n\nVeuillez recharger votre portefeuille pour enregistrer une course.`
      );
      if (onOpenPayment) {
        onOpenPayment('wallet_deposit_1200');
      }
      return;
    }

    const cleanDropoff = dropoffAddress.trim();
    if (!cleanDropoff) {
      alert('Veuillez indiquer le quartier de destination (ou cliquer sur l’un des quartiers suggérés).');
      return;
    }

    const cleanPhone = clientPhone.trim();
    if (!cleanPhone || cleanPhone === '+229' || cleanPhone.length < 8) {
      alert('Veuillez renseigner le Numéro de téléphone / WhatsApp du client.');
      return;
    }

    const finalClientPseudo = clientPseudo.trim() || `Client ${cleanDropoff}`;
    const finalEmergency = emergencyPhone.trim() || '+229 01 69 81 46 31';
    const finalFee = parseInt(deliveryFee) || 1500;

    // Target coords based on destination if available or calculated offset
    const matchedCoords = DESTINATION_COORDINATES[cleanDropoff] || {
      lat: gpsLat + 0.015,
      lng: gpsLng + 0.012,
    };

    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newDel: Delivery = {
      id: `del_${Date.now()}`,
      trackingCode: `LC-BJ-${Math.floor(1000 + Math.random() * 9000)}`,
      clientPseudo: finalClientPseudo,
      clientPhone: cleanPhone,
      emergencyPhone: finalEmergency,
      emergencyContactName: emergencyPhone.trim() ? 'Contact de Secours' : 'Personne de confiance',
      pickupAddress: 'Départ Position Chauffeur',
      pickupCity: 'Cotonou',
      dropoffAddress: cleanDropoff,
      dropoffCity: 'Cotonou',
      packageDescription: 'Course Express',
      deliveryFee: finalFee,
      status: 'in_transit',
      driverId: currentUser?.id || 'usr_driver_01',
      driverName: currentUser?.name || 'Germain Mensah',
      driverPhone: currentUser?.phone || '+229 01 69 81 46 31',
      driverLat: gpsLat,
      driverLng: gpsLng,
      targetLat: matchedCoords.lat,
      targetLng: matchedCoords.lng,
      distanceRemainingMeters: 1600,
      estimatedArrivalMinutes: 7,
      securityPin: randomPin,
      isPrimaryAlertSent: false,
      isRobotVoiceTriggered: false,
      createdAt: new Date().toISOString(),
    };

    onAddDelivery(newDel);
    onClose();
    voiceService.speak(
      `Course vers ${cleanDropoff} enregistrée avec succès. Coordonnées GPS verrouillées et suivi activé.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-6 relative overflow-hidden">
        
        {/* Top Gold-Amber Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Enregistrement de Course</span>
              </h3>
              <p className="text-[11px] text-slate-400">Formulaire épuré & direct pour le chauffeur</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            id="close-quick-delivery-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Structure: 1. Numéro client, 2. Numéro secours (facultatif), 3. Coordonnées GPS, 4. Pseudo (facultatif), 5. Quartier destination */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">

          {/* 1. NUMÉRO DU CLIENT OU WHATSAPP */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-black text-white text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Numéro du Client ou WhatsApp *</span>
              </label>
              <button
                type="button"
                onClick={handlePastePhone}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 cursor-pointer"
                title="Coller depuis le presse-papier"
              >
                <Clipboard className="w-3 h-3" />
                <span>Coller</span>
              </button>
            </div>
            <input
              type="tel"
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+229 97 00 00 00 (Appel ou WhatsApp)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              id="input-client-phone"
            />
          </div>

          {/* 2. NUMÉRO SECOURS FACULTATIF */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Numéro Secours <span className="text-slate-400 font-normal">(Facultatif)</span></span>
              </label>
              <button
                type="button"
                onClick={handlePasteEmergencyPhone}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                title="Coller le numéro"
              >
                <Clipboard className="w-3 h-3" />
                <span>Coller</span>
              </button>
            </div>
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+229 ... (personne de confiance si besoin)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400/80 text-white font-mono text-xs placeholder-slate-600 focus:outline-none"
              id="input-emergency-phone"
            />
          </div>

          {/* 3. COORDONNÉES GPS */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Coordonnées GPS</span>
              </div>
              <button
                type="button"
                onClick={refreshGpsLocation}
                disabled={isLocating}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black transition-all cursor-pointer"
              >
                {isLocating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <LocateFixed className="w-3 h-3" />
                )}
                <span>{isLocating ? 'Scan...' : 'Actualiser GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/90 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Latitude :</span>
                <span className="text-xs font-black text-cyan-300 font-mono">{gpsLat.toFixed(4)}° N</span>
              </div>
              <div className="bg-slate-900/90 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Longitude :</span>
                <span className="text-xs font-black text-cyan-300 font-mono">{gpsLng.toFixed(4)}° E</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{gpsStatusText}</span>
            </div>
          </div>

          {/* 4. PSEUDO FACULTATIF */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>4. Pseudo Client <span className="text-slate-400 font-normal">(Facultatif)</span></span>
            </label>
            <input
              type="text"
              value={clientPseudo}
              onChange={(e) => setClientPseudo(e.target.value)}
              placeholder="Ex: Mme Chimène (laisser vide si inconnu)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-slate-600 text-white text-xs placeholder-slate-600 focus:outline-none"
              id="input-client-pseudo"
            />
          </div>

          {/* 5. QUARTIER DE DESTINATION */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-white text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>5. Quartier de Destination *</span>
              </label>
              <span className="text-[10px] text-amber-400 font-bold">1 clic ou saisie</span>
            </div>

            <input
              type="text"
              required
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Ex: Haie Vive, Akpakpa, Fidjrossè, Cadjehoun..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-bold text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              id="input-dropoff-address"
            />

            {/* Quick 1-tap Neighborhood Badges */}
            <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-24 overflow-y-auto scrollbar-thin">
              {POPULAR_BENIN_DESTINATIONS.slice(0, 12).map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => setDropoffAddress(dest)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    dropoffAddress.toLowerCase() === dest.toLowerCase()
                      ? 'bg-amber-400 text-slate-950 font-black scale-105 shadow'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  📍 {dest}
                </button>
              ))}
            </div>
          </div>

          {/* PRIX DE LA COURSE (FCFA) */}
          <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-white text-xs flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prix de la Course :</span>
              </label>
              <span className="text-xs font-black text-emerald-400">
                {parseInt(deliveryFee || '0').toLocaleString()} FCFA
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {QUICK_PRICES.map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => setDeliveryFee(price.toString())}
                  className={`py-1.5 rounded-xl text-center text-xs font-black transition-all cursor-pointer ${
                    parseInt(deliveryFee) === price
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-md scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {price >= 1000 ? `${price / 1000}k` : `${price}`}F
                </button>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              id="btn-submit-quick-delivery"
            >
              <Navigation className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Valider & Lancer la Course ({parseInt(deliveryFee || '1500').toLocaleString()} FCFA)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
