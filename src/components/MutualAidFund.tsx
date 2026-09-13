import React, { useState, useEffect } from 'react';
import { AidRequest, UserProfile } from '../types';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { referralService, AmbassadorInfo } from '../services/referralService';
import confetti from 'canvas-confetti';
import {
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  Wallet,
  Sparkles,
  Activity,
  FileText,
  Wrench,
  Ambulance,
  HeartPulse,
  Phone,
  MapPin,
  Check,
  Zap,
  Info,
  Users,
  TrendingUp,
  Scale,
  UserCheck,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  Fuel,
  Share2,
  Copy,
  Award,
  Gift,
  Bike,
  Building2,
} from 'lucide-react';

interface MutualAidFundProps {
  aidRequests: AidRequest[];
  currentUser: UserProfile | null;
  onAddAidRequest: (req: AidRequest) => void;
  onOpenPayment: (purpose?: any) => void;
  isDarkMode: boolean;
}

interface CriterionItem {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  description: string;
  status: 'pass' | 'fail' | 'warn';
  actionPrompt?: string;
  actionType?: 'kyc' | 'wallet' | 'deliveries' | 'ratings' | 'charter' | 'referrals';
}

export const MutualAidFund: React.FC<MutualAidFundProps> = ({
  aidRequests,
  currentUser,
  onAddAidRequest,
  onOpenPayment,
  isDarkMode,
}) => {
  // Navigation within the Financial Aid module
  const [activeSubTab, setActiveSubTab] = useState<'emergency' | 'eligibility' | 'ambassador' | 'rules'>('emergency');

  // Modals & Action States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [colleagueInviteInput, setColleagueInviteInput] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Emergency aid request form fields
  const [incidentType, setIncidentType] = useState<'breakdown' | 'accident' | 'health_emergency' | 'spare_parts' | 'other'>('breakdown');
  const [requestedAmount, setRequestedAmount] = useState('5000');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [momoNumber, setMomoNumber] = useState(currentUser?.phone || '+229 01 69 81 46 31');
  const [incidentCity, setIncidentCity] = useState(currentUser?.city || 'Cotonou');

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Calculate Driver Eligibility Score for Financial Aid (out of 100 points)
  const calculateEligibility = (user: UserProfile | null): {
    score: number;
    isEligible: boolean;
    tier: 'gold' | 'silver' | 'bronze' | 'ineligible';
    criteria: CriterionItem[];
    ambassador: AmbassadorInfo;
  } => {
    const dummyAmbassador: AmbassadorInfo = {
      referralCode: 'LC-BENIN',
      referralCount: 0,
      tier: 'bronze',
      tierLabel: 'Débutant',
      bonusAidScore: 0,
      maxAidCeilingFcfa: 25000,
      bonusAidCeilingFcfa: 0,
      isFastTrackPriority: false,
      isPrivilegedSubscriber: false,
      privilegedBadgeLabel: 'Abonné',
      clientSharesCount: 0,
      whatsappInviteText: '',
      whatsappClientInviteText: '',
      whatsappBusinessInviteText: '',
      policyNote: '',
      nextTierProgress: { nextTierName: 'Argent', referralsNeeded: 2, percentComplete: 0 },
    };

    if (!user) {
      return {
        score: 0,
        isEligible: false,
        tier: 'ineligible',
        criteria: [
          {
            id: 'auth',
            label: 'Connexion Requise',
            points: 0,
            maxPoints: 100,
            description: 'Veuillez vous connecter pour vérifier votre éligibilité aux aides financières.',
            status: 'fail',
          },
        ],
        ambassador: dummyAmbassador,
      };
    }

    const ambassador = referralService.getAmbassadorInfo(user);
    let baseScore = 0;
    const criteria: CriterionItem[] = [];

    // 1. Identification & KYC Certifié (30 points)
    const isKycValid = user.isCertified || user.kycStatus === 'approved';
    if (isKycValid) {
      baseScore += 30;
      criteria.push({
        id: 'kyc',
        label: 'Identité Chauffeur Validée (KYC)',
        points: 30,
        maxPoints: 30,
        description: 'CIP, Permis de conduire ou CNI vérifié par les administrateurs.',
        status: 'pass',
      });
    } else if (user.kycStatus === 'pending') {
      baseScore += 15;
      criteria.push({
        id: 'kyc',
        label: 'Pièce d’identité en cours de vérification',
        points: 15,
        maxPoints: 30,
        description: 'Vos documents sont en cours d’examen prioritaire.',
        status: 'warn',
        actionPrompt: 'Voir l’état du KYC',
        actionType: 'kyc',
      });
    } else {
      criteria.push({
        id: 'kyc',
        label: 'Pièce d’identité non vérifiée',
        points: 0,
        maxPoints: 30,
        description: 'Document officiel requis pour toute avance financière.',
        status: 'fail',
        actionPrompt: 'Transmettre ma pièce d’identité',
        actionType: 'kyc',
      });
    }

    // 2. Activité & Historique de Courses (25 points)
    const completed = user.completedDeliveries || 0;
    if (completed >= 15) {
      baseScore += 25;
      criteria.push({
        id: 'deliveries',
        label: 'Historique de Courses Réussies',
        points: 25,
        maxPoints: 25,
        description: `${completed} livraisons complétées avec succès sur la plateforme.`,
        status: 'pass',
      });
    } else if (completed >= 5) {
      baseScore += 15;
      criteria.push({
        id: 'deliveries',
        label: 'Activité en Progression',
        points: 15,
        maxPoints: 25,
        description: `${completed}/15 livraisons réalisées pour la pleine note d’activité.`,
        status: 'warn',
        actionPrompt: 'Accepter plus de livraisons',
        actionType: 'deliveries',
      });
    } else {
      criteria.push({
        id: 'deliveries',
        label: 'Activité minimale requise',
        points: 5,
        maxPoints: 25,
        description: 'Un minimum de 5 livraisons est demandé pour prétendre aux avances de secours.',
        status: 'fail',
        actionPrompt: 'Démarrer des livraisons',
        actionType: 'deliveries',
      });
    }

    // 3. Évaluation & Ponctualité Client (20 points)
    const rating = user.rating || 5.0;
    if (rating >= 4.5) {
      baseScore += 20;
      criteria.push({
        id: 'ratings',
        label: 'Excellence & Retours Clients',
        points: 20,
        maxPoints: 20,
        description: `Note de satisfaction exemplaire : ${rating.toFixed(1)}/5.`,
        status: 'pass',
      });
    } else if (rating >= 3.8) {
      baseScore += 12;
      criteria.push({
        id: 'ratings',
        label: 'Satisfaction Client Conforme',
        points: 12,
        maxPoints: 20,
        description: `Note moyenne de ${rating.toFixed(1)}/5.`,
        status: 'warn',
      });
    } else {
      criteria.push({
        id: 'ratings',
        label: 'Note client à consolider',
        points: 5,
        maxPoints: 20,
        description: `Note actuelle de ${rating.toFixed(1)}/5 inférieure au seuil optimal.`,
        status: 'fail',
      });
    }

    // 4. Situation du Portefeuille (15 points)
    const balance = user.driverWallet?.balance || 0;
    if (balance >= 0) {
      baseScore += 15;
      criteria.push({
        id: 'wallet',
        label: 'Compte & Commissions en Règle',
        points: 15,
        maxPoints: 15,
        description: 'Aucun arriéré de commission sur le portefeuille chauffeur.',
        status: 'pass',
      });
    } else {
      criteria.push({
        id: 'wallet',
        label: 'Arriéré de commission détecté',
        points: 0,
        maxPoints: 15,
        description: 'Commissions impayées. Régularisez votre solde pour débloquer l’aide.',
        status: 'fail',
        actionPrompt: 'Régulariser mon solde',
        actionType: 'wallet',
      });
    }

    // 5. Engagement Solidaire & Réciprocité (10 points)
    baseScore += 10;
    criteria.push({
      id: 'charter',
      label: 'Engagement Moral de Remboursement',
      points: 10,
      maxPoints: 10,
      description: 'Acceptation du prélèvement échelonné sur les commissions futures.',
      status: 'pass',
    });

    // 6. Bouche-à-Oreille & Ambassadeur Liencolis (+25 points d'aide !)
    if (ambassador.referralCount >= 7) {
      criteria.push({
        id: 'referrals',
        label: 'Super Ambassadeur Diamant (+25 pts Bonus)',
        points: 25,
        maxPoints: 25,
        description: `Réseau étendu : ${ambassador.referralCount} confrères parrainés ! Coupe-file prioritaire et plafond d’avance boosté à 80 000 FCFA.`,
        status: 'pass',
      });
    } else if (ambassador.referralCount >= 4) {
      criteria.push({
        id: 'referrals',
        label: 'Ambassadeur Or Liencolis (+20 pts Bonus)',
        points: 20,
        maxPoints: 25,
        description: `${ambassador.referralCount} confrères parrainés. Score d'éligibilité boosté de +20 pts et plafond d'aide augmenté à 60 000 FCFA.`,
        status: 'pass',
      });
    } else if (ambassador.referralCount >= 2) {
      criteria.push({
        id: 'referrals',
        label: 'Ambassadeur Argent Actif (+10 pts Bonus)',
        points: 10,
        maxPoints: 25,
        description: `${ambassador.referralCount} confrères parrainés. Score augmenté de +10 pts et plafond d'aide porté à 40 000 FCFA.`,
        status: 'warn',
        actionPrompt: 'Inviter un collègue (+10 pts)',
        actionType: 'referrals',
      });
    } else if (ambassador.referralCount === 1) {
      criteria.push({
        id: 'referrals',
        label: 'Bouche-à-Oreille Initié (+5 pts Bonus)',
        points: 5,
        maxPoints: 25,
        description: '1 confrère parrainé. Parrainez encore 1 collègue pour atteindre le palier Argent (+10 pts) !',
        status: 'warn',
        actionPrompt: 'Partager mon code WhatsApp',
        actionType: 'referrals',
      });
    } else {
      criteria.push({
        id: 'referrals',
        label: 'Bouche-à-Oreille & Parrainage (0/25 pts)',
        points: 0,
        maxPoints: 25,
        description: 'Faites découvrir Liencolis à vos collègues pour faire grimper immédiatement votre éligibilité de +10 à +25 pts et étendre votre plafond d’aide !',
        status: 'fail',
        actionPrompt: 'Faire grimper mon éligibilité',
        actionType: 'referrals',
      });
    }

    // Le score total inclut le bonus d'ambassadeur plafonné à 100
    const score = Math.min(100, baseScore + ambassador.bonusAidScore);

    const isEligible = score >= 70;
    let tier: 'gold' | 'silver' | 'bronze' | 'ineligible' = 'ineligible';
    if (score >= 90) tier = 'gold';
    else if (score >= 75) tier = 'silver';
    else if (score >= 70) tier = 'bronze';

    return { score, isEligible, tier, criteria, ambassador };
  };

  const eligibility = calculateEligibility(currentUser);

  // Quick Action for Referral
  const handleCopyCode = () => {
    navigator.clipboard.writeText(eligibility.ambassador.referralCode);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const handleShareWhatsApp = (target: 'driver' | 'client' | 'business' = 'driver') => {
    let msg = eligibility.ambassador.whatsappInviteText;
    if (target === 'client') {
      msg = eligibility.ambassador.whatsappClientInviteText;
    } else if (target === 'business') {
      msg = eligibility.ambassador.whatsappBusinessInviteText;
    }
    referralService.shareOnWhatsApp(msg);

    // Record share and grant/update Privileged Subscriber status
    const res = referralService.recordShareAction(target);
    if (res.updatedUser) {
      if (res.wasPromoted) {
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
        setFeedbackMessage({
          type: 'success',
          text: `⭐ FÉLICITATIONS ! Votre badge "Abonné Privilégié" est activé ! En cas de demande de livreur, vos courses seront traitées en priorité par les chauffeurs disponibles.`,
        });
        notificationService.sendPushNotification({
          type: 'recruitment',
          title: '⭐ Badge Abonné Privilégié Débloqué !',
          body: 'Merci pour votre partage. Vos prochaines demandes de livreurs sur Liencolis seront prioritaires !',
        });
      }
    }
  };

  const handleSimulateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const colleagueName = colleagueInviteInput.trim() || 'Confrère Chauffeur Cotonou';
    if (!currentUser) return;

    const success = referralService.registerReferral(eligibility.ambassador.referralCode, colleagueName);
    if (success) {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
      setColleagueInviteInput('');
      setFeedbackMessage({
        type: 'success',
        text: `🎉 Super ! Le parrainage de "${colleagueName}" a été validé. Votre score d'aide financière et votre plafond d'avance ont grimpé !`,
      });
      notificationService.sendPushNotification({
        type: 'recruitment',
        title: '📈 Éligibilité Aide Financière Boostée !',
        body: `Grâce à votre parrainage de ${colleagueName}, vos points d’éligibilité à la caisse de solidarité viennent d’augmenter.`,
      });
    }
  };

  // Handler for Submitting an Emergency Aid Request
  const handleSubmitAidRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim() || !requestedAmount) return;

    const amountNum = parseInt(requestedAmount) || 5000;
    const driverPhoneNum = momoNumber.trim() || currentUser?.phone || '+229 01 69 81 46 31';

    const newReq: AidRequest = {
      id: `aid_${Date.now()}`,
      driverId: currentUser?.id || 'usr_driver_01',
      driverName: currentUser?.name || 'Chauffeur Liencolis',
      driverPhone: driverPhoneNum,
      driverCity: incidentCity,
      incidentType,
      description: incidentDesc.trim(),
      requestedAmount: amountNum,
      status: 'pending',
      eligibilityScore: eligibility.score,
      referralCountAtRequest: eligibility.ambassador.referralCount,
      isAmbassadorPriority: eligibility.ambassador.isFastTrackPriority,
      repaymentStatus: 'in_progress',
      adminNotes: eligibility.ambassador.isFastTrackPriority
        ? '⚡ DOSSIER PRIORITAIRE COUPE-FILE (Super Ambassadeur). Déblocage express MTN MoMo sous 30 min.'
        : 'Dossier d’aide financière reçu. Déblocage express via MTN MoMo / Moov Money après validation.',
      createdAt: new Date().toISOString(),
    };

    onAddAidRequest(newReq);
    setShowApplyModal(false);
    setIncidentDesc('');

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setFeedbackMessage({
      type: 'success',
      text: `Votre demande d’aide de ${amountNum.toLocaleString()} FCFA a été soumise avec succès. Traitement prioritaire en cours.`,
    });

    notificationService.sendPushNotification({
      type: 'recruitment',
      title: '🚨 Demande d’Aide Financière Transmise',
      body: `Dossier #${newReq.id} de ${amountNum.toLocaleString()} FCFA transmis à la caisse de secours.`,
    });
    notificationService.speak(`Votre demande d'aide financière de ${amountNum} Francs CFA a été transmise.`);
  };

  // Static Community Indicators
  const totalAidesDisbursed = 340000;
  const totalChauffeursSecourus = aidRequests.length + 19;
  const tauxRecouvrement = 99.4;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Banner - Aides Financières Liencolis */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 p-4 sm:p-6 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-400">
                <HeartHandshake className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Aides Financières & Caisse de Secours Chauffeurs
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  Avances de Secours 0% Intérêt
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Fonds d’assistance d’urgence et avances sans intérêt pour les chauffeurs et livreurs en difficulté.
                Déblocage rapide sur Mobile Money (MTN / Moov) pour pannes mécaniques, pièces, accidents ou frais de santé.
              </p>
            </div>
          </div>

          {/* Quick Action in Banner */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowApplyModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Demander une Aide Financière</span>
            </button>
          </div>
        </div>

        {/* Community Key Indicators (Micro-Bar) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Aides Déjà Débloquées</p>
              <p className="text-xs sm:text-sm font-black text-rose-300 font-mono">
                {totalAidesDisbursed.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Chauffeurs Secourus</p>
              <p className="text-xs sm:text-sm font-black text-blue-300 font-mono">
                {totalChauffeursSecourus} dossiers
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Taux de Remboursement</p>
              <p className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                {tauxRecouvrement}% sans agios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'emergency', label: 'Demandes d’Aide & Avances (0%)', icon: HeartPulse, badge: aidRequests.length },
          { id: 'eligibility', label: 'Conditions d’Éligibilité & Barème', icon: Activity, score: `${eligibility.score}%` },
          { id: 'ambassador', label: 'Bouche-à-Oreille & Parrainage Chauffeur', icon: Gift, score: `+${eligibility.ambassador.bonusAidScore} pts` },
          { id: 'rules', label: 'Règlement & Conditions d’Octroi', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-rose-300 border border-rose-400/40 shadow-sm ring-1 ring-rose-400/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                  {tab.badge}
                </span>
              )}
              {tab.score && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    tab.id === 'ambassador'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : eligibility.isEligible
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {tab.score}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: Demandes d'Aide & Avances (0%) */}
      {activeSubTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Solliciter une aide financière (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Formuler une Demande d'Aide</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Taux 0% • Zéro Agios
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1.5 text-xs">
                <p className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assistance Financière Directe</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  En cas d'imprévu (panne mécanique en livraison, crevaison, accident, achat urgent de pièces ou frais médicaux),
                  sollicitez une avance immédiate versée sur votre numéro Mobile Money.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Demander une Aide Financière (Dès 5 000 FCFA • Plafond : {eligibility.ambassador.maxAidCeilingFcfa.toLocaleString()} F)</span>
              </button>

              {/* Bouche-à-Oreille Quick-Callout */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bouche-à-Oreille Chauffeur</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold">
                    +{eligibility.ambassador.bonusAidScore} pts ajoutés
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Parrainez vos collègues livreurs (zéro argent en cash) : votre note d'éligibilité grimpe immédiatement et votre avance passe de 5 000 F jusqu'à 80 000 FCFA ! Pour particuliers et entreprises, le partage est 100% gratuit et bénévole.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('ambassador')}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award className="w-3 h-3" />
                  <span>Partager mon Code Parrain ({eligibility.ambassador.referralCode})</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] text-slate-300">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Principes de Remboursement Solidaire :</span>
                </p>
                <ul className="space-y-1 text-slate-400 pl-1">
                  <li>• Aucun intérêt, aucune garantie matérielle exigée (0%).</li>
                  <li>• Remboursement progressif par prélèvement de 10% sur les courses futures.</li>
                  <li>• Déblocage express sous 30 minutes après examen administratif.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Historical Requests (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dossiers d'Aide Soumis & Statut de Déblocage</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{aidRequests.length} dossiers</span>
              </div>

              <div className="space-y-2.5">
                {aidRequests.map((req, idx) => {
                  const statusConfig = {
                    pending: { label: 'En étude prioritaire', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock },
                    approved: { label: 'Accordé par Direction', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: CheckCircle2 },
                    disbursed: { label: 'Fonds Versé MoMo', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold', icon: Zap },
                    rejected: { label: 'Non retenu', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: XCircle },
                  };

                  const curStatus = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = curStatus.icon;

                  const incidentLabels: Record<string, string> = {
                    breakdown: 'Panne Moto',
                    accident: 'Accident Circulation',
                    spare_parts: 'Pièces de Rechange',
                    health_emergency: 'Urgence Santé',
                    other: 'Autre Secours',
                  };

                  return (
                    <div
                      key={req.id || idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{req.driverName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({req.driverCity})</span>
                          <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                            {incidentLabels[req.incidentType] || req.incidentType}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${curStatus.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          <span>{curStatus.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">
                          Montant sollicité : <strong className="text-amber-400 font-bold">{req.requestedAmount.toLocaleString()} FCFA</strong>
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                        "{req.description}"
                      </p>

                      {req.adminNotes && (
                        <div className="text-[10px] text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-800/30 flex items-start gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Décision Caisse :</strong> {req.adminNotes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {aidRequests.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                    <HeartHandshake className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="font-bold text-slate-400">Aucune demande de secours enregistrée pour le moment.</p>
                    <p className="text-[11px]">En cas d'imprévu sur la route, soumettez votre dossier en 1 minute.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Conditions d'Éligibilité & Barème */}
      {activeSubTab === 'eligibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Score Gauges & Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Votre Score d’Éligibilité</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                    eligibility.isEligible
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {eligibility.score}% • {eligibility.isEligible ? 'Éligible' : 'Non Éligible'}
                </span>
              </div>

              {/* Big Score Visual Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl bg-slate-900 border-2 border-emerald-500/50 shadow-inner">
                  <span className="font-mono font-black text-lg text-emerald-400">{eligibility.score}%</span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white text-xs">
                    {eligibility.isEligible
                      ? 'Profil Conforme pour Déblocage d’Aide'
                      : 'Conditions incomplètes pour déblocage immédiat'}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Seuil minimal d’octroi : <strong className="text-white">70%</strong>. Ce seuil garantit l’équité et la pérennité du fonds de secours pour tous les chauffeurs.
                  </p>
                  <div className="pt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        eligibility.tier === 'gold'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                          : eligibility.tier === 'silver'
                          ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                          : eligibility.tier === 'bronze'
                          ? 'bg-amber-700/20 text-amber-300 border border-amber-700/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      Statut : {eligibility.tier.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions to Reach 100% */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Actions Recommandées :
                </span>
                {!currentUser?.isCertified && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-bold text-white text-[11px]">Faire valider mes pièces (+30 pts)</p>
                        <p className="text-[10px] text-slate-400">CIP, Permis de conduire ou CNI</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold">À faire</span>
                  </div>
                )}

                {(currentUser?.driverWallet?.balance || 0) < 0 && (
                  <button
                    onClick={() => onOpenPayment('wallet_deposit_1200')}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/40 flex items-center justify-between text-xs transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-bold text-white text-[11px]">Régulariser mon solde (+15 pts)</p>
                        <p className="text-[10px] text-slate-400">Apurer les arriérés de commission</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Criteria Checklist (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Barème des 5 Critères d’Éligibilité (100 Points)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Critères transparents et objectifs appliqués à chaque dossier.</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Total : 100 Pts</span>
              </div>

              <div className="space-y-2.5">
                {eligibility.criteria.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      item.status === 'pass'
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : item.status === 'warn'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {item.status === 'pass' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : item.status === 'warn' ? (
                            <Clock className="w-4 h-4 text-amber-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{item.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0 ${
                          item.status === 'pass'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.status === 'warn'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {item.points}/{item.maxPoints} pts
                      </span>
                    </div>

                    {item.actionPrompt && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Opportunité d'augmentation :</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.actionType === 'referrals') {
                              setActiveSubTab('ambassador');
                            } else if (item.actionType === 'wallet') {
                              onOpenPayment('wallet_deposit_1200');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-[10px] border border-amber-400/30 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{item.actionPrompt}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Programme de Parrainage & Éligibilité Aide Financière */}
      {activeSubTab === 'ambassador' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Hero Banner: Le Parrainage qui fait grimper l'aide financière */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-white">Programme Parrainage &amp; Bouche-à-Oreille Solidaire</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      100% Gratuit • Zéro Commission d'Argent
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      +{eligibility.ambassador.bonusAidScore} Pts au Score d'Aide
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Le parrainage ne distribue <strong>aucun argent en cash</strong>. Pour les livreurs, il fait grimper votre <strong>taux d'éligibilité</strong> et votre plafond d'avance de solidarité (5 000 à 80 000 F). Pour les <strong>particuliers et entreprises</strong>, le partage du lien est <strong>100% gratuit et bénévole</strong> pour soutenir le réseau local.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Votre Palier Solidaire</span>
                <span className="text-xs font-black text-amber-300 flex items-center justify-end gap-1 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{eligibility.ambassador.tierLabel}</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mt-0.5">
                  Plafond d'aide : {eligibility.ambassador.maxAidCeilingFcfa.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* CHARTE OFFICIELLE DU PARRAINAGE : ZÉRO ARGENT / 100% SOLIDAIRE */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Règle Officielle : Zéro Commission d'Argent • Recommandation Solidaire</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5" />
                    <span>Pour les Livreurs &amp; Chauffeurs :</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Pas d'argent distribué. Vos parrainages servent <strong>exclusivement à booster votre note d'éligibilité (+10 à +25 pts)</strong> et à débloquer votre <strong>plafond d'avance sans intérêt de 5 000 F à 80 000 FCFA</strong> avec coupe-file d'urgence.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Pour les Particuliers &amp; Entreprises (Badge Privilégié) :</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Pas d'argent en cash, mais un <strong>Badge d'Abonné Privilégié ⭐</strong> ! Dès que vous partagez le lien, vous débloquez ce statut exclusif : <strong>en cas de demande de livreur, vos courses sont prioritaires</strong> et traitées en premier par les chauffeurs disponibles.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar to next tier */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Progression vers le palier supérieur ({eligibility.ambassador.nextTierProgress.nextTierName}) :
                </span>
                <span className="font-bold text-amber-400 font-mono">
                  {eligibility.ambassador.referralCount} collègue(s) parrainé(s)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${eligibility.ambassador.nextTierProgress.percentComplete}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {eligibility.ambassador.nextTierProgress.referralsNeeded > 0
                  ? `Plus que ${eligibility.ambassador.nextTierProgress.referralsNeeded} parrainage(s) pour débloquer le palier ${eligibility.ambassador.nextTierProgress.nextTierName} et faire grimper votre note d'aide !`
                  : 'Félicitations ! Vous avez atteint le palier maximal Diamant avec coupe-file prioritaire garanti.'}
              </p>
            </div>
          </div>

          {/* Grid: Code Partage + Simulation & Formulaire */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Col (5 cols): Votre Code & Partage WhatsApp */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>Votre Code Parrain Solidaire</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">À communiquer à vos collègues, clients ou partenaires.</p>
                </div>

                {/* Big Code Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-400/30 text-center space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Code de Parrainage
                  </span>
                  <div className="text-2xl font-black font-mono tracking-widest text-amber-400 py-1 bg-amber-400/10 rounded-lg border border-amber-400/20">
                    {eligibility.ambassador.referralCode}
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCodeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCodeCopied ? 'Code Copié !' : 'Copier le Code'}</span>
                    </button>
                  </div>

                  {/* Badge d'Abonné Privilégié Indicator */}
                  {eligibility.ambassador.isPrivilegedSubscriber ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-left">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[11px] font-black text-amber-300 block">
                          {eligibility.ambassador.privilegedBadgeLabel}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          Priorité de traitement accordée lors de vos demandes de livreur ({eligibility.ambassador.clientSharesCount} partage(s)).
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 text-left flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Partagez le lien ci-dessous pour débloquer votre <strong>Badge d'Abonné Privilégié</strong> !</span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Share Options (Livreurs, Particuliers, Entreprises) */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Partager sur WhatsApp (3 Formats Disponibles) :
                  </span>

                  {/* 1. Vers Confrère Livreur */}
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp('driver')}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-between gap-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-emerald-200" />
                      <span className="text-left">
                        <span className="block font-black">1. Inviter un Confrère Livreur</span>
                        <span className="text-[10px] text-emerald-100 font-normal">Booste votre éligibilité d'aide solidaire</span>
                      </span>
                    </div>
                    <Share2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  </button>

                  {/* 2. Vers Particulier / Client (Gratuit, 0 F d'argent) */}
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp('client')}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 flex items-center justify-between gap-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span className="text-left">
                        <span className="block font-black text-amber-300">2. Partager aux Particuliers (Amis/Famille)</span>
                        <span className="text-[10px] text-slate-400 font-normal">100% Gratuit • Recommander un coursier sérieux</span>
                      </span>
                    </div>
                    <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {/* 3. Vers Entreprise / Boutique (Gratuit, 0 F d'argent) */}
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp('business')}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 flex items-center justify-between gap-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span className="text-left">
                        <span className="block font-black text-blue-300">3. Partager aux Entreprises &amp; Boutiques</span>
                        <span className="text-[10px] text-slate-400 font-normal">100% Gratuit • Pour expédier leurs commandes</span>
                      </span>
                    </div>
                    <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>

                {/* Enregistrer un parrainage réussi en direct */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Enregistrer un Confrère Livreur Invité :
                  </span>
                  <form onSubmit={handleSimulateReferral} className="space-y-2">
                    <input
                      type="text"
                      value={colleagueInviteInput}
                      onChange={(e) => setColleagueInviteInput(e.target.value)}
                      placeholder="Nom ou Numéro du confrère invité..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Valider &amp; Faire Grimper Mon Éligibilité</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Col (7 cols): Barème des 4 Paliers Solidaires */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Barème des 4 Paliers de Parrainage &amp; Impact Aide</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Plus vous faites grandir la famille Liencolis, plus la communauté vous soutient financièrement.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      tier: 'bronze',
                      label: 'Palier 1 : Ambassadeur Débutant',
                      condition: '0 à 1 confrère parrainé',
                      scoreBonus: '+0 pt',
                      ceiling: '5 000 à 25 000 FCFA',
                      delay: 'Délai standard 72h',
                      color: 'border-slate-800 bg-slate-950',
                      isActive: eligibility.ambassador.tier === 'bronze',
                    },
                    {
                      tier: 'silver',
                      label: 'Palier 2 : Ambassadeur Argent',
                      condition: '2 à 3 confrères parrainés',
                      scoreBonus: '+10 pts d’aide',
                      ceiling: '5 000 à 40 000 FCFA (+15 000 F)',
                      delay: 'Traitement sous 48h',
                      color: 'border-slate-600 bg-slate-900/60',
                      isActive: eligibility.ambassador.tier === 'silver',
                    },
                    {
                      tier: 'gold',
                      label: 'Palier 3 : Ambassadeur Or (Leader)',
                      condition: '4 à 6 confrères parrainés',
                      scoreBonus: '+20 pts d’aide',
                      ceiling: '5 000 à 60 000 FCFA (+35 000 F)',
                      delay: 'Traitement express sous 24h',
                      color: 'border-amber-500/40 bg-amber-950/20',
                      isActive: eligibility.ambassador.tier === 'gold',
                    },
                    {
                      tier: 'diamond',
                      label: 'Palier 4 : Pilier Diamant Réseau',
                      condition: '7+ confrères parrainés',
                      scoreBonus: '+25 pts d’aide (Max)',
                      ceiling: '5 000 à 80 000 FCFA (+55 000 F)',
                      delay: '⚡ COUPE-FILE PRIORITAIRE (30 min)',
                      color: 'border-emerald-500/40 bg-emerald-950/20',
                      isActive: eligibility.ambassador.tier === 'diamond',
                    },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all text-xs ${p.color} ${
                        p.isActive ? 'ring-2 ring-amber-400 shadow-md' : 'opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white text-xs">{p.label}</p>
                            {p.isActive && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                                Actuel
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.condition}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-amber-400 text-xs block">{p.scoreBonus}</span>
                          <span className="text-[10px] text-emerald-400 font-bold block">Plafond : {p.ceiling}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Vitesse déblocage : <strong className="text-slate-200">{p.delay}</strong></span>
                        <span>Avance à taux 0%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Règlement & Conditions d'Octroi */}
      {activeSubTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Règlement Intérieur & Conditions d’Octroi des Aides</h2>
              <p className="text-[11px] text-slate-400">Les 4 règles d'or garantissant la pérennité et la justice du fonds.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <h3 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <span>1. Taux d'Intérêt Strictement Nul (0%)</span>
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Toutes les avances consenties par la caisse de secours sont des prêts d'honneur à 0% d'intérêt. Aucun frais de dossier,
                aucun agio, aucun coût caché n'est appliqué.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <h3 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                <span>2. Déblocage Express Mobile Money</span>
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dès validation administrative, les fonds sont immédiatement transférés sur le compte MTN MoMo ou Moov Money
                du chauffeur sans qu'il n'ait à se déplacer.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <h3 className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                <span>3. Remboursement Doux sur les Livraisons</span>
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Le remboursement s'effectue automatiquement par prélèvement progressif de 10% sur les commissions de chaque
                livraison future effectuée jusqu'à extinction de la dette.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <h3 className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                <span>4. Protection en Cas d'Immobilisation</span>
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Si un accident ou un problème de santé empêche le chauffeur de rouler, les échéances sont suspendues sans pénalité
                jusqu'à sa reprise d'activité.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-slate-200">
                La communauté Liencolis protège ses chauffeurs et assure la continuité de leur activité.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 shrink-0">
              Règlement Approuvé ✓
            </span>
          </div>
        </div>
      )}

      {/* MODAL: Formulaire de Demande d'Aide Financière */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Demande d’Aide Financière (Avance 0%)</h3>
                  <p className="text-[10px] text-slate-400">Fonds de secours et d'assistance d'urgence aux chauffeurs</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAidRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Sélectionnez le Motif de l'Aide :</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'breakdown', label: 'Panne Moto', icon: Wrench, color: 'text-amber-400' },
                    { id: 'accident', label: 'Accident', icon: Ambulance, color: 'text-rose-400' },
                    { id: 'spare_parts', label: 'Pièces Usure', icon: Sparkles, color: 'text-blue-400' },
                    { id: 'health_emergency', label: 'Urgence Santé', icon: HeartPulse, color: 'text-emerald-400' },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = incidentType === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setIncidentType(item.id as any)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 text-white font-bold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ItemIcon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ambassador Bonus Status in Modal */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">
                    Statut {eligibility.ambassador.tierLabel} : +{eligibility.ambassador.bonusAidScore} pts bonus
                  </span>
                </div>
                <span className="font-black text-amber-200 font-mono">
                  Plafond max : {eligibility.ambassador.maxAidCeilingFcfa.toLocaleString()} FCFA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Montant Requis (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="5000"
                    max={eligibility.ambassador.maxAidCeilingFcfa}
                    step="1000"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[5000, 10000, 15000, 20000, 25000, 40000, 60000, 80000]
                      .filter((amt) => amt <= eligibility.ambassador.maxAidCeilingFcfa)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setRequestedAmount(amt.toString())}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                            parseInt(requestedAmount) === amt
                              ? 'bg-rose-500 text-white font-black ring-1 ring-rose-400 shadow'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {amt >= 1000 ? `${amt / 1000}k` : amt}F {amt === 5000 ? '★ Base' : ''}
                        </button>
                      ))}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    Aide accessible dès 5 000 FCFA (plafond jusqu'à {eligibility.ambassador.maxAidCeilingFcfa.toLocaleString()} FCFA à taux 0%)
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ville de la Panne *</label>
                  <input
                    type="text"
                    required
                    value={incidentCity}
                    onChange={(e) => setIncidentCity(e.target.value)}
                    placeholder="Ex: Cotonou, Calavi, Porto-Novo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Description & Circonstances du Problème *</label>
                <textarea
                  required
                  rows={2}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Ex: Câble d'embrayage sectionné au carrefour Vèdoko en pleine livraison, besoin de réparation immédiate..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Numéro Mobile Money de Réception (MTN / Moov) *</label>
                <input
                  type="tel"
                  required
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  placeholder="+229 01 69 81 46 31"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Chauffeur Demandeur :</span>
                  <span>{currentUser?.name || 'Chauffeur Liencolis'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Score d'éligibilité actuel :</span>
                  <span className={`font-bold ${eligibility.isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {eligibility.score}% ({eligibility.isEligible ? 'Éligible' : 'Examen manuel'})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black text-xs shadow-md hover:from-rose-400 hover:to-amber-400"
                >
                  {isSubmittingAction ? 'Envoi...' : 'Transmettre le Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
