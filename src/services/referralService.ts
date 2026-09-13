import { UserProfile } from '../types';
import { storageService } from './storageService';

export interface AmbassadorInfo {
  referralCode: string;
  referralCount: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  tierLabel: string;
  bonusAidScore: number; // e.g. 0, 10, 20, 25 points
  maxAidCeilingFcfa: number; // standard 25,000 F -> 40,000 -> 60,000 -> 80,000 F
  bonusAidCeilingFcfa: number; // +0, +15,000, +35,000, +55,000 F
  isFastTrackPriority: boolean;
  isPrivilegedSubscriber: boolean; // Statut Abonné Privilégié
  privilegedBadgeLabel: string; // ex: "⭐ Abonné Privilégié"
  clientSharesCount: number; // Nombre de partages
  whatsappInviteText: string;
  whatsappClientInviteText: string;
  whatsappBusinessInviteText: string;
  policyNote: string;
  nextTierProgress: {
    nextTierName: string;
    referralsNeeded: number;
    percentComplete: number;
  };
}

export class ReferralService {
  /**
   * Generates or retrieves the unique referral code for a user
   */
  public getOrCreateReferralCode(user: UserProfile): string {
    if (user.referralCode && user.referralCode.trim().length > 0) {
      return user.referralCode;
    }

    const cleanFirst = (user.firstName || user.name.split(' ')[0] || 'LIVREUR')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8);
    const cleanPhone = (user.phone || '229').replace(/[^\d]/g, '').slice(-4) || '229';
    const code = `LC-${cleanFirst}-${cleanPhone}`;

    // Persist to user
    const updated: UserProfile = {
      ...user,
      referralCode: code,
      referralCount: user.referralCount ?? 0,
    };
    storageService.setUser(updated);
    return code;
  }

  /**
   * Get full ambassador status and aid eligibility boost
   */
  public getAmbassadorInfo(user: UserProfile): AmbassadorInfo {
    const referralCode = this.getOrCreateReferralCode(user);
    const count = user.referralCount || 0;

    let tier: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
    let tierLabel = 'Ambassadeur Débutant';
    let bonusAidScore = 0;
    let maxAidCeilingFcfa = 25000;
    let isFastTrackPriority = false;
    let nextTierName = 'Argent';
    let referralsNeeded = 2 - count;
    let percentComplete = Math.min(100, Math.round((count / 2) * 100));

    if (count >= 7) {
      tier = 'diamond';
      tierLabel = 'Super Ambassadeur Diamant (Pilier Réseau)';
      bonusAidScore = 25;
      maxAidCeilingFcfa = 80000;
      isFastTrackPriority = true;
      nextTierName = 'Maximum Atteint';
      referralsNeeded = 0;
      percentComplete = 100;
    } else if (count >= 4) {
      tier = 'gold';
      tierLabel = 'Ambassadeur Or (Leader Communautaire)';
      bonusAidScore = 20;
      maxAidCeilingFcfa = 60000;
      isFastTrackPriority = true;
      nextTierName = 'Diamant';
      referralsNeeded = 7 - count;
      percentComplete = Math.min(100, Math.round(((count - 4) / 3) * 100));
    } else if (count >= 2) {
      tier = 'silver';
      tierLabel = 'Ambassadeur Argent (Actif)';
      bonusAidScore = 10;
      maxAidCeilingFcfa = 40000;
      isFastTrackPriority = false;
      nextTierName = 'Or';
      referralsNeeded = 4 - count;
      percentComplete = Math.min(100, Math.round(((count - 2) / 2) * 100));
    }

    const bonusAidCeilingFcfa = maxAidCeilingFcfa - 25000;

    const appUrl = 'https://ais-pre-zxavitnsxwmknftolyo2hv-626045602467.europe-west1.run.app';
    
    // Message pour confrères chauffeurs / livreurs (aide solidaire, pas d'argent direct)
    const whatsappInviteText = 
`🤝 *REJOINS LE RÉSEAU DES CHAUFFEURS & LIVREURS LIENCOLIS* 🇧🇯

Salut confrère ! Je t'invite sur *Liencolis*, l'application n°1 pour trouver des courses de colis et du fret sans intermédiaires.

🎁 *Mon Code Parrain Chauffeur* : *${referralCode}*
En t'inscrivant avec mon code, tu rejoins notre réseau d'entraide solidaire, tu débloques l'accès à la radio CB talkie-walkie, aux alertes colis express et à la Caisse de Solidarité (avances d'urgence 0% de 5 000 à 80 000 FCFA).

ℹ️ *Note :* Le parrainage ne distribue aucun argent en espèces, il booste uniquement l'éligibilité et l'accès aux secours pour les livreurs.

📲 *Télécharger / Ouvrir l'application maintenant* :
${appUrl}

À tout de suite sur la route ! 🛵📦`;

    // Message pour particuliers / proches (partage 100% gratuit et solidaire, aucun argent distribué)
    const whatsappClientInviteText =
`📦 *BESOIN D'UN LIVREUR SÉRIEUX & RAPIDE AU BÉNIN ?* 🇧🇯

Bonjour ! Je te recommande *Liencolis*, la plateforme directe pour faire livrer tes colis, plis, courses et achats en toute confiance et sans intermédiaire.

🚀 *Pourquoi choisir Liencolis ?*
• Tarif transparent dès 300 FCFA de base + distance au km
• Chauffeurs vérifiés et géolocalisés en direct
• Livraison express moto, tricycle et voiture

🎁 *Lien de recommandation solidaire* :
${appUrl} (Code : *${referralCode}*)

⭐ *Avantage Abonné Privilégié* : En partageant ce lien, vous débloquez le badge *Abonné Privilégié* sur Liencolis : toutes vos futures demandes de livreurs seront traitées en priorité immédiate par les chauffeurs du réseau ! (Pas d'argent distribué, 100% gratuit et solidaire).`;

    // Message pour entreprises, boutiques et commerçants (partage 100% gratuit, aucun argent distribué)
    const whatsappBusinessInviteText =
`🏪 *EXPÉDIEZ VOS COMMANDES & COLIS CLIENTS AVEC LIENCOLIS* 🇧🇯

Chers commerçants et entrepreneurs, optimisez vos livraisons avec *Liencolis* :
• Des livreurs disponibles partout (Cotonou, Calavi, Porto-Novo, Parakou...)
• Tarif équitable dès 300 FCFA sans commission abusive
• Suivi en temps réel et contact direct avec les chauffeurs

📦 *Accéder à la plateforme dès aujourd'hui* :
${appUrl} (Réf : *${referralCode}*)

⭐ *Avantage Entreprise Privilégiée* : En partageant Liencolis, votre commerce obtient le badge *Entreprise Privilégiée* avec priorité absolue d'affectation dès que vous demandez un livreur pour vos commandes ! (Zéro commission en argent, service d'entraide direct).`;

    const policyNote = "Le parrainage Liencolis ne distribue aucun argent en espèces. Pour les chauffeurs, il augmente le score d'éligibilité et le plafond d'avances de secours (5 000 F à 80 000 FCFA). Pour les particuliers et entreprises qui partagent le lien : pas d'argent non plus, mais un BADGE D'ABONNÉ PRIVILÉGIÉ qui accorde une priorité absolue d'affectation lors de chaque demande de livreur !";

    const isPrivilegedSubscriber = Boolean(user.isPrivilegedSubscriber || (user.clientSharesCount && user.clientSharesCount > 0));
    const privilegedBadgeLabel = user.privilegedBadgeLabel || (user.role === 'merchant' ? '⭐ Entreprise Privilégiée (Priorité Courses)' : '⭐ Abonné Privilégié (Priorité Courses)');
    const clientSharesCount = user.clientSharesCount || 0;

    return {
      referralCode,
      referralCount: count,
      tier,
      tierLabel,
      bonusAidScore,
      maxAidCeilingFcfa,
      bonusAidCeilingFcfa,
      isFastTrackPriority,
      isPrivilegedSubscriber,
      privilegedBadgeLabel,
      clientSharesCount,
      whatsappInviteText,
      whatsappClientInviteText,
      whatsappBusinessInviteText,
      policyNote,
      nextTierProgress: {
        nextTierName,
        referralsNeeded: Math.max(0, referralsNeeded),
        percentComplete,
      },
    };
  }

  /**
   * Record a share action by a client or business, upgrading them to Privileged Subscriber
   */
  public recordShareAction(targetType: 'driver' | 'client' | 'business' = 'client'): {
    updatedUser: UserProfile | null;
    wasPromoted: boolean;
  } {
    const currentUser = storageService.getUser();
    if (!currentUser) return { updatedUser: null, wasPromoted: false };

    const previousCount = currentUser.clientSharesCount || 0;
    const newCount = previousCount + 1;
    const wasAlreadyPrivileged = Boolean(currentUser.isPrivilegedSubscriber);

    const badge = targetType === 'business'
      ? '⭐ Entreprise Privilégiée (Priorité Courses)'
      : '⭐ Abonné Privilégié (Priorité Courses)';

    const updated: UserProfile = {
      ...currentUser,
      clientSharesCount: newCount,
      isPrivilegedSubscriber: true,
      privilegedBadgeLabel: badge,
    };

    storageService.setUser(updated);
    return {
      updatedUser: updated,
      wasPromoted: !wasAlreadyPrivileged,
    };
  }

  /**
   * Register a new referral (simulate or real link)
   */
  public registerReferral(referrerCode: string, colleagueName: string): boolean {
    const cleanCode = referrerCode.trim().toUpperCase();
    const currentUser = storageService.getUser();

    if (currentUser && currentUser.referralCode === cleanCode) {
      // User is referring someone!
      const newCount = (currentUser.referralCount || 0) + 1;
      const ambassador = this.getAmbassadorInfo({ ...currentUser, referralCount: newCount });

      const updated: UserProfile = {
        ...currentUser,
        referralCount: newCount,
        referralBonusAidPoints: ambassador.bonusAidScore,
        ambassadorTier: ambassador.tier,
        maxAidAmountBoostFcfa: ambassador.bonusAidCeilingFcfa,
      };

      storageService.setUser(updated);
      return true;
    }

    // Check all users
    const allUsers = storageService.getAllUsers();
    const targetUser = allUsers.find((u) => u.referralCode?.toUpperCase() === cleanCode);
    if (targetUser) {
      targetUser.referralCount = (targetUser.referralCount || 0) + 1;
      storageService.saveAllUsers(allUsers);
      return true;
    }

    return false;
  }

  /**
   * Share referral link on WhatsApp
   */
  public shareOnWhatsApp(inviteText: string): void {
    const url = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
    window.open(url, '_blank');
  }
}

export const referralService = new ReferralService();
