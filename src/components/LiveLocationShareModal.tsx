import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Compass, 
  LocateFixed, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Radio,
  Sparkles
} from 'lucide-react';
import { LiveLocationData, UserProfile } from '../types';

interface LiveLocationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  selectedCityName: string;
  onShareLocation: (locationData: LiveLocationData, note: string) => void;
}

// Famous landmarks in Benin cities to assist quick selection if GPS is offline or denied
const BENIN_LANDMARKS_BY_CITY: Record<string, Array<{ name: string; lat: number; lng: number; area: string }>> = {
  cotonou: [
    { name: "Carrefour Vêdoko", lat: 6.3775, lng: 2.3912, area: "Vêdoko" },
    { name: "Place de l'Étoile Rouge", lat: 6.3756, lng: 2.4183, area: "Étoile Rouge" },
    { name: "Carrefour Saint-Michel", lat: 6.3653, lng: 2.4285, area: "Saint-Michel" },
    { name: "Ganhi - Quartier Commercial", lat: 6.3571, lng: 2.4344, area: "Ganhi" },
    { name: "Carrefour Agontinkon", lat: 6.3862, lng: 2.4045, area: "Agontinkon" },
    { name: "Carrefour PK3 Akpakpa", lat: 6.3685, lng: 2.4552, area: "Akpakpa" },
    { name: "Fidjrossè Calvaire / Plage", lat: 6.3612, lng: 2.3682, area: "Fidjrossè" },
    { name: "Carrefour Haie Vive", lat: 6.3548, lng: 2.3982, area: "Haie Vive" },
  ],
  abomey_calavi: [
    { name: "Carrefour Kpota", lat: 6.4485, lng: 2.3551, area: "Kpota" },
    { name: "Campus UAC / Zogbadjè", lat: 6.4412, lng: 2.3421, area: "Zogbadjè" },
    { name: "Carrefour Arconville", lat: 6.4398, lng: 2.3578, area: "Arconville" },
    { name: "Carrefour Tankpè", lat: 6.4563, lng: 2.3385, area: "Tankpè" },
    { name: "IITA Station Calavi", lat: 6.4172, lng: 2.3298, area: "IITA" },
  ],
  porto_novo: [
    { name: "Carrefour Catchi", lat: 6.4965, lng: 2.6285, area: "Catchi" },
    { name: "Grand Marché Ouando", lat: 6.5123, lng: 2.6145, area: "Ouando" },
    { name: "Place Cinquantenaire", lat: 6.4852, lng: 2.6321, area: "Centre" },
    { name: "Carrefour Beau Rivage", lat: 6.4789, lng: 2.6214, area: "Lagune" },
  ],
  parakou: [
    { name: "Carrefour Al-Houda", lat: 9.3485, lng: 2.6241, area: "Al-Houda" },
    { name: "Grand Marché Arzeke", lat: 9.3375, lng: 2.6312, area: "Arzeke" },
    { name: "Gare Voyageurs / Dépôt", lat: 9.3521, lng: 2.6189, area: "Gare" },
    { name: "Rond-point Hubert Maga", lat: 9.3312, lng: 2.6288, area: "Centre" },
  ],
};

export const LiveLocationShareModal: React.FC<LiveLocationShareModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedCityName,
  onShareLocation,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [isAcquiringGPS, setIsAcquiringGPS] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const cityKey = (selectedCityName || 'cotonou').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const availableLandmarks = BENIN_LANDMARKS_BY_CITY[cityKey] || BENIN_LANDMARKS_BY_CITY['cotonou'];

  // Acquire current real GPS position
  const handleAcquireGPS = () => {
    setIsAcquiringGPS(true);
    setGpsError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée sur ce navigateur.");
      setIsAcquiringGPS(false);
      // Fallback on first city landmark
      const fallback = availableLandmarks[0];
      setCoords({ lat: fallback.lat, lng: fallback.lng, accuracy: 25 });
      setSelectedLandmark(fallback.name);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15),
        });
        setIsAcquiringGPS(false);
        // Find closest landmark or display city
        setSelectedLandmark(selectedLandmark || availableLandmarks[0]?.name || `${selectedCityName} (Position GPS)`);
      },
      (err) => {
        console.warn("GPS acquire warning:", err.message);
        setGpsError("Signal GPS non détecté ou permission en attente. Repère par défaut sélectionné.");
        setIsAcquiringGPS(false);
        const fallback = availableLandmarks[0];
        setCoords({ lat: fallback.lat, lng: fallback.lng, accuracy: 50 });
        setSelectedLandmark(fallback.name);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      handleAcquireGPS();
      setCustomNote('En tournée de livraison dans le secteur');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const activeCoords = coords || { lat: availableLandmarks[0].lat, lng: availableLandmarks[0].lng, accuracy: 30 };
    const expiresAt = isLiveMode
      ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
      : undefined;

    const locationData: LiveLocationData = {
      latitude: activeCoords.lat,
      longitude: activeCoords.lng,
      landmark: selectedLandmark || availableLandmarks[0].name,
      address: `${selectedLandmark || availableLandmarks[0].name}, ${selectedCityName || 'Bénin'}`,
      isLive: isLiveMode,
      durationMinutes: isLiveMode ? durationMinutes : 0,
      expiresAt,
      accuracyMeters: activeCoords.accuracy || 20,
    };

    onShareLocation(locationData, customNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Partage de Position en Direct</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  GPS LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visible par les conducteurs et clients du salon {selectedCityName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Sensor Status Card */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <LocateFixed className="w-4 h-4 text-emerald-400" />
              <span>Coordonnées GPS captées</span>
            </span>

            <button
              type="button"
              onClick={handleAcquireGPS}
              disabled={isAcquiringGPS}
              className="text-amber-400 hover:text-amber-300 font-bold text-[11px] underline flex items-center gap-1"
            >
              {isAcquiringGPS ? "Actualisation..." : "Actualiser GPS"}
            </button>
          </div>

          {coords ? (
            <div className="flex items-center justify-between text-xs font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-200">
                <span>{coords.lat.toFixed(5)}°N</span>, <span>{coords.lng.toFixed(5)}°E</span>
              </div>
              <span className="text-[10px] font-sans text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                ± {coords.accuracy || 15}m précision
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Recherche du signal satellite en cours...</div>
          )}

          {gpsError && (
            <p className="text-[11px] text-amber-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{gpsError}</span>
            </p>
          )}
        </div>

        {/* Sharing Mode (Live vs Fixed) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Type de partage</span>
            <span className="text-[11px] text-amber-400 font-normal">
              {isLiveMode ? "Position actualisée en direct" : "Point fixe unique"}
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsLiveMode(true)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isLiveMode
                  ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-400/50'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>En direct (Live)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLiveMode(false)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                !isLiveMode
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg ring-1 ring-blue-400/50'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Position fixe</span>
            </button>
          </div>
        </div>

        {/* Live Duration Selector (if live mode active) */}
        {isLiveMode && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Durée du direct</span>
              </span>
              <span className="text-[11px] text-slate-400">Arrêt automatique</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { mins: 15, label: "15 min", desc: "Course rapide" },
                { mins: 30, label: "30 min", desc: "Course standard" },
                { mins: 60, label: "1 heure", desc: "Tournée / Relais" },
              ].map((item) => (
                <button
                  key={item.mins}
                  type="button"
                  onClick={() => setDurationMinutes(item.mins)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    durationMinutes === item.mins
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md ring-2 ring-amber-300/60'
                      : 'bg-slate-800/80 text-slate-300 font-bold border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <p className="text-xs">{item.label}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Benin Local Landmark Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Repère local connu ({selectedCityName})</span>
            </span>
            <span className="text-[10px] text-slate-400">Facilite le repérage</span>
          </label>

          <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950/60 rounded-2xl border border-slate-800">
            {availableLandmarks.map((lm) => {
              const isSelected = selectedLandmark === lm.name;
              return (
                <button
                  key={lm.name}
                  type="button"
                  onClick={() => {
                    setSelectedLandmark(lm.name);
                    setCoords({ lat: lm.lat, lng: lm.lng, accuracy: 20 });
                  }}
                  className={`p-2 rounded-xl text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-400 text-white font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="truncate font-bold">{lm.name}</p>
                  <p className="text-[10px] text-slate-400">{lm.area}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom status message note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">
            Note de statut (optionnelle)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ex: En route vers Ganhi, disponible pour relais colis..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Submit & Cancel */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Navigation className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Diffuser ma position</span>
          </button>
        </div>

      </div>
    </div>
  );
};
