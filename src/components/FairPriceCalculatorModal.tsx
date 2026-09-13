import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Bike,
  Truck,
  Car,
  Package,
  Share2,
  Check,
  Zap,
  Moon,
  Info,
  ArrowRight,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { VehicleType } from '../types';
import {
  calculateFairPrice,
  PackageWeightCategory,
  estimateDistanceKm,
} from '../utils/fairPriceCalculator';

interface FairPriceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPickup?: string;
  initialDropoff?: string;
  initialVehicleType?: VehicleType;
  onApplyPrice?: (priceFcfa: number) => void;
}

const COMMON_LOCATIONS = [
  'Haie Vive',
  'Cadjehoun',
  'Fidjrossè',
  'Dantokpa',
  'Akpakpa',
  'Godomey',
  'Calavi Kpota',
  'Tankpè',
  'Porto-Novo',
  'Ouidah',
  'Bohicon',
  'Parakou',
];

export const FairPriceCalculatorModal: React.FC<FairPriceCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialPickup = 'Cadjehoun',
  initialDropoff = 'Calavi Kpota',
  initialVehicleType = 'moto_2wheels',
  onApplyPrice,
}) => {
  const [pickup, setPickup] = useState(initialPickup);
  const [dropoff, setDropoff] = useState(initialDropoff);
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicleType);
  const [packageCategory, setPackageCategory] = useState<PackageWeightCategory>('standard');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isNightOrRain, setIsNightOrRain] = useState(false);
  const [customDistance, setCustomDistance] = useState<number | ''>('');
  const [basePrice, setBasePrice] = useState<number>(300);
  const [perKmRate, setPerKmRate] = useState<number>(100);

  const estimatedDist = useMemo(() => {
    return estimateDistanceKm(pickup, dropoff);
  }, [pickup, dropoff]);

  const activeDistance = typeof customDistance === 'number' && customDistance > 0 ? customDistance : estimatedDist;

  const handleVehicleChange = (v: VehicleType) => {
    setVehicleType(v);
    if (v === 'moto_2wheels') {
      setBasePrice(300);
      setPerKmRate(100);
    } else if (v === 'tricycle') {
      setBasePrice(800);
      setPerKmRate(200);
    } else if (v === 'car_4wheels') {
      setBasePrice(1500);
      setPerKmRate(300);
    }
  };

  const result = useMemo(() => {
    return calculateFairPrice({
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      customDistanceKm: activeDistance,
      vehicleType,
      packageCategory,
      isUrgent,
      isNightOrRain,
      customBaseFee: basePrice,
      customPerKmRate: perKmRate,
      includedKm: 0,
    });
  }, [pickup, dropoff, activeDistance, vehicleType, packageCategory, isUrgent, isNightOrRain, basePrice, perKmRate]);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(result.whatsappQuoteText)}`;
    window.open(url, '_blank');
  };

  const handleApply = () => {
    if (onApplyPrice) {
      onApplyPrice(result.recommendedPrice);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Calculateur de Prix Juste</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Bénin Barème
                </span>
              </h3>
              <p className="text-xs text-slate-400">Tarification transparente sans négociation abusive</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-200">
          {/* 1. Trajet : Départ & Arrivée */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Villes / Quartiers de la Course
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Lieu de départ :</span>
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Ex: Cadjehoun, Dantokpa..."
                  list="locations-list"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 outline-none text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Lieu de destination :</span>
                <input
                  type="text"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Ex: Calavi, Akpakpa..."
                  list="locations-list"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 outline-none text-xs"
                />
              </div>
            </div>

            <datalist id="locations-list">
              {COMMON_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>

            {/* Distance Slider / Input */}
            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400">Distance estimée :</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="600"
                  step="0.5"
                  value={activeDistance}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCustomDistance(isNaN(val) ? '' : val);
                  }}
                  className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-400 font-bold font-mono text-center outline-none"
                />
                <span className="font-bold text-slate-300">km</span>
              </div>
            </div>
          </div>

            {/* 2. Type de Véhicule */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Type d'Engin Souhaité
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleVehicleChange('moto_2wheels')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  vehicleType === 'moto_2wheels'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bike className="w-5 h-5" />
                <span className="text-[11px]">Moto 2 Roues</span>
                <span className="text-[9px] text-slate-500">Base 300 F</span>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleChange('tricycle')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  vehicleType === 'tricycle'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span className="text-[11px]">Tricycle Benne</span>
                <span className="text-[9px] text-slate-500">Base 800 F</span>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleChange('car_4wheels')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  vehicleType === 'car_4wheels'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Car className="w-5 h-5" />
                <span className="text-[11px]">Voiture / Break</span>
                <span className="text-[9px] text-slate-500">Base 1 500 F</span>
              </button>
            </div>
          </div>

          {/* 3. Barème de Base & Sort des Kilomètres */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Prix de Base & Sort des Kilomètres</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-mono font-bold">
                Barème 300 F
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prix de base */}
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">Prix de base (Prise en charge) :</span>
                  <span className="text-amber-400 font-mono font-extrabold">{basePrice} FCFA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[300, 500, 800].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBasePrice(p)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        basePrice === p
                          ? 'bg-amber-400 text-slate-950 font-black shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p} F {p === 300 ? '★' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500">Forfait de départ garanti au livreur</p>
              </div>

              {/* Sort des kilomètres */}
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">Sort des kilomètres :</span>
                  <span className="text-emerald-400 font-mono font-extrabold">{perKmRate} F / km</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[100, 150, 200].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPerKmRate(r)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        perKmRate === r
                          ? 'bg-emerald-400 text-slate-950 font-black shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r} F/km
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500">
                  {activeDistance} km × {perKmRate} F = {Math.round(activeDistance * perKmRate).toLocaleString('fr-FR')} F
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between font-mono">
              <span>Formule appliquée :</span>
              <span className="text-slate-200">
                <strong className="text-amber-300">{basePrice} F</strong> + (<strong className="text-emerald-300">{activeDistance} km</strong> × {perKmRate} F) = <strong className="text-white">{Math.round(basePrice + activeDistance * perKmRate).toLocaleString('fr-FR')} F</strong>
              </span>
            </div>
          </div>

          {/* 4. Gabarit de la Marchandise */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              4. Poids & Volume du Colis
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'light', label: 'Pli / Clé', desc: '< 1 kg' },
                { id: 'standard', label: 'Colis Moyen', desc: '1 - 10 kg' },
                { id: 'heavy', label: 'Lourd / Vivres', desc: '10 - 50 kg' },
                { id: 'cargo', label: 'Gros Fret', desc: '> 50 kg' },
              ].map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageCategory(pkg.id as PackageWeightCategory)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    packageCategory === pkg.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-[11px] font-bold">{pkg.label}</p>
                  <p className="text-[9px] text-slate-500">{pkg.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Options Spéciales */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsUrgent(!isUrgent)}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                isUrgent
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <p className="text-[11px] font-bold">Express Urgent</p>
                  <p className="text-[9px] text-slate-500">+500 F</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isUrgent ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'}`}>
                {isUrgent && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsNightOrRain(!isNightOrRain)}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                isNightOrRain
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-blue-400" />
                <div className="text-left">
                  <p className="text-[11px] font-bold">Nuit ou Pluie</p>
                  <p className="text-[9px] text-slate-500">+500 F</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isNightOrRain ? 'border-blue-400 bg-blue-400 text-slate-950' : 'border-slate-700'}`}>
                {isNightOrRain && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* RESULT CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-400/40 shadow-xl space-y-3">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRIX JUSTE CONSEILLÉ LIENCOLIS</span>
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-center justify-center gap-1.5">
                <span>{result.recommendedPrice.toLocaleString('fr-FR')}</span>
                <span className="text-base text-amber-400 font-bold">FCFA</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Fourchette équitable : <strong className="text-slate-200">{result.minPrice.toLocaleString('fr-FR')} F</strong> à <strong className="text-slate-200">{result.maxPrice.toLocaleString('fr-FR')} F</strong>
              </p>
            </div>

            {/* Breakdown table */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
              {result.breakdown.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-400">
                  <span>{line.label}</span>
                  <span className="font-mono text-slate-200 font-medium">+{line.amount.toLocaleString('fr-FR')} F</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager Devis WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            {onApplyPrice && (
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-400/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Appliquer ({result.recommendedPrice.toLocaleString('fr-FR')} F)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
