import { VehicleType } from '../types';

export type PackageWeightCategory = 'light' | 'standard' | 'heavy' | 'cargo';

export interface FairPriceParams {
  pickupLocation: string;
  dropoffLocation: string;
  customDistanceKm?: number;
  vehicleType: VehicleType;
  packageCategory: PackageWeightCategory;
  isUrgent?: boolean;
  isNightOrRain?: boolean;
  customBaseFee?: number;
  customPerKmRate?: number;
  includedKm?: number;
}

export interface PriceBreakdownLine {
  label: string;
  amount: number;
}

export interface FairPriceResult {
  distanceKm: number;
  baseFee: number;
  perKmRate: number;
  billableKm: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  vehicleType: VehicleType;
  packageCategory: PackageWeightCategory;
  breakdown: PriceBreakdownLine[];
  whatsappQuoteText: string;
  summaryExplanation: string;
}

// Distance matrix approximations in Benin (in km)
const LOCATION_DISTANCES: Record<string, Record<string, number>> = {
  'haie vive': { 'cadjehoun': 2.5, 'fidjrossè': 4, 'dantokpa': 6, 'akpakpa': 7, 'godomey': 9, 'calavi kpota': 16, 'tankpè': 18, 'porto-novo': 33, 'ouidah': 40 },
  'cadjehoun': { 'haie vive': 2.5, 'fidjrossè': 3.5, 'dantokpa': 5, 'akpakpa': 6, 'godomey': 8, 'calavi kpota': 15, 'tankpè': 17, 'porto-novo': 32, 'ouidah': 39 },
  'fidjrossè': { 'haie vive': 4, 'cadjehoun': 3.5, 'dantokpa': 8, 'akpakpa': 9, 'godomey': 6, 'calavi kpota': 14, 'tankpè': 16, 'porto-novo': 36, 'ouidah': 36 },
  'dantokpa': { 'haie vive': 6, 'cadjehoun': 5, 'fidjrossè': 8, 'akpakpa': 3, 'godomey': 10, 'calavi kpota': 16, 'tankpè': 19, 'porto-novo': 29, 'ouidah': 43 },
  'akpakpa': { 'haie vive': 7, 'cadjehoun': 6, 'fidjrossè': 9, 'dantokpa': 3, 'godomey': 12, 'calavi kpota': 18, 'tankpè': 21, 'porto-novo': 26, 'ouidah': 45 },
  'godomey': { 'haie vive': 9, 'cadjehoun': 8, 'fidjrossè': 6, 'dantokpa': 10, 'akpakpa': 12, 'calavi kpota': 7, 'tankpè': 9, 'porto-novo': 38, 'ouidah': 32 },
  'calavi kpota': { 'haie vive': 16, 'cadjehoun': 15, 'fidjrossè': 14, 'dantokpa': 16, 'akpakpa': 18, 'godomey': 7, 'tankpè': 4, 'porto-novo': 42, 'ouidah': 35 },
  'tankpè': { 'haie vive': 18, 'cadjehoun': 17, 'fidjrossè': 16, 'dantokpa': 19, 'akpakpa': 21, 'godomey': 9, 'calavi kpota': 4, 'porto-novo': 45, 'ouidah': 37 },
  'porto-novo': { 'haie vive': 33, 'cadjehoun': 32, 'fidjrossè': 36, 'dantokpa': 29, 'akpakpa': 26, 'godomey': 38, 'calavi kpota': 42, 'tankpè': 45, 'ouidah': 65 },
  'ouidah': { 'haie vive': 40, 'cadjehoun': 39, 'fidjrossè': 36, 'dantokpa': 43, 'akpakpa': 45, 'godomey': 32, 'calavi kpota': 35, 'tankpè': 37, 'porto-novo': 65 },
  'parakou': { 'cotonou': 415, 'porto-novo': 430, 'bohicon': 285 },
  'bohicon': { 'cotonou': 130, 'porto-novo': 145, 'parakou': 285 },
};

export function estimateDistanceKm(pickup: string, dropoff: string): number {
  const p = pickup.trim().toLowerCase();
  const d = dropoff.trim().toLowerCase();

  if (!p || !d || p === d) return 3;

  for (const [keyP, destinations] of Object.entries(LOCATION_DISTANCES)) {
    if (p.includes(keyP)) {
      for (const [keyD, dist] of Object.entries(destinations)) {
        if (d.includes(keyD)) return dist;
      }
    }
  }

  for (const [keyD, destinations] of Object.entries(LOCATION_DISTANCES)) {
    if (d.includes(keyD)) {
      for (const [keyP, dist] of Object.entries(destinations)) {
        if (p.includes(keyP)) return dist;
      }
    }
  }

  // Inter-city detection
  if (p.includes('parakou') || d.includes('parakou')) return 415;
  if (p.includes('bohicon') || d.includes('bohicon')) return 130;
  if (p.includes('porto-novo') || d.includes('porto-novo')) return 32;
  if (p.includes('calavi') || d.includes('calavi')) return 16;
  if (p.includes('ouidah') || d.includes('ouidah')) return 40;

  // Default intra-city estimate
  return 5;
}

export function calculateFairPrice(params: FairPriceParams): FairPriceResult {
  const distanceKm = params.customDistanceKm && params.customDistanceKm > 0
    ? params.customDistanceKm
    : estimateDistanceKm(params.pickupLocation, params.dropoffLocation);

  const breakdown: PriceBreakdownLine[] = [];

  // 1. Base fee and per-km rate (Barème officiel : Prix de base 300 FCFA pour moto)
  let baseFee = typeof params.customBaseFee === 'number' ? params.customBaseFee : 300;
  let includedKm = typeof params.includedKm === 'number' ? params.includedKm : 0;
  let perKmRate = typeof params.customPerKmRate === 'number' ? params.customPerKmRate : 100;

  if (params.vehicleType === 'tricycle') {
    baseFee = typeof params.customBaseFee === 'number' ? params.customBaseFee : 800;
    includedKm = typeof params.includedKm === 'number' ? params.includedKm : 0;
    perKmRate = typeof params.customPerKmRate === 'number' ? params.customPerKmRate : 200;
  } else if (params.vehicleType === 'car_4wheels') {
    baseFee = typeof params.customBaseFee === 'number' ? params.customBaseFee : 1500;
    includedKm = typeof params.includedKm === 'number' ? params.includedKm : 0;
    perKmRate = typeof params.customPerKmRate === 'number' ? params.customPerKmRate : 300;
  }

  breakdown.push({
    label: `Prise en charge (Prix de base fixe)`,
    amount: baseFee,
  });

  const billableKm = Math.max(0, distanceKm - includedKm);
  let distanceAmount = 0;
  if (billableKm > 0) {
    distanceAmount = Math.round(billableKm * perKmRate);
    breakdown.push({
      label: `Sort des kilomètres (${billableKm.toFixed(1)} km × ${perKmRate} F/km)`,
      amount: distanceAmount,
    });
  }

  // 2. Package Category surcharge
  let packageSurcharge = 0;
  let packageLabel = '';
  switch (params.packageCategory) {
    case 'light':
      packageLabel = 'Pli léger / Enveloppe (< 1 kg)';
      packageSurcharge = 0;
      break;
    case 'standard':
      packageLabel = 'Colis moyen standard (1 - 10 kg)';
      packageSurcharge = 200;
      break;
    case 'heavy':
      packageLabel = 'Sac vivres / Matériel lourd (10 - 50 kg)';
      packageSurcharge = params.vehicleType === 'tricycle' ? 500 : 1000;
      break;
    case 'cargo':
      packageLabel = 'Gros fret / Encombrant (> 50 kg)';
      packageSurcharge = params.vehicleType === 'tricycle' ? 1200 : 2500;
      break;
  }

  if (packageSurcharge > 0) {
    breakdown.push({
      label: `Supplément gabarit (${packageLabel})`,
      amount: packageSurcharge,
    });
  }

  // 3. Options
  let optionsSurcharge = 0;
  if (params.isUrgent) {
    optionsSurcharge += 500;
    breakdown.push({
      label: 'Priorité Express / Urgence immédiate',
      amount: 500,
    });
  }
  if (params.isNightOrRain) {
    optionsSurcharge += 500;
    breakdown.push({
      label: 'Course de Nuit / Intempéries',
      amount: 500,
    });
  }

  const rawTotal = baseFee + distanceAmount + packageSurcharge + optionsSurcharge;
  // Round to nearest 50 or 100 FCFA for local cash practicalities
  const recommendedPrice = Math.round(rawTotal / 50) * 50;
  const minPrice = Math.max(baseFee, Math.round((recommendedPrice * 0.9) / 50) * 50);
  const maxPrice = Math.round((recommendedPrice * 1.15) / 50) * 50;

  const vehicleName = params.vehicleType === 'moto_2wheels' ? 'Moto 2 roues' : params.vehicleType === 'tricycle' ? 'Tricycle Cargo Benne' : 'Véhicule 4 roues / Break';

  const summaryExplanation = `Tarif juste estimé pour ${distanceKm.toFixed(1)} km en ${vehicleName} (Base : ${baseFee.toLocaleString('fr-FR')} F + ${billableKm.toFixed(1)} km × ${perKmRate} F/km). Prix recommandé : ${recommendedPrice.toLocaleString('fr-FR')} FCFA.`;

  const whatsappQuoteText = 
`📦 *DEVIS TARIF JUSTE LIENCOLIS* 🇧🇯
📍 *Trajet* : ${params.pickupLocation || 'Départ'} ➔ ${params.dropoffLocation || 'Arrivée'}
📏 *Distance estimée* : ~${distanceKm.toFixed(1)} km
🛵 *Engin* : ${vehicleName}
💰 *Prix de base (Prise en charge)* : ${baseFee.toLocaleString('fr-FR')} FCFA
🛣️ *Sort des kilomètres* : ${billableKm.toFixed(1)} km × ${perKmRate} F/km = ${distanceAmount.toLocaleString('fr-FR')} FCFA
📦 *Marchandise* : ${packageLabel || 'Colis standard'}
${params.isUrgent ? '⚡ *Option* : Livraison Express Prioritaire (+500 F)\n' : ''}${params.isNightOrRain ? '🌧️ *Option* : Course Nuit/Pluie (+500 F)\n' : ''}
💰 *PRIX JUSTE RECOMMANDÉ* : *${recommendedPrice.toLocaleString('fr-FR')} FCFA*
_(Fourchette équitable : ${minPrice.toLocaleString('fr-FR')} - ${maxPrice.toLocaleString('fr-FR')} FCFA)_

✅ Garanti sans négociation abusive.
📲 Valider sur Liencolis : https://ais-pre-zxavitnsxwmknftolyo2hv-626045602467.europe-west1.run.app`;

  return {
    distanceKm,
    baseFee,
    perKmRate,
    billableKm,
    recommendedPrice,
    minPrice,
    maxPrice,
    vehicleType: params.vehicleType,
    packageCategory: params.packageCategory,
    breakdown,
    whatsappQuoteText,
    summaryExplanation,
  };
}
