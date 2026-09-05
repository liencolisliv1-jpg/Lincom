import React, { useState } from 'react';
import { UserProfile, UserRole, PricingPlan, PaymentProvider, PaymentPurpose } from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { ALL_COUNTRIES, SUPPORTED_CURRENCIES, getCountryByCode } from '../constants/countries';
import { CameraCaptureModal } from './CameraCaptureModal';
import { notificationService } from '../services/notificationService';
import { themeService } from '../services/themeService';
import { storageService } from '../services/storageService';
import { calculateDeliveryCommission, WALLET_DEPOSIT_PRESETS } from '../utils/pricingCalculator';
import { ThemeSwitcher } from './ThemeSwitcher';
import confetti from 'canvas-confetti';
import {
  User,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Mail,
  Phone,
  MapPin,
  Bike,
  Star,
  Award,
  Upload,
  FileCheck,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  CreditCard,
  Building,
  Image as ImageIcon,
  Wallet,
  ArrowDownRight,
  Zap,
  Calculator,
  Percent,
  PlusCircle,
  History,
  TrendingDown,
  Info,
  Check,
  Key,
  RefreshCw,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteAccount: () => void;
  onOpenPayment: (purpose?: PaymentPurpose) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onDeleteAccount,
  onOpenPayment,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCountryCode, setEditCountryCode] = useState(currentUser?.countryCode || 'BJ');
  const [editCity, setEditCity] = useState(currentUser?.city || 'Cotonou');
  const [customEditCity, setCustomEditCity] = useState('');
  const [editCurrency, setEditCurrency] = useState(currentUser?.currencyPreference || 'FCFA');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '+229 01 69 81 46 31');
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  // KYC States (Drivers only)
  const [docType, setDocType] = useState(currentUser?.idDocumentType || 'cip_nip');
  const [frontPhoto, setFrontPhoto] = useState(currentUser?.idDocumentFrontUrl || currentUser?.idDocumentUrl || '');
  const [backPhoto, setBackPhoto] = useState(currentUser?.idDocumentBackUrl || '');
  const [kycSubmitted, setKycSubmitted] = useState(currentUser?.isCertified || !!currentUser?.kycSubmittedAt);

  // Camera capture modal state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'avatar' | 'doc_front' | 'doc_back'>('avatar');

  // Simulator state for commission
  const [simulatedCourseFee, setSimulatedCourseFee] = useState<number>(1500);

  // Instant Withdrawal Mobile Money State
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawProvider, setWithdrawProvider] = useState<PaymentProvider>('fedapay');
  const [securityPinInput, setSecurityPinInput] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState('');

  // PIN Management state
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const isDriver = currentUser.role === 'driver';
  const driverWallet = currentUser.driverWallet || {
    balance: 1200,
    pricingPlan: currentUser.pricingPlan || 'commission',
    totalCommissionsPaid: 0,
    totalDeposited: 1200,
    transactions: [],
    securityPin: currentUser.walletSecurityPin || '1234',
  };
  const currentPlan: PricingPlan = currentUser.pricingPlan || driverWallet.pricingPlan || 'commission';
  const isMuted = isDriver && storageService.isDriverMuted(currentUser);
  const activeLock = storageService.getActiveDeliveryLock(currentUser.id);

  const handleSelectPlan = (plan: PricingPlan) => {
    const updated = storageService.setPricingPlan(plan);
    onUpdateUser(updated);
    notificationService.sendPushNotification({
      type: 'system_alert',
      title: plan === 'subscription' ? '👑 FORMULE ABONNEMENT ACTIVÉE' : '💰 FORMULE COMMISSION ACTIVÉE',
      body: plan === 'subscription'
        ? 'Vous profitez de 0% de commission sur toutes vos livraisons !'
        : 'Prélèvement automatique de 5% à 20% uniquement sur les livraisons issues des annonces.',
    });
    notificationService.speak(
      plan === 'subscription'
        ? 'Formule Abonnement activée. Zéro pour cent de commission sur vos courses.'
        : 'Formule Commission activée avec prélèvement sur votre portefeuille.'
    );
  };

  const simResult = calculateDeliveryCommission(simulatedCourseFee, true, currentPlan);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      alert('Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }
    const updated = storageService.setWalletSecurityPin(newPin);
    onUpdateUser(updated);
    setPinChangeSuccess(true);
    setTimeout(() => {
      setPinChangeSuccess(false);
      setShowPinModal(false);
      setNewPin('');
    }, 1200);
  };

  const handleInstantWithdrawalOrRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg('');
    setWithdrawSuccessMsg('');

    // Check Active Delivery Escrow Lock
    if (activeLock.isLocked) {
      setWithdrawErrorMsg(
        `🔒 ACCÈS RETRAIT BLOQUÉ TEMPORAIREMENT : Une livraison (#${activeLock.activeDelivery?.trackingCode}) est en cours. Vos fonds restent protégés sous séquestre. Dès réception et validation du code PIN par le client, l'accès au retrait revient automatiquement.`
      );
      notificationService.speak("Retrait bloqué temporairement : vous avez une course active en cours d'acheminement.");
      return;
    }

    const amount = parseInt(withdrawAmount) || 0;
    if (amount <= 0) {
      setWithdrawErrorMsg('Veuillez saisir un montant supérieur à 0 FCFA.');
      return;
    }

    setIsWithdrawing(true);

    setTimeout(() => {
      const res = storageService.refundDeposit(amount, withdrawProvider, securityPinInput);
      setIsWithdrawing(false);

      if (!res.success) {
        setWithdrawErrorMsg(res.message);
        notificationService.speak(res.message);
      } else {
        onUpdateUser(res.updatedUser);
        setWithdrawSuccessMsg(res.message);
        setSecurityPinInput('');
        confetti({ particleCount: 80, spread: 70 });

        const provName = withdrawProvider === 'fedapay' ? 'FedaPay' : withdrawProvider === 'mtn_momo' ? 'MTN MoMo' : withdrawProvider === 'moov_money' ? 'Moov Money' : 'Celtiis Cash';
        notificationService.sendPushNotification({
          type: 'aid_approved',
          title: `💰 RETOUR DE DÉPÔT / RETRAIT EFFECTUÉ`,
          body: `${amount.toLocaleString()} FCFA transférés vers votre compte ${provName} (${currentUser.phone}). Réf: ${res.transaction?.reference}`,
        });
        notificationService.speak(`Virement de ${amount} Francs CFA retourné avec succès sur votre compte ${provName}.`);
      }
    }, 1200);
  };

  const handleQuickRefundDeposit = (amount: number, provider: PaymentProvider = 'mtn_momo') => {
    if (activeLock.isLocked) {
      alert(
        `🔒 Retrait impossible : ${activeLock.reason}\n\nL'accès au retrait sera réactivé automatiquement dès que le client aura validé la livraison avec le code PIN.`
      );
      return;
    }

    const pin = prompt(`Entrez votre code secret PIN de sécurité à 4 chiffres (défaut : 1234) pour confirmer le retour de ${amount.toLocaleString()} FCFA vers votre numéro :`);
    if (!pin) return;

    const res = storageService.refundDeposit(amount, provider, pin);
    if (!res.success) {
      alert(`Erreur : ${res.message}`);
    } else {
      onUpdateUser(res.updatedUser);
      alert(`✅ ${res.message}`);
      confetti({ particleCount: 60, spread: 60 });
    }
  };

  const handleOpenPhotoCapture = (target: 'avatar' | 'doc_front' | 'doc_back') => {
    setCameraTarget(target);
    setCameraModalOpen(true);
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    if (cameraTarget === 'avatar') {
      setAvatarUrl(photoDataUrl);
      const updated: UserProfile = {
        ...currentUser,
        avatarUrl: photoDataUrl,
      };
      onUpdateUser(updated);
    } else if (cameraTarget === 'doc_front') {
      setFrontPhoto(photoDataUrl);
    } else if (cameraTarget === 'doc_back') {
      setBackPhoto(photoDataUrl);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const countryInfo = getCountryByCode(editCountryCode);
    const effectiveCity = customEditCity.trim() ? customEditCity.trim() : editCity;

    const updated: UserProfile = {
      ...currentUser,
      name: editName || currentUser.name,
      country: countryInfo.name,
      countryCode: countryInfo.code,
      currencyPreference: editCurrency,
      city: effectiveCity,
      phone: editPhone,
      avatarUrl: avatarUrl || currentUser.avatarUrl,
    };
    onUpdateUser(updated);
    setIsEditing(false);
  };

  const handleSubmitKYC = () => {
    if (!frontPhoto) {
      alert('Veuillez au minimum prendre la photo de la face avant de votre pièce d’identité.');
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      isCertified: true,
      idDocumentType: docType as any,
      idDocumentFrontUrl: frontPhoto,
      idDocumentBackUrl: backPhoto,
      idDocumentUrl: frontPhoto,
      kycSubmittedAt: new Date().toISOString(),
      kycStatus: 'approved',
    };
    onUpdateUser(updated);
    setKycSubmitted(true);
    confetti({ particleCount: 90, spread: 75 });
    notificationService.speak("Félicitations ! Vos documents d'identité ont été vérifiés avec succès. Votre profil livreur est certifié.");
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'driver': return 'Livreur Professionnel Bénin';
      case 'merchant': return 'E-Commerçant / Restaurant';
      case 'client': return 'Particulier / Expéditeur';
      case 'admin': return 'Administrateur Liencolis';
      default: return 'Utilisateur Liencolis';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto scrollbar-thin text-slate-100">
        
        {/* Header with Avatar & Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar Photo with Camera Overlay */}
            <div className="relative group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-emerald-500 p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
                {avatarUrl || currentUser.avatarUrl ? (
                  <img
                    src={avatarUrl || currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover object-center rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-amber-400">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenPhotoCapture('avatar')}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-slate-900 border border-amber-400 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md"
                title="Changer ma photo de profil (Caméra / Galerie)"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-black text-white">{currentUser.name}</h3>
                {currentUser.isCertified && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Certifié</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-400 font-medium">
                {getRoleLabel(currentUser.role)} • 📍 {currentUser.city}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            ✕
          </button>
        </div>

        {/* Profile Photo update prompt for all users */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Photo de Profil du Compte</p>
              <p className="text-[11px] text-slate-400">Visible sur vos commandes, courses et discussions</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenPhotoCapture('avatar')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-colors shrink-0"
          >
            {avatarUrl ? 'Changer Photo' : 'Prendre Photo'}
          </button>
        </div>

        {/* Driver Stats Grid */}
        {isDriver && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <p className="text-slate-400 text-[10px]">Note Conducteur</p>
              <p className="text-base font-black text-amber-400 flex items-center justify-center gap-1">
                <span>{currentUser.rating || 4.9}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <p className="text-slate-400 text-[10px]">Courses Réussies</p>
              <p className="text-base font-black text-emerald-400">{currentUser.completedDeliveries || 386}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <p className="text-slate-400 text-[10px]">Formule Choisie</p>
              <p className="text-xs font-black text-amber-400 mt-1 capitalize">
                {currentPlan === 'subscription' ? 'Abonnement (0%)' : 'Commission'}
              </p>
            </div>
          </div>
        )}

        {/* CHOIX DU MODÈLE LIVREUR : ABONNEMENT OU COMMISSION SUR ANNONCES */}
        {isDriver && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs">Choix de la Formule de Tarification</h4>
                  <p className="text-[10px] text-slate-400">Basculez librement entre les 2 modèles économiques</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OFFICIEL BÉNIN
              </span>
            </div>

            {/* Plan selector buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Commission Plan */}
              <button
                type="button"
                onClick={() => handleSelectPlan('commission')}
                className={`p-3 rounded-xl text-left border transition-all relative ${
                  currentPlan === 'commission'
                    ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>1. Formule Commission</span>
                  </span>
                  {currentPlan === 'commission' && (
                    <span className="p-1 rounded-full bg-amber-400 text-slate-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-0.5 text-[10.5px]">
                  <p className="text-amber-300 font-bold font-mono">5% dès 1 000 F (+2% / tranche 250 F)</p>
                  <p className="text-slate-400">Plafonné à 20% max. Débité du compte lié.</p>
                  <p className="text-emerald-400 text-[10px] font-semibold">✓ Applicable uniquement sur livraisons par annonces</p>
                </div>
              </button>

              {/* Option 2: Subscription Plan */}
              <button
                type="button"
                onClick={() => handleSelectPlan('subscription')}
                className={`p-3 rounded-xl text-left border transition-all relative ${
                  currentPlan === 'subscription'
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>2. Formule Abonnement</span>
                  </span>
                  {currentPlan === 'subscription' && (
                    <span className="p-1 rounded-full bg-emerald-400 text-slate-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-0.5 text-[10.5px]">
                  <p className="text-emerald-300 font-bold font-mono">1 200 FCFA / mois (Illimité)</p>
                  <p className="text-slate-400">0% de commission sur toutes les courses.</p>
                  <p className="text-emerald-400 text-[10px] font-semibold">✓ 100% des gains vous reviennent directement</p>
                </div>
              </button>
            </div>

            {/* DRIVER WALLET BALANCE CARD (Solde lié au profil) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">Compte Portefeuille Lié au Profil</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Solde Prépayé Actuel :</span>
                  <span className={`text-base font-black font-mono ${isMuted ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                    {driverWallet.balance.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Sourdine Warning Banner if balance < 50 FCFA */}
              {isMuted ? (
                <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/60 flex items-start gap-2 text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-black text-red-300">⚠️ COMPTE EN SOURDINE (INACTIF)</p>
                    <p className="text-[10.5px] text-red-200 leading-snug">
                      Votre solde prépayé ({driverWallet.balance} FCFA) est inférieur au seuil critique de <strong>50 FCFA</strong>. L'accès aux nouvelles livraisons et annonces est mis en pause.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenPayment('wallet_deposit_1200')}
                      className="mt-1 px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10.5px] inline-flex items-center gap-1 shadow"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Recharger maintenant (min 250 F) pour réactiver</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compte Actif & En Ligne (Solde &ge; 50 FCFA)</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">Prêt pour livraisons</span>
                </div>
              )}

              {/* Quick Recharge presets (250 FCFA à 2500 FCFA) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                  <span>Recharger / Dépôt (250 F à 2 500 F) :</span>
                  <button
                    type="button"
                    onClick={() => onOpenPayment('wallet_deposit_1200')}
                    className="text-amber-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Autre montant</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {WALLET_DEPOSIT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => onOpenPayment(`wallet_deposit_${amt}` as PaymentPurpose)}
                      className="py-1.5 px-1 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-slate-700 text-center font-mono font-bold text-[10.5px] transition-all"
                      title={`Recharger ${amt} FCFA`}
                    >
                      {amt >= 1000 ? `${amt / 1000}k F` : `${amt} F`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* INTERACTIVE COMMISSION CALCULATOR & SIMULATOR */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-slate-200 text-xs">Simulateur de Commission sur Annonce</span>
                </div>
                <span className="text-[11px] font-mono font-black text-amber-400">
                  {simulatedCourseFee.toLocaleString()} FCFA
                </span>
              </div>

              <input
                type="range"
                min={500}
                max={3500}
                step={250}
                value={simulatedCourseFee}
                onChange={(e) => setSimulatedCourseFee(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />

              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>500 F (0%)</span>
                <span>1 000 F (5%)</span>
                <span>1 500 F (9%)</span>
                <span>2 000 F (13%)</span>
                <span>2 500 F (17%)</span>
                <span>3 000 F (20% Max)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Taux appliqué :</span>
                  <span className="font-mono font-bold text-amber-300">
                    {simResult.ratePercent}% ({simResult.commissionAmount.toLocaleString()} FCFA)
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Gain net reçu par le livreur :</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {simResult.netDriverPayout.toLocaleString()} FCFA
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 pt-0.5 border-t border-slate-800">
                  {simResult.breakdownText}
                </p>
              </div>
            </div>

            {/* WALLET TRANSACTIONS LOGS WITH QUICK REFUND OPTION */}
            {driverWallet.transactions && driverWallet.transactions.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Derniers Mouvements du Portefeuille</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {driverWallet.transactions.length} opération(s)
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {driverWallet.transactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[10.5px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1 rounded ${
                            tx.type === 'deposit'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : tx.type === 'refund'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {tx.type === 'deposit' ? (
                            <PlusCircle className="w-3 h-3" />
                          ) : tx.type === 'refund' ? (
                            <RefreshCw className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                        </span>
                        <div>
                          <p className="text-slate-200 font-medium truncate max-w-[180px]">{tx.description}</p>
                          <p className="text-[9px] text-slate-500 font-mono">
                            {new Date(tx.timestamp).toLocaleDateString('fr-FR')} • Solde : {tx.balanceAfter.toLocaleString()} F
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold ${
                            tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} F
                        </span>
                        {/* Quick Refund Button on Deposits if not locked */}
                        {tx.type === 'deposit' && (
                          <button
                            type="button"
                            onClick={() => handleQuickRefundDeposit(tx.amount, tx.provider || 'mtn_momo')}
                            disabled={activeLock.isLocked}
                            title={activeLock.isLocked ? "Verrouillé pendant la course" : "Demander le retour de ce dépôt"}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[9.5px] font-bold text-slate-300 border border-slate-700 hover:text-white transition-colors"
                          >
                            {activeLock.isLocked ? '🔒 Bloqué' : '↩️ Retourner'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY PIN & ESCROW FUND PROTECTION INFO */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">Sécurité & Protection des Fonds Chauffeur</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10.5px] border border-slate-700 flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  <span>Code PIN (••••)</span>
                </button>
              </div>

              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                🛡️ <strong>Garantie 100% Bénin :</strong> Tout dépôt effectué reste la propriété du livreur et peut être retourné à tout moment. Pendant une course active, les retraits sont mis sous séquestre temporaire pour sécuriser la livraison, puis débloqués automatiquement dès confirmation du client.
              </p>
            </div>
          </div>
        )}

        {/* Driver-Only Official KYC Certification Section */}
        {isDriver ? (
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/50 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-black text-white">Certification Livreur (KYC Obligatoire)</h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                  currentUser.isCertified
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {currentUser.isCertified ? 'Livreur Certifié ✓' : 'Documents en attente'}
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Pour garantir la sécurité des livraisons et accéder aux aides financières d'urgence, prenez en photo votre pièce d'identité officielle béninoise :
            </p>

            {/* Document Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Type de pièce acceptée :</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none"
              >
                <option value="cip_nip">Carte CIP / NIP (Certificat d'Identification Personnelle - ANIP)</option>
                <option value="cni">Carte Nationale d'Identité (CNI / CNIe Bénin)</option>
                <option value="permis">Permis de Conduire Béninois (Catégorie A Moto / B)</option>
                <option value="passport">Passeport Biométrique International</option>
              </select>
            </div>

            {/* Photos of Document (Front & Back) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Front Photo */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">Photo Face Avant (Recto) *</span>
                {frontPhoto ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-600 h-24 bg-slate-950 flex items-center justify-center">
                    <img src={frontPhoto} alt="Recto pièce" className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoCapture('doc_front')}
                      className="absolute bottom-1 right-1 p-1 bg-slate-900/90 rounded text-amber-300 text-[10px]"
                    >
                      Refaire
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoCapture('doc_front')}
                    className="w-full h-24 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-bold">Photo Recto</span>
                  </button>
                )}
              </div>

              {/* Back Photo */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">Photo Face Arrière (Verso)</span>
                {backPhoto ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-600 h-24 bg-slate-950 flex items-center justify-center">
                    <img src={backPhoto} alt="Verso pièce" className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoCapture('doc_back')}
                      className="absolute bottom-1 right-1 p-1 bg-slate-900/90 rounded text-amber-300 text-[10px]"
                    >
                      Refaire
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoCapture('doc_back')}
                    className="w-full h-24 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-bold">Photo Verso</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmitKYC}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Valider & Certifier mon Compte Livreur</span>
            </button>
          </div>
        ) : (
          /* Notice for clients / merchants */
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compte {getRoleLabel(currentUser.role)} Vérifié</span>
            </span>
            <p className="text-[11px] text-slate-300">
              Votre compte vous permet d'expédier et suivre des colis en direct, publier des annonces et commander des livraisons partout au Bénin.
            </p>
          </div>
        )}

        {/* Edit profile form (Phone & City) */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
            <h4 className="font-bold text-white">Modifier mes coordonnées</h4>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nom complet</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            {/* Country Selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pays de résidence & activité</label>
              <select
                value={editCountryCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setEditCountryCode(newCode);
                  const cInfo = getCountryByCode(newCode);
                  if (cInfo) {
                    setEditCity(cInfo.defaultCity);
                    setEditCurrency(cInfo.currency);
                    if (editPhone.startsWith('+')) {
                      setEditPhone(`${cInfo.dialCode} `);
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
              >
                {ALL_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode}) • {c.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Téléphone de contact</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Ville de résidence</label>
              {(() => {
                const cInfo = getCountryByCode(editCountryCode);
                const cityList = editCountryCode === 'BJ' ? BENIN_CITY_NAMES : cInfo.majorCities;
                return (
                  <div className="space-y-1.5">
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      {cityList.map((cityName) => (
                        <option key={cityName} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                      <option value="Autre Ville">Autre Ville (Saisie libre)</option>
                    </select>
                    {editCity === 'Autre Ville' && (
                      <input
                        type="text"
                        placeholder="Précisez votre ville..."
                        value={customEditCity}
                        onChange={(e) => setCustomEditCity(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/50 text-amber-200 text-xs"
                      />
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Devise d'affichage préférée</label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold"
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.flag} {cur.label} ({cur.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-bold"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-slate-400 text-[11px]">
                Pays : <span className="text-white font-bold">{currentUser.country || 'Bénin'} {currentUser.countryCode ? `(${currentUser.countryCode})` : '🇧🇯'}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Ville : <span className="text-white font-bold">{currentUser.city}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Téléphone : <span className="text-white font-mono font-bold">{currentUser.phone}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Devise préférée : <span className="text-amber-300 font-bold">{currentUser.currencyPreference || 'FCFA'}</span>
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs shrink-0"
            >
              Modifier
            </button>
          </div>
        )}

        {/* Automatic Mobile Money Direct Withdrawal / Deposit Refund Section */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-700/60 text-xs space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-white">Retrait & Retour de Dépôt Mobile Money</h4>
                <p className="text-[10px] text-slate-400">Virement automatique direct MTN, Moov et Celtiis</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              API SÉCURISÉE ⚡
            </span>
          </div>

          {/* ACTIVE DELIVERY ESCROW LOCK STATE */}
          {activeLock.isLocked ? (
            <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/70 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-black">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>RETRAITS ET RETOURS TEMPORAIREMENT SUSPENDUS</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Vous avez une livraison en cours (<strong>Colis #{activeLock.activeDelivery?.trackingCode}</strong> pour {activeLock.activeDelivery?.clientPseudo}).
                Pour sécuriser la marchandise et l'argent des deux parties, les fonds sont placés sous <strong>séquestre temporaire</strong>.
              </p>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-amber-600/40 text-[10.5px] font-mono text-amber-300 flex items-center justify-between">
                <span>Statut : Acheminement en cours</span>
                <span className="font-bold text-emerald-400">Déblocage auto au PIN client ✓</span>
              </div>
              <p className="text-[10px] text-slate-400">
                💡 <em>Dès que le client saisira son code PIN anti-vol à l'arrivée et validera la réception, votre accès au retrait et au retour de dépôt sera instantanément rétabli.</em>
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Effectuez un retrait de gains ou <strong>retournez votre dépôt non consommé</strong> à tout moment directement vers votre compte Mobile Money Bénin (<strong>{currentUser.phone}</strong>).
              </p>

              <form onSubmit={handleInstantWithdrawalOrRefund} className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Moyen Mobile Money</label>
                    <select
                      value={withdrawProvider}
                      onChange={(e) => setWithdrawProvider(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="fedapay">FedaPay Bénin (MTN, Moov, Celtiis, Carte)</option>
                      <option value="kkiapay">Kkiapay Bénin (MTN, Moov, Celtiis, Carte)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Montant (FCFA)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      max={driverWallet.balance || 50000}
                      step={50}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-bold font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Code PIN Secret (4 ch.)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={securityPinInput}
                      onChange={(e) => setSecurityPinInput(e.target.value)}
                      placeholder="•••• (défaut: 1234)"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isWithdrawing || (driverWallet.balance <= 0)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>
                    {isWithdrawing
                      ? 'Traitement sécurisé en cours...'
                      : driverWallet.balance <= 0
                      ? 'Solde insuffisant pour retrait'
                      : `Valider le Retrait / Retour de Dépôt vers ${currentUser.phone}`}
                  </span>
                </button>
              </form>
            </>
          )}

          {withdrawErrorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 font-bold text-[11px] leading-relaxed animate-in fade-in flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{withdrawErrorMsg}</span>
            </div>
          )}

          {withdrawSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-[11px] leading-relaxed animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{withdrawSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* PIN Management Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h4 className="font-black text-white text-xs">Code PIN Secret Chauffeur</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-300">
                Protégez vos gains et dépôts en définissant un code secret à 4 chiffres. (Code actuel par défaut : <strong>{currentUser.walletSecurityPin || '1234'}</strong>).
              </p>

              <form onSubmit={handleSavePin} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nouveau Code PIN (4 chiffres)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Ex: 5821"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono font-black text-lg text-amber-400 tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>

              {pinChangeSuccess && (
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-center text-xs font-bold">
                  ✓ Code PIN modifié avec succès !
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display & Night Driving Theme Preferences */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>Mode d'Affichage & Sécurité Conduite</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Basculez entre le Mode Jour (Clair), Nuit (Sombre) ou Auto (19h-06h).
            </p>
          </div>
          <ThemeSwitcher
            themeStatus={themeService.getThemeStatus()}
            onCycleThemeMode={() => {
              const current = themeService.getSavedMode();
              const next = current === 'auto' ? 'dark' : current === 'dark' ? 'light' : 'auto';
              themeService.setMode(next);
            }}
            onSetThemeMode={(mode) => themeService.setMode(mode)}
            variant="pill"
          />
        </div>

        {/* Account Deletion & Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte Liencolis ? Cette action est irréversible.')) {
                onDeleteAccount();
                onClose();
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer mon compte</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* Camera Capture Modal for profile photo or KYC documents */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        title={
          cameraTarget === 'avatar'
            ? 'Prendre ma Photo de Profil'
            : cameraTarget === 'doc_front'
            ? 'Photo Face Avant (Recto) de la Pièce'
            : 'Photo Face Arrière (Verso) de la Pièce'
        }
      />
    </div>
  );
};
