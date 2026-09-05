/**
 * Calculateur officiel des commissions et formules tarifaires Liencolis Bénin.
 * 
 * Règle tarifaire demandée :
 * - Choix entre Abonnement Mensuel (0% commission) ou Commission progressive à la course.
 * - Commission à la course :
 *   - Applicable uniquement sur les livraisons reçues et acceptées via les annonces de l'application.
 *   - Pour un montant < 1 000 FCFA : 0% de commission.
 *   - À partir de 1 000 FCFA : Commission de base de 5% (50 FCFA sur 1 000 F).
 *   - Chaque tranche de +250 FCFA au-dessus de 1 000 FCFA augmente le taux de +2%.
 *     (Ex: 1 000 F = 5%, 1 250 F = 7%, 1 500 F = 9%, 1 750 F = 11%, 2 000 F = 13%, 2 500 F = 17%, plafonné à 20% max).
 * - Portefeuille Chauffeur :
 *   - Dépôt / recharge initial compris entre 250 FCFA et 2 500 FCFA.
 */

export interface CommissionCalculation {
  deliveryFee: number;
  ratePercent: number;
  commissionAmount: number;
  netDriverPayout: number;
  isEligibleForCommission: boolean;
  stepCount: number;
  breakdownText: string;
}

export const MIN_WALLET_DEPOSIT = 250;
export const MAX_WALLET_DEPOSIT = 2500;
export const DEFAULT_INITIAL_DEPOSIT = 1200;

export const WALLET_DEPOSIT_PRESETS = [250, 500, 1000, 1200, 1500, 2000, 2500];

export function calculateDeliveryCommission(
  fee: number,
  isFromAd: boolean = true,
  pricingPlan: 'subscription' | 'commission' = 'commission'
): CommissionCalculation {
  // If driver has an active unlimited subscription, 0% commission
  if (pricingPlan === 'subscription') {
    return {
      deliveryFee: fee,
      ratePercent: 0,
      commissionAmount: 0,
      netDriverPayout: fee,
      isEligibleForCommission: false,
      stepCount: 0,
      breakdownText: 'Formule Abonnement Illimité : 0% de commission (100% des gains reversés au livreur).',
    };
  }

  // If not from an ad announcement
  if (!isFromAd) {
    return {
      deliveryFee: fee,
      ratePercent: 0,
      commissionAmount: 0,
      netDriverPayout: fee,
      isEligibleForCommission: false,
      stepCount: 0,
      breakdownText: 'Course directe / privée : 0% de commission Liencolis.',
    };
  }

  // For orders under 1 000 FCFA : exempt of commission
  if (fee < 1000) {
    return {
      deliveryFee: fee,
      ratePercent: 0,
      commissionAmount: 0,
      netDriverPayout: fee,
      isEligibleForCommission: true,
      stepCount: 0,
      breakdownText: 'Montant < 1 000 FCFA : Exempté de commission (0 FCFA).',
    };
  }

  // Base rate 5% at 1000 FCFA, +2% per each 250 FCFA increment above 1000 FCFA
  const extraAmount = fee - 1000;
  const stepCount = Math.floor(extraAmount / 250);
  let calculatedRate = 5 + stepCount * 2;

  // Cap at 20% to prevent excessive commission on large long-distance deliveries
  const MAX_RATE = 20;
  const isCapped = calculatedRate > MAX_RATE;
  const ratePercent = Math.min(MAX_RATE, calculatedRate);

  const commissionAmount = Math.round(fee * (ratePercent / 100));
  const netDriverPayout = fee - commissionAmount;

  const breakdownText = isCapped
    ? `Taux plafonné à ${ratePercent}% (${commissionAmount.toLocaleString()} FCFA de commission, ${netDriverPayout.toLocaleString()} FCFA net).`
    : `Taux : 5% de base + (${stepCount} × 2%) = ${ratePercent}% (${commissionAmount.toLocaleString()} FCFA de commission, ${netDriverPayout.toLocaleString()} FCFA net).`;

  return {
    deliveryFee: fee,
    ratePercent,
    commissionAmount,
    netDriverPayout,
    isEligibleForCommission: true,
    stepCount,
    breakdownText,
  };
}

/**
 * Compare savings between subscription and commission plan based on monthly delivery volume
 */
export function comparePlanSavings(monthlyEarnings: number, monthlyDeliveriesCount: number) {
  const avgCourseFee = monthlyDeliveriesCount > 0 ? monthlyEarnings / monthlyDeliveriesCount : 1500;
  const sampleCommission = calculateDeliveryCommission(avgCourseFee, true, 'commission');
  const totalEstimatedCommission = sampleCommission.commissionAmount * monthlyDeliveriesCount;

  const subscriptionCost = 1200; // Monthly 2-wheels subscription
  const diff = totalEstimatedCommission - subscriptionCost;

  return {
    totalEstimatedCommission,
    subscriptionCost,
    recommendedPlan: diff > 0 ? ('subscription' as const) : ('commission' as const),
    savingsWithRecommendedPlan: Math.abs(diff),
  };
}
