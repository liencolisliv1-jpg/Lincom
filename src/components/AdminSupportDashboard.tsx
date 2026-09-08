import React, { useState, useEffect } from 'react';
import { DailyAdministrativeSummary, Delivery, UserProfile, PaymentProvider, AidRequest } from '../types';
import { AdminAuthPanel } from './AdminAuthPanel';
import { SmtpBackofficePanel } from './SmtpBackofficePanel';
import { auth, onAuthStateChanged } from '../services/firebase';
import { firestoreService } from '../services/firestoreService';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Bot,
  Send,
  Mail,
  FileCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  UserCheck,
  Clock,
  RefreshCw,
  Database,
  CloudUpload,
  Wallet,
  Coins,
  ArrowUpRight,
  ShieldAlert,
  CreditCard,
  Building2,
  Lock,
  PlusCircle,
  History,
  Check,
  KeyRound,
  Key,
  Unlock,
  Rocket,
  Smartphone,
  ExternalLink,
  Copy,
  Sliders,
  Globe,
  Terminal,
  HeartHandshake,
  Zap,
  Phone,
  MapPin,
  User,
  Filter,
  Search,
  MessageSquare,
  AlertCircle,
  X,
  Wrench,
  Ambulance,
  HeartPulse,
  Layers,
} from 'lucide-react';

interface AdminSupportDashboardProps {
  currentUser: UserProfile | null;
  deliveries: Delivery[];
  adminSummaries: DailyAdministrativeSummary[];
  onAddAdminSummary: (sum: DailyAdministrativeSummary) => void;
  aidRequests?: AidRequest[];
  onUpdateAidRequest?: (req: AidRequest) => void;
  isDarkMode: boolean;
}

export const AdminSupportDashboard: React.FC<AdminSupportDashboardProps> = ({
  currentUser,
  deliveries,
  adminSummaries,
  onAddAdminSummary,
  aidRequests,
  onUpdateAidRequest,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'admin_panel' | 'aid_validation' | 'commissions_treasury' | 'firestore_database' | 'smtp_settings' | 'launch_checklist'>('admin_panel');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [firebaseAdminUser, setFirebaseAdminUser] = useState<any>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncSuccessMsg, setCloudSyncSuccessMsg] = useState<string | null>(null);

  // Platform Treasury State
  const [treasury, setTreasury] = useState(() => storageService.getPlatformTreasury());

  // Admin Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('25000');
  const [withdrawProvider, setWithdrawProvider] = useState<PaymentProvider | 'bank_transfer'>('fedapay');
  const [destinationAccount, setDestinationAccount] = useState('+229 00 00 00 00');
  const [withdrawReason, setWithdrawReason] = useState('Retrait de caisse commissions plateforme');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Admin Manual Credit Driver Form
  const [creditDriverInput, setCreditDriverInput] = useState('');
  const [creditAmountInput, setCreditAmountInput] = useState('1000');
  const [creditReasonInput, setCreditReasonInput] = useState('Recharge manuelle Administrateur');
  const [creditResultMsg, setCreditResultMsg] = useState<string | null>(null);

  // Owner Authentication State (PIN or Master Password)
  const [hasCredentials, setHasCredentials] = useState(() => storageService.hasAdminConfiguredCredentials());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [authInputType, setAuthInputType] = useState<'pin' | 'password'>('pin');
  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Initial Setup State (When no password/pin is defined yet)
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirmPin, setSetupConfirmPin] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

  const handleInitialSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (setupPin.length !== 4 || !/^\d{4}$/.test(setupPin)) {
      setSetupError('Le Code PIN secret doit comporter exactement 4 chiffres.');
      return;
    }
    if (setupPin !== setupConfirmPin) {
      setSetupError('La confirmation du Code PIN ne correspond pas.');
      return;
    }
    if (setupPassword.length < 6) {
      setSetupError('Le Mot de Passe Super-Admin doit comporter au moins 6 caractères.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setSetupError('La confirmation du Mot de Passe ne correspond pas.');
      return;
    }

    storageService.setAdminPin(setupPin);
    storageService.setAdminPassword(setupPassword);
    setHasCredentials(true);
    setSetupSuccess('Compte et identifiants administrateur configurés avec succès !');
    setTimeout(() => {
      setIsAdminUnlocked(true);
    }, 600);
  };

  // Change Security Modal State (PIN & Password)
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [securityModalTab, setSecurityModalTab] = useState<'pin' | 'password'>('pin');
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePinMsg, setChangePinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Hardening: Anti-Brute-Force & Temporary Lockout
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = sessionStorage.getItem('admin_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(() => {
    const savedLockUntil = sessionStorage.getItem('admin_lockout_until');
    if (savedLockUntil) {
      const diff = Math.ceil((parseInt(savedLockUntil, 10) - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return 0;
  });

  // Countdown timer for security lockout
  useEffect(() => {
    if (lockoutRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemainingSeconds((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('admin_lockout_until');
          sessionStorage.removeItem('admin_failed_attempts');
          setFailedAttempts(0);
          setPinError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemainingSeconds]);

  const recordFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    sessionStorage.setItem('admin_failed_attempts', String(nextAttempts));

    if (nextAttempts >= 5) {
      const lockUntil = Date.now() + 180 * 1000; // 3 minutes lockout
      sessionStorage.setItem('admin_lockout_until', String(lockUntil));
      setLockoutRemainingSeconds(180);
      setPinError('🚨 Bouclier Anti-Intrusion : 5 tentatives erronées consécutives. Clavier verrouillé pendant 3 minutes.');
    } else {
      const remaining = 5 - nextAttempts;
      setPinError(`🔒 Identifiants incorrects. Plus que ${remaining} tentative${remaining > 1 ? 's' : ''} avant blocage de sécurité temporaire.`);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (lockoutRemainingSeconds > 0) return;
    if (enteredPin.length < 4) {
      const updated = enteredPin + digit;
      setEnteredPin(updated);
      setPinError(null);
      if (updated.length === 4) {
        if (storageService.verifyAdminPin(updated)) {
          setIsAdminUnlocked(true);
          setEnteredPin('');
          setFailedAttempts(0);
          sessionStorage.removeItem('admin_failed_attempts');
          sessionStorage.removeItem('admin_lockout_until');
        } else {
          recordFailedAttempt();
          setEnteredPin('');
        }
      }
    }
  };

  const handleClearPin = () => {
    if (lockoutRemainingSeconds > 0) return;
    setEnteredPin('');
    setPinError(null);
  };

  const handleVerifyPin = () => {
    if (lockoutRemainingSeconds > 0) return;
    if (storageService.verifyAdminPin(enteredPin)) {
      setIsAdminUnlocked(true);
      setEnteredPin('');
      setPinError(null);
      setFailedAttempts(0);
      sessionStorage.removeItem('admin_failed_attempts');
      sessionStorage.removeItem('admin_lockout_until');
    } else {
      recordFailedAttempt();
      setEnteredPin('');
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSeconds > 0) return;
    if (!enteredPassword) {
      setPinError('Veuillez saisir le mot de passe propriétaire.');
      return;
    }
    if (storageService.verifyAdminPassword(enteredPassword) || storageService.verifyAdminPin(enteredPassword)) {
      setIsAdminUnlocked(true);
      setEnteredPassword('');
      setPinError(null);
      setFailedAttempts(0);
      sessionStorage.removeItem('admin_failed_attempts');
      sessionStorage.removeItem('admin_lockout_until');
    } else {
      recordFailedAttempt();
      setEnteredPassword('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMsg(null);

    if (!storageService.verifyAdminPin(oldPinInput)) {
      setChangePinMsg({ type: 'error', text: 'Ancien code PIN incorrect.' });
      return;
    }

    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setChangePinMsg({ type: 'error', text: 'Le nouveau code PIN doit comporter exactement 4 chiffres.' });
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setChangePinMsg({ type: 'error', text: 'La confirmation du nouveau PIN ne correspond pas.' });
      return;
    }

    const ok = storageService.setAdminPin(newPinInput);
    if (ok) {
      setChangePinMsg({ type: 'success', text: 'Nouveau code PIN Propriétaire enregistré avec succès !' });
      setOldPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => {
        setShowChangePinModal(false);
        setChangePinMsg(null);
      }, 1800);
    } else {
      setChangePinMsg({ type: 'error', text: 'Erreur lors du changement de PIN.' });
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMsg(null);

    if (!storageService.verifyAdminPassword(oldPasswordInput) && !storageService.verifyAdminPin(oldPasswordInput)) {
      setChangePinMsg({ type: 'error', text: 'Ancien mot de passe / code incorrect.' });
      return;
    }

    if (newPasswordInput.length < 6) {
      setChangePinMsg({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePinMsg({ type: 'error', text: 'La confirmation du nouveau mot de passe ne correspond pas.' });
      return;
    }

    const ok = storageService.setAdminPassword(newPasswordInput);
    if (ok) {
      setChangePinMsg({ type: 'success', text: 'Nouveau mot de passe Propriétaire enregistré avec succès !' });
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        setShowChangePinModal(false);
        setChangePinMsg(null);
      }, 1800);
    } else {
      setChangePinMsg({ type: 'error', text: 'Erreur lors du changement de mot de passe.' });
    }
  };

  const refreshTreasury = () => {
    setTreasury(storageService.getPlatformTreasury());
  };

  // Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Admin Daily Summary Generation
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryStatusMessage, setSummaryStatusMessage] = useState<string | null>(null);

  // Aid Requests Validation State (Admin Exclusive Confirmation)
  const [aidRequestsList, setAidRequestsList] = useState<AidRequest[]>(() => {
    if (aidRequests && aidRequests.length > 0) return aidRequests;
    return storageService.getAidRequests();
  });

  useEffect(() => {
    if (aidRequests && aidRequests.length > 0) {
      setAidRequestsList(aidRequests);
    }
  }, [aidRequests]);

  const [aidFilterStatus, setAidFilterStatus] = useState<'all' | 'pending' | 'approved' | 'disbursed' | 'rejected'>('all');
  const [aidSearchQuery, setAidSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [customNoteText, setCustomNoteText] = useState('');
  const [aidFeedbackMsg, setAidFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const pendingAidCount = aidRequestsList.filter((r) => r.status === 'pending').length;

  const handleApproveAid = (req: AidRequest) => {
    const updated: AidRequest = {
      ...req,
      status: 'approved',
      adminNotes: `✅ DEMANDE ACCORDÉE par la Direction (Germain Mensah) le ${new Date().toLocaleDateString('fr-FR')}. Déblocage des fonds autorisé.`,
    };
    storageService.addAidRequest(updated);
    firestoreService.saveAidRequest(updated);
    setAidRequestsList(storageService.getAidRequests());
    if (onUpdateAidRequest) onUpdateAidRequest(updated);

    setAidFeedbackMsg({
      type: 'success',
      text: `Dossier de ${req.driverName} accordé avec succès ! Vous pouvez procéder au virement Mobile Money.`,
    });
    setTimeout(() => setAidFeedbackMsg(null), 4500);

    notificationService.sendPushNotification({
      type: 'aid_approved',
      title: '✅ DEMANDE D’ASSISTANCE ACCORDÉE',
      body: `Votre demande d'aide de ${req.requestedAmount.toLocaleString()} FCFA a été validée par la direction Liencolis. Le déblocage est autorisé.`,
    });
    notificationService.speak(`La demande d'assistance de ${req.driverName} a été validée avec succès.`);
  };

  const handleDisburseAid = (req: AidRequest) => {
    const refCode = `MOMO-AID-BJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const updated: AidRequest = {
      ...req,
      status: 'disbursed',
      adminNotes: `⚡ PAIEMENT EFFECTUÉ : ${req.requestedAmount.toLocaleString()} FCFA versés sur le compte MoMo du demandeur (${req.driverPhone}). Réf: ${refCode}.`,
    };
    storageService.addAidRequest(updated);
    firestoreService.saveAidRequest(updated);
    setAidRequestsList(storageService.getAidRequests());
    if (onUpdateAidRequest) onUpdateAidRequest(updated);

    confetti({ particleCount: 90, spread: 70 });
    setAidFeedbackMsg({
      type: 'success',
      text: `💰 Virement de ${req.requestedAmount.toLocaleString()} FCFA exécuté pour ${req.driverName} (${req.driverPhone}) ! Réf: ${refCode}`,
    });
    setTimeout(() => setAidFeedbackMsg(null), 5000);

    notificationService.sendPushNotification({
      type: 'aid_approved',
      title: `💰 VIREMENT MOBILE MONEY EFFECTUÉ (${req.requestedAmount.toLocaleString()} FCFA)`,
      body: `Un utilisateur a reçu un virement d'assistance de ${req.requestedAmount.toLocaleString()} FCFA avec succès. Réf: ${refCode}.`,
    });
    notificationService.speak(`Virement de ${req.requestedAmount} Francs CFA versé avec succès à ${req.driverName}.`);
  };

  const handleRejectAid = (req: AidRequest, reasonMsg?: string) => {
    const reason = reasonMsg || 'Dossier non conforme ou critères d’éligibilité non remplis selon le règlement de la caisse.';
    const updated: AidRequest = {
      ...req,
      status: 'rejected',
      adminNotes: `❌ REFUSÉ : ${reason}`,
    };
    storageService.addAidRequest(updated);
    firestoreService.saveAidRequest(updated);
    setAidRequestsList(storageService.getAidRequests());
    if (onUpdateAidRequest) onUpdateAidRequest(updated);

    setAidFeedbackMsg({
      type: 'info',
      text: `La demande de ${req.driverName} a été rejetée.`,
    });
    setTimeout(() => setAidFeedbackMsg(null), 4000);

    notificationService.sendPushNotification({
      type: 'system_alert',
      title: 'Demande d’Assistance Non Retenue',
      body: `Votre dossier n'a pas été validé par la direction : ${reason}`,
    });
  };

  const handleSaveCustomNote = (req: AidRequest) => {
    if (!customNoteText.trim()) return;
    const updated: AidRequest = {
      ...req,
      adminNotes: customNoteText.trim(),
    };
    storageService.addAidRequest(updated);
    firestoreService.saveAidRequest(updated);
    setAidRequestsList(storageService.getAidRequests());
    if (onUpdateAidRequest) onUpdateAidRequest(updated);
    setEditingNoteId(null);
    setCustomNoteText('');
  };

  // Mock Drivers to Certify
  const [pendingCertifications, setPendingCertifications] = useState([
    {
      id: 'usr_p_1',
      name: 'Gildas Akpo',
      phone: '+229 97 11 22 33',
      city: 'Cotonou',
      vehicle: 'Moto Haojue 110cc',
      documentType: 'CIP / NIP Bénin (Identité Nationale)',
      documentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      status: 'pending',
    },
    {
      id: 'usr_p_2',
      name: 'Benoit Houndonougbo',
      phone: '+229 96 44 55 66',
      city: 'Abomey-Calavi',
      vehicle: 'Tricycle Dayang Cargo',
      documentType: 'Permis de Conduire Catégorie A/B',
      documentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      status: 'pending',
    },
  ]);

  const handleBulkSyncToFirestore = async () => {
    setIsCloudSyncing(true);
    setCloudSyncSuccessMsg(null);
    try {
      // Sync all current deliveries to Firestore database
      for (const d of deliveries) {
        await firestoreService.saveDelivery(d);
      }
      setCloudSyncSuccessMsg(`✅ ${deliveries.length} livraisons et données administratives sauvegardées sur Firestore Cloud avec succès.`);
      setTimeout(() => setCloudSyncSuccessMsg(null), 4500);
    } catch (err: any) {
      setCloudSyncSuccessMsg("Erreur lors de la synchronisation cloud.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleGenerateDailySummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryStatusMessage(null);

    const completed = deliveries.filter((d) => d.status === 'delivered').length;
    const summaryData = {
      date: new Date().toLocaleDateString('fr-FR'),
      totalDeliveries: deliveries.length,
      completedDeliveries: completed,
      incidentsReported: 0,
      activeDriversCount: 28,
      newSubscriptionsCount: 6,
      totalSubscriptionRevenueFcfa: 8400,
    };

    try {
      const res = await fetch('/api/gemini/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: summaryData }),
      });
      const data = await res.json();

      const newSummary: DailyAdministrativeSummary = {
        id: `sum_${Date.now()}`,
        date: summaryData.date,
        totalDeliveries: summaryData.totalDeliveries,
        completedDeliveries: summaryData.completedDeliveries,
        incidentsReported: summaryData.incidentsReported,
        activeDriversCount: summaryData.activeDriversCount,
        newSubscriptionsCount: summaryData.newSubscriptionsCount,
        totalSubscriptionRevenueFcfa: summaryData.totalSubscriptionRevenueFcfa,
        sentToEmail: 'liencolis.liv1@gmail.com',
        summaryText: data.summaryText || 'Rapport quotidien clôturé avec succès.',
        createdAt: new Date().toISOString(),
      };

      onAddAdminSummary(newSummary);
      setSummaryStatusMessage("✅ Résumé synthétisé par l'IA et transmis à l'adresse liencolis.liv1@gmail.com avec succès !");
    } catch (e) {
      setSummaryStatusMessage("Rapport généré localement.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAdminWithdrawCommissions = (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    setWithdrawSuccessMsg(null);
    setWithdrawErrorMsg(null);

    const amount = parseInt(withdrawAmount) || 0;
    const res = storageService.withdrawPlatformCommissions(
      amount,
      withdrawProvider,
      destinationAccount,
      withdrawReason,
      currentUser?.name || 'Germain Mensah (Fondateur)'
    );

    setIsWithdrawing(false);
    if (res.success) {
      setWithdrawSuccessMsg(res.message);
      refreshTreasury();
    } else {
      setWithdrawErrorMsg(res.message);
    }
  };

  const handleAdminCreditDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setCreditResultMsg(null);
    const amount = parseInt(creditAmountInput) || 0;
    if (!creditDriverInput.trim() || amount <= 0) return;

    const res = storageService.adminCreditDriverWallet(
      creditDriverInput.trim(),
      amount,
      creditReasonInput
    );

    setCreditResultMsg(res.message);
    refreshTreasury();
  };

  if (!isAdminUnlocked) {
    if (!hasCredentials) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-md mx-auto p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 border border-amber-500/40 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl">
              <ShieldCheck className="w-8 h-8" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
                🔒 INITIALISATION EXCLUSIVE (GERMAIN MENSAH)
              </span>
              <h2 className="text-xl font-black text-white">Création de votre Accès Administrateur</h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Les mots de passe par défaut ont été supprimés. Définissez dès maintenant vos identifiants secrets uniques. <strong>Vous seul aurez accès</strong> à cet espace.
              </p>
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            {setupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{setupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleInitialSetup} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  1. Votre Code PIN Secret (4 chiffres) :
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={setupPin}
                  onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 8492"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirmer le Code PIN (4 chiffres) :
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={setupConfirmPin}
                  onChange={(e) => setSetupConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 8492"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  2. Votre Mot de Passe Super-Admin Secret :
                </label>
                <input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Au moins 6 caractères complexes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirmer le Mot de Passe :
                </label>
                <input
                  type="password"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Ressaisir le mot de passe..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Créer et Activer mon Compte Administrateur</span>
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md mx-auto p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 border border-amber-500/40 rounded-3xl shadow-2xl text-center space-y-6">
          {/* Header Icon */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl">
            <Lock className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
              🔒 PROPRIÉTAIRE SEUL (GERMAIN MENSAH)
            </span>
            <h2 className="text-xl font-black text-white">Espace Direction & Administration</h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Accès strictement réservé au Fondateur. Saisissez votre <strong>Code PIN</strong> ou votre <strong>Mot de passe personnel</strong> pour déverrouiller la console.
            </p>
          </div>

          {/* Mode Switcher: PIN vs Mot de Passe */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthInputType('pin');
                setPinError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authInputType === 'pin'
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Code PIN (4 chiffres)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthInputType('password');
                setPinError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authInputType === 'password'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Mot de passe Maître</span>
            </button>
          </div>

          {/* Lockout Warning Banner */}
          {lockoutRemainingSeconds > 0 && (
            <div className="p-4 rounded-2xl bg-red-950/95 border-2 border-red-500/80 text-red-200 text-xs font-bold space-y-1.5 shadow-2xl animate-pulse">
              <div className="flex items-center justify-center gap-2 text-red-400 font-black text-sm">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span>VERROUILLAGE ANTI-INTRUSION ACTIF</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Accès temporairement bloqué suite à 5 tentatives erronées consécutives. Protection active contre le piratage par force brute.
              </p>
              <div className="text-amber-400 font-mono text-base font-black pt-1">
                Déblocage automatique dans : {Math.floor(lockoutRemainingSeconds / 60)}m {String(lockoutRemainingSeconds % 60).padStart(2, '0')}s
              </div>
            </div>
          )}

          {/* Error Message */}
          {pinError && lockoutRemainingSeconds <= 0 && (
            <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {authInputType === 'pin' ? (
            <div className="space-y-4">
              {/* 4 Digit Visual Dots Indicator */}
              <div className="flex items-center justify-center gap-4 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = enteredPin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 rounded-full transition-all duration-300 ${
                        isFilled
                          ? 'bg-gradient-to-tr from-amber-400 to-emerald-400 ring-4 ring-amber-400/30 scale-110 shadow-lg shadow-amber-400/50'
                          : 'bg-slate-950 border-2 border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    disabled={lockoutRemainingSeconds > 0}
                    onClick={() => handlePinDigit(digit)}
                    className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700/80 hover:border-amber-400/80 text-white text-lg font-black font-mono shadow-md hover:shadow-amber-500/10 transition-all active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={lockoutRemainingSeconds > 0}
                  onClick={handleClearPin}
                  className="h-12 rounded-2xl bg-slate-900/40 hover:bg-red-950/50 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-bold transition-all active:scale-95"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  disabled={lockoutRemainingSeconds > 0}
                  onClick={() => handlePinDigit('0')}
                  className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700/80 hover:border-amber-400/80 text-white text-lg font-black font-mono shadow-md hover:shadow-amber-500/10 transition-all active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={lockoutRemainingSeconds > 0}
                  onClick={handleVerifyPin}
                  className="h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Valider</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mot de Passe Propriétaire :
                </label>
                <div className="relative">
                  <input
                    type="password"
                    disabled={lockoutRemainingSeconds > 0}
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder={lockoutRemainingSeconds > 0 ? "Clavier verrouillé..." : "Saisir votre mot de passe secret..."}
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-500"
                    autoFocus={lockoutRemainingSeconds <= 0}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={lockoutRemainingSeconds > 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Unlock className="w-4 h-4 text-amber-300" />
                <span>Déverrouiller la Console Propriétaire</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Supervision Administrateur & Caisse Liencolis</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROPRIÉTAIRE GERMAIN MENSAH
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Contrôle des comptes prépayés livreurs, collecte des commissions 5%-20%, retraits de caisse et rapports synthétiques.
            </p>
          </div>
        </div>

        {/* PIN Security Buttons & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Lock & Change PIN Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowChangePinModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1 transition-all"
              title="Modifier le code PIN à 4 chiffres"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code PIN</span>
            </button>
            <button
              onClick={() => setIsAdminUnlocked(false)}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-500/40 flex items-center gap-1 transition-all"
              title="Verrouiller immédiatement l'espace admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Verrouiller</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('admin_panel')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'admin_panel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Supervision & Docs
            </button>
            <button
              onClick={() => setActiveTab('aid_validation')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'aid_validation' ? 'bg-rose-600 text-white font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-rose-300" />
              <span>Aides & Solidarité</span>
              {pendingAidCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                  {pendingAidCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('commissions_treasury')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'commissions_treasury' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Caisse & Commissions</span>
            </button>
            <button
              onClick={() => setActiveTab('firestore_database')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'firestore_database' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-300" />
              <span>Base Firestore Cloud</span>
            </button>
            <button
              onClick={() => setActiveTab('smtp_settings')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'smtp_settings' ? 'bg-indigo-600 text-white font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Contrôle SMTP & DNS</span>
            </button>
            <button
              onClick={() => setActiveTab('launch_checklist')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'launch_checklist' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-amber-500" />
              <span>Guide Lancement (1 2 3 4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Firebase Authentication & Session Panel */}
      <AdminAuthPanel
        currentFirebaseUser={firebaseAdminUser}
        onAdminAuthenticated={(user) => setFirebaseAdminUser(user)}
        onAdminLoggedOut={() => setFirebaseAdminUser(null)}
      />

      {cloudSyncSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{cloudSyncSuccessMsg}</span>
          </div>
        </div>
      )}

      {activeTab === 'aid_validation' ? (
        /* TAB: EXCLUSIVE AID REQUESTS VALIDATION & PAYOUTS */
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950/70 to-slate-900 border border-rose-500/30 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <HeartHandshake className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-white">Validation & Déblocage des Aides Solidarité</h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Direction Germain Mensah
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 max-w-2xl mt-0.5">
                    Contrôle exclusif de l'Administration : examinez les demandes de secours (pannes, accidents, urgences santé), vérifiez les scores d'éligibilité et confirmez les déblocages sur Mobile Money.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAidRequestsList(storageService.getAidRequests())}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow"
                >
                  <RefreshCw className="w-3 h-3 text-rose-400" />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            {/* KPI Cards (Reduced / Compact squares) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Demandes</span>
                  <p className="text-base sm:text-lg font-bold text-white font-mono">{aidRequestsList.length}</p>
                  <span className="text-[9px] text-slate-500 block">Dossiers enregistrés</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-amber-500/25 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">À Valider</span>
                  <p className="text-base sm:text-lg font-bold text-amber-300 font-mono">
                    {aidRequestsList.filter((r) => r.status === 'pending').length}
                  </p>
                  <span className="text-[9px] text-amber-400/80 block">En attente décision</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-blue-500/25 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">Accordées</span>
                  <p className="text-base sm:text-lg font-bold text-blue-300 font-mono">
                    {aidRequestsList.filter((r) => r.status === 'approved').length}
                  </p>
                  <span className="text-[9px] text-blue-400/80 block">Prêtes au virement</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {aidFeedbackMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between border shadow-md animate-in fade-in ${
                aidFeedbackMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : aidFeedbackMsg.type === 'error'
                  ? 'bg-red-950/80 border-red-500/50 text-red-200'
                  : 'bg-blue-950/80 border-blue-500/50 text-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {aidFeedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{aidFeedbackMsg.text}</span>
              </div>
              <button onClick={() => setAidFeedbackMsg(null)} className="text-slate-400 hover:text-white ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={aidSearchQuery}
                onChange={(e) => setAidSearchQuery(e.target.value)}
                placeholder="Rechercher par livreur, tél, ville..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1.5 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
              <span className="text-[10px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Filtrer :</span>
              </span>
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'pending', label: 'À Valider' },
                { id: 'approved', label: 'Accordées' },
                { id: 'disbursed', label: 'Versées MoMo' },
                { id: 'rejected', label: 'Refusées' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAidFilterStatus(tab.id as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    aidFilterStatus === tab.id
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aid Requests Cards Grid (Reduced & Compact with Vector Icons) */}
          <div className="space-y-2.5">
            {aidRequestsList
              .filter((req) => {
                if (aidFilterStatus !== 'all' && req.status !== aidFilterStatus) return false;
                if (!aidSearchQuery.trim()) return true;
                const query = aidSearchQuery.toLowerCase();
                return (
                  req.driverName?.toLowerCase().includes(query) ||
                  req.driverPhone?.toLowerCase().includes(query) ||
                  req.driverCity?.toLowerCase().includes(query) ||
                  req.description?.toLowerCase().includes(query) ||
                  req.incidentType?.toLowerCase().includes(query)
                );
              })
              .map((req) => {
                const statusStyles: Record<string, { label: string; color: string; icon: any }> = {
                  pending: { label: 'En attente de validation', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock },
                  approved: { label: 'Accordé par l’Administration', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-bold', icon: CheckCircle2 },
                  disbursed: { label: 'Fonds Versé MoMo', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-black', icon: Zap },
                  rejected: { label: 'Refusé', color: 'bg-red-500/15 text-red-300 border-red-500/30', icon: XCircle },
                };

                const currentStatus = statusStyles[req.status] || {
                  label: req.status,
                  color: 'bg-slate-800 text-slate-300 border-slate-700',
                  icon: AlertCircle,
                };
                const StatusIcon = currentStatus.icon;

                const incidentConfigMap: Record<string, { label: string; icon: any; badgeBg: string; textColor: string }> = {
                  breakdown: { label: 'Panne Mécanique', icon: Wrench, badgeBg: 'bg-amber-500/15 border-amber-500/30', textColor: 'text-amber-400' },
                  accident: { label: 'Accident / Collision', icon: Ambulance, badgeBg: 'bg-rose-500/15 border-rose-500/30', textColor: 'text-rose-400' },
                  health_emergency: { label: 'Urgence Santé', icon: HeartPulse, badgeBg: 'bg-emerald-500/15 border-emerald-500/30', textColor: 'text-emerald-400' },
                  health: { label: 'Santé', icon: HeartPulse, badgeBg: 'bg-emerald-500/15 border-emerald-500/30', textColor: 'text-emerald-400' },
                  theft: { label: 'Vol / Agression', icon: ShieldAlert, badgeBg: 'bg-purple-500/15 border-purple-500/30', textColor: 'text-purple-400' },
                  other: { label: 'Autre Incident', icon: AlertTriangle, badgeBg: 'bg-slate-800 border-slate-700', textColor: 'text-slate-300' },
                };

                const incConfig = incidentConfigMap[req.incidentType] || {
                  label: req.incidentType,
                  icon: AlertTriangle,
                  badgeBg: 'bg-slate-800 border-slate-700',
                  textColor: 'text-slate-300',
                };
                const IncIcon = incConfig.icon;
                const isEditingThisNote = editingNoteId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all shadow-sm"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                          {req.driverName ? req.driverName.charAt(0).toUpperCase() : 'L'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-xs sm:text-sm">{req.driverName}</h4>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-slate-500" />
                              <span>{req.driverCity || 'Bénin'}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 font-mono text-emerald-400">
                              <Phone className="w-2.5 h-2.5" />
                              <strong>{req.driverPhone}</strong>
                            </span>
                            <span className="text-slate-500">
                              • {new Date(req.createdAt).toLocaleDateString('fr-FR')} {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${currentStatus.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          <span>{currentStatus.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Compact Grid of 3 sleek micro-squares */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Box 1: Incident */}
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center gap-2">
                        <div className={`p-1.5 rounded-md border ${incConfig.badgeBg} ${incConfig.textColor} shrink-0`}>
                          <IncIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Motif</span>
                          <span className="text-xs font-bold text-white truncate block">{incConfig.label}</span>
                        </div>
                      </div>

                      {/* Box 2: Requested Amount */}
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Montant Demandé</span>
                          <p className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                            {req.requestedAmount?.toLocaleString()} <span className="text-[10px] font-normal text-slate-300">FCFA</span>
                          </p>
                        </div>
                        <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                          <Coins className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Box 3: Eligibility Score */}
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-semibold">
                          <span className="text-slate-400 uppercase tracking-wider">Score Éligibilité</span>
                          <span className={`font-mono ${req.eligibilityScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {req.eligibilityScore}% • {req.eligibilityScore >= 70 ? 'Conforme' : 'À vérifier'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${
                              req.eligibilityScore >= 70 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, req.eligibilityScore || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Driver's statement */}
                    <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/70 space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Rapport du Livreur :</span>
                      <p className="text-[11px] text-slate-200 italic leading-relaxed">
                        "{req.description}"
                      </p>
                    </div>

                    {/* Admin Note Section */}
                    {isEditingThisNote ? (
                      <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                        <label className="text-[11px] font-bold text-indigo-300 block">
                          Modifier la Note Administrative :
                        </label>
                        <textarea
                          rows={2}
                          value={customNoteText}
                          onChange={(e) => setCustomNoteText(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1.5 focus:ring-indigo-400"
                          placeholder="Note de validation, motif de rejet ou référence de paiement..."
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingNoteId(null);
                              setCustomNoteText('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold hover:bg-slate-700"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveCustomNote(req)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow"
                          >
                            Enregistrer la Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      req.adminNotes && (
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-2 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Note Direction Liencolis :</span>
                            <p className="text-emerald-300 text-[11px] font-medium">{req.adminNotes}</p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingNoteId(req.id);
                              setCustomNoteText(req.adminNotes || '');
                            }}
                            className="text-[10px] text-slate-400 hover:text-white underline shrink-0"
                          >
                            Modifier
                          </button>
                        </div>
                      )
                    )}

                    {/* Admin Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {!req.adminNotes && !isEditingThisNote && (
                          <button
                            onClick={() => {
                              setEditingNoteId(req.id);
                              setCustomNoteText('');
                            }}
                            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition-all"
                          >
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            <span>Ajouter Note</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRejectAid(req)}
                              className="px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-bold border border-red-800/60 flex items-center gap-1 transition-all"
                            >
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>Refuser</span>
                            </button>
                            <button
                              onClick={() => handleApproveAid(req)}
                              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>Accorder</span>
                            </button>
                            <button
                              onClick={() => handleDisburseAid(req)}
                              className="px-3 py-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] shadow flex items-center gap-1 transition-all"
                            >
                              <Zap className="w-3 h-3 fill-slate-950" />
                              <span>Décaisser ({req.requestedAmount?.toLocaleString()} FCFA)</span>
                            </button>
                          </>
                        )}

                        {req.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleRejectAid(req)}
                              className="px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-bold border border-red-800/60 flex items-center gap-1 transition-all"
                            >
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>Annuler / Refuser</span>
                            </button>
                            <button
                              onClick={() => handleDisburseAid(req)}
                              className="px-3 py-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] shadow flex items-center gap-1 transition-all"
                            >
                              <Zap className="w-3 h-3 fill-slate-950" />
                              <span>Verser MoMo ({req.requestedAmount?.toLocaleString()} FCFA)</span>
                            </button>
                          </>
                        )}

                        {req.status === 'disbursed' && (
                          <div className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Virement Mobile Money Exécuté</span>
                          </div>
                        )}

                        {req.status === 'rejected' && (
                          <button
                            onClick={() => handleApproveAid(req)}
                            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition-all"
                          >
                            <RefreshCw className="w-3 h-3 text-rose-400" />
                            <span>Réexaminer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {aidRequestsList.length === 0 && (
              <div className="text-center py-8 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <HeartHandshake className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-white">Aucun dossier d'assistance enregistré</h4>
                <p className="text-[11px] text-slate-400">Les demandes soumises par les livreurs apparaîtront ici pour validation.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'commissions_treasury' ? (
        /* TAB 2: COMMISSIONS & PLATFORM TREASURY CONTROL */
        <div className="space-y-4">
          {/* Top KPI Cards (Reduced / Compact squares) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Available Balance */}
            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-3.5 shadow-md space-y-1">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                <span>SOLDE COMMISSIONS DISPONIBLE</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                {treasury.availableBalance.toLocaleString()} <span className="text-xs font-normal text-emerald-300">FCFA</span>
              </p>
              <p className="text-[10px] text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Caisse nette transférable</span>
              </p>
            </div>

            {/* Card 2: Total Commissions Collected */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 shadow-md space-y-1">
              <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
                <span>COMMISSIONS DEBITÉES (5%-20%)</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {treasury.totalCommissionsCollected.toLocaleString()} <span className="text-xs font-normal text-amber-300">FCFA</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Prélèvements automatiques sur courses
              </p>
            </div>

            {/* Card 3: Total Subscriptions & Badges */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 shadow-md space-y-1">
              <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold">
                <span>VENTES ABONNEMENTS & BADGES</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {treasury.totalSubscriptionsCollected.toLocaleString()} <span className="text-xs font-normal text-blue-300">FCFA</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Abonnements & Badge VIP 500F
              </p>
            </div>

            {/* Card 4: Driver Prepaid Escrow Deposits */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 shadow-md space-y-1">
              <div className="flex items-center justify-between text-[11px] text-indigo-400 font-bold">
                <span>SOLDE PRÉPAYÉ DES LIVREURS</span>
                <Lock className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {treasury.totalDriverPrepaidDepositsHeld.toLocaleString()} <span className="text-xs font-normal text-indigo-300">FCFA</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Fonds prépayés sous séquestre
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Formulaire de Retrait des Commissions (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span>Retrait & Virement des Commissions Plateforme</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Propriétaire Germain Mensah
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Transférez les fonds de la Caisse Générale Liencolis (commissions et abonnements) vers votre compte Mobile Money Marchand ou Compte Bancaire d'Entreprise.
                </p>

                {withdrawSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{withdrawSuccessMsg}</span>
                  </div>
                )}

                {withdrawErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{withdrawErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAdminWithdrawCommissions} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Moyen de Retrait / Destination :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'fedapay', name: 'FedaPay (MTN/Moov/Celtiis/Carte)', color: 'border-emerald-500 text-emerald-300' },
                        { id: 'kkiapay', name: 'Kkiapay (MTN/Moov/Celtiis/Carte)', color: 'border-amber-500 text-amber-300' },
                        { id: 'bank_transfer', name: 'Virement Banque (RIB)', color: 'border-slate-500 text-slate-300' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setWithdrawProvider(p.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            withdrawProvider === p.id
                              ? `bg-slate-800 ${p.color} ring-2 ring-emerald-400`
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Montant à Retirer (FCFA) :
                      </label>
                      <input
                        type="number"
                        min="500"
                        max={treasury.availableBalance || 500000}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Numéro / Compte Destinataire :
                      </label>
                      <input
                        type="text"
                        value={destinationAccount}
                        onChange={(e) => setDestinationAccount(e.target.value)}
                        placeholder="+229 01 69 81 46 31"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Motif du Virement / Note Comptable :
                    </label>
                    <input
                      type="text"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      placeholder="Retrait mensuel des commissions collectées"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isWithdrawing || treasury.availableBalance <= 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isWithdrawing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Traitement du virement...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Confirmer le Virement de Caisse ({parseInt(withdrawAmount || '0').toLocaleString()} FCFA)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Historique des Retraits Administrateur */}
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Historique des Retraits de Caisse Administrateur</span>
                </h4>

                <div className="space-y-2">
                  {treasury.withdrawalHistory.map((wd) => (
                    <div
                      key={wd.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>{wd.adminName}</span>
                          <span className="font-mono text-emerald-400 font-black text-sm">
                            -{wd.amount.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {wd.provider.toUpperCase()} ({wd.destinationAccount}) • Réf: <span className="font-mono text-amber-300">{wd.reference}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 italic">{wd.reason}</p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400 shrink-0">
                        {new Date(wd.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        <span className="block font-bold text-emerald-400">Virement Effectué ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Contrôle Manuel des Portefeuilles Prépayés Livreurs (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>Ajustement & Recharge Manuelle Chauffeur</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">Admin Override</span>
                </div>

                <p className="text-xs text-slate-300">
                  Ajoutez un crédit prépayé directement sur le portefeuille d'un chauffeur en cas de bonus, régularisation ou dépôt direct.
                </p>

                {creditResultMsg && (
                  <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{creditResultMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAdminCreditDriver} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nom ou Téléphone du Chauffeur :
                    </label>
                    <input
                      type="text"
                      value={creditDriverInput}
                      onChange={(e) => setCreditDriverInput(e.target.value)}
                      placeholder="Ex: Germain Mensah ou +229 01 69 81 46 31"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Montant à Créditer :
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={creditAmountInput}
                        onChange={(e) => setCreditAmountInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Raison / Note :
                      </label>
                      <input
                        type="text"
                        value={creditReasonInput}
                        onChange={(e) => setCreditReasonInput(e.target.value)}
                        placeholder="Bonus ou Dépôt"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5 transition-all"
                  >
                    <PlusCircle className="w-4 h-4 fill-slate-950" />
                    <span>Créditer le Portefeuille Chauffeur</span>
                  </button>
                </form>
              </div>

              {/* Statut Automatique des Sourdines (< 50 FCFA) */}
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Règles de Sourdine & Séquestre Prépayé</span>
                </h4>

                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl space-y-2 text-xs text-red-200">
                  <p className="font-bold flex items-center gap-1 text-red-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Mise en Sourdine Automatique &lt; 50 FCFA</span>
                  </p>
                  <p className="text-[11px] text-red-300/90 leading-relaxed">
                    Tout chauffeur sur la formule Commission dont le solde est inférieur à 50 FCFA est immédiatement mis en sourdine. Ses accès à l'envoi de messages, vocaux, stickers et aux réponses d'annonces sont désactivés jusqu'à recharge de 250 FCFA minimum.
                  </p>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2 text-xs text-emerald-200">
                  <p className="font-bold flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Protection Anti-Fraude par Séquestre PIN</span>
                  </p>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    Pendant qu'une livraison est active, le solde prépayé est sous séquestre. Les retraits de solde sont bloqués jusqu'à la remise du colis et la validation du code PIN client à 4 chiffres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'admin_panel' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Certification Queue (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Validation & Certification des Livreurs Béninois</span>
                </h3>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {pendingCertifications.filter((p) => p.status === 'pending').length} en attente
                </span>
              </div>

              <div className="space-y-3">
                {pendingCertifications.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{driver.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {driver.phone} • 📍 {driver.city} • {driver.vehicle}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          driver.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {driver.status === 'approved' ? 'Certifié ✓' : 'Pièce à valider'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-200">{driver.documentType}</span>
                      </div>
                      <a
                        href={driver.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline font-bold text-[11px]"
                      >
                        Consulter Document
                      </a>
                    </div>

                    {driver.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setPendingCertifications((prev) =>
                              prev.map((p) => (p.id === driver.id ? { ...p, status: 'rejected' } : p))
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>

                        <button
                          onClick={() => {
                            setPendingCertifications((prev) =>
                              prev.map((p) => (p.id === driver.id ? { ...p, status: 'approved' } : p))
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Certifier le Livreur</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Daily Reports & Automated Email Sender (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Rapport & Synthèse Quotidienne</span>
                </h3>
                <span className="text-[10px] text-slate-400">Owner Email</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="text-slate-400 text-[11px]">DESTINATAIRE AUTOMATIQUE :</p>
                <p className="font-mono font-bold text-amber-300">liencolis.liv1@gmail.com</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-slate-400 text-[10px]">Courses Totales</p>
                  <p className="text-base font-black text-white">{deliveries.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-slate-400 text-[10px]">Livreurs Actifs</p>
                  <p className="text-base font-black text-emerald-400">34</p>
                </div>
              </div>

              {summaryStatusMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
                  {summaryStatusMessage}
                </div>
              )}

              <button
                onClick={handleGenerateDailySummary}
                disabled={isGeneratingSummary}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingSummary ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Génération IA en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Générer & Transmettre le Bilan du Jour</span>
                  </>
                )}
              </button>

              {/* Past Reports List */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dernières Synthèses Enregistrées :
                </span>
                {adminSummaries.map((sum) => (
                  <div key={sum.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">📅 {sum.date}</span>
                      <span className="text-emerald-400 font-bold">{sum.completedDeliveries} livraisons OK</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic line-clamp-2">
                      "{sum.summaryText}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'firestore_database' ? (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Base de Données Firestore Cloud & Collections</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                    lincom-1ecc6
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Collections gérées : <code className="text-amber-300">users</code>, <code className="text-amber-300">deliveries</code>, <code className="text-amber-300">classifiedAds</code>, <code className="text-amber-300">aidRequests</code>, <code className="text-amber-300">adminSummaries</code>
                </p>
              </div>
            </div>

            <button
              onClick={handleBulkSyncToFirestore}
              disabled={isCloudSyncing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
              <span>{isCloudSyncing ? 'Sauvegarde Cloud en cours...' : 'Synchroniser Tout vers Firestore Cloud'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Collection Deliveries</span>
              <p className="text-2xl font-black text-white font-mono">{deliveries.length}</p>
              <p className="text-[11px] text-slate-400">Courses en temps réel répliquées sur Firestore</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Collection Admin Summaries</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">{adminSummaries.length}</p>
              <p className="text-[11px] text-slate-400">Rapports envoyés à liencolis.liv1@gmail.com</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sécurité & Authentification</span>
              <p className="text-base font-black text-amber-400 font-mono">
                {firebaseAdminUser ? 'Authentifié ✓' : 'En attente de connexion'}
              </p>
              <p className="text-[11px] text-slate-400">Règles Firestore v2 déployées</p>
            </div>
          </div>

          {/* Detailed Deliveries in Firestore */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Derniers enregistrements enregistrés en base :
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono">
                  <tr>
                    <th className="p-2.5 rounded-l-xl">Code Suivi</th>
                    <th className="p-2.5">Client & Téléphone</th>
                    <th className="p-2.5">Trajet</th>
                    <th className="p-2.5">Tarif</th>
                    <th className="p-2.5">Statut</th>
                    <th className="p-2.5 rounded-r-xl">Code PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deliveries.slice(0, 6).map((del) => (
                    <tr key={del.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono font-bold text-amber-400">#{del.trackingCode}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-white">{del.clientPseudo}</div>
                        <div className="text-[10px] text-slate-400">{del.clientPhone}</div>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {del.pickupCity} ➔ {del.dropoffCity}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">{del.deliveryFee} F</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {del.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-amber-300 font-bold">{del.securityPin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'launch_checklist' ? (
        /* TAB 5: GUIDE DE LANCEMENT OPERATIONNEL (1 2 3 4) */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/60 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Feuille de Route & Déploiement : Les 4 Étapes Clés</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                    Prêt pour Production
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Suivez ces 4 étapes pour activer l'authentification, publier sur le web, générer l'APK mobile et superviser vos tarifs.
                </p>
              </div>
            </div>
          </div>

          {/* The 4 Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ETAPE 1 : Console Firebase */}
            <div className="bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-base font-black text-white">Console Google Firebase</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Projet lié : lincom-1ecc6
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Activez le mode de connexion pour permettre à vos livreurs et clients de créer des comptes et de se connecter en toute sécurité.
                </p>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1. Authentication :</strong> Ouvrir l'onglet <em>Mode de connexion (Sign-in method)</em> et activer <strong>Adresse e-mail/Mot de passe</strong> (+ Google si désiré).</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>2. Firestore Database :</strong> Base active sur <code>(default)</code>. Les règles de sécurité sont prêtes.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>3. Configuration SMTP :</strong> Vérifiez le domaine de messagerie dans l'onglet <em>Contrôle SMTP & DNS</em> pour éviter les erreurs NXDOMAIN.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                <a
                  href="https://console.firebase.google.com/project/lincom-1ecc6/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Activer Authentification Firebase</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveTab('smtp_settings')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vérifier Domaine SMTP</span>
                </button>
              </div>
            </div>

            {/* ETAPE 2 : Déploiement Firebase Hosting & Domaine Personnalisé */}
            <div className="bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-base font-black text-white">Domaine & Déploiement Web</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    lincom-1ecc6.web.app
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Votre nom de projet est <strong>liencolis (driver and communauty)</strong> et votre domaine d'accès officiel configuré est <strong>lincom-1ecc6.web.app</strong>.
                </p>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Commande de déploiement en 1 clic :</span>
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-700/80">
                    <code className="text-xs text-amber-300 font-mono">npm run deploy:hosting</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('npm run deploy:hosting');
                        setCopiedCommand('npm run deploy:hosting');
                        setTimeout(() => setCopiedCommand(null), 2000);
                      }}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold ml-2"
                    >
                      {copiedCommand === 'npm run deploy:hosting' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCommand === 'npm run deploy:hosting' ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cette commande compile l'application (<code>vite build</code>) et publie la version prête pour la communauté.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                <a
                  href="https://lincom-1ecc6.web.app"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow flex items-center gap-1.5 transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Ouvrir lincom-1ecc6.web.app</span>
                </a>
                <a
                  href="https://lincom-1ecc6.firebaseapp.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Miroir Firebase Hosting</span>
                </a>
              </div>
            </div>

            {/* ETAPE 3 : Application Android (APK & Play Store) */}
            <div className="bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono font-black text-sm flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-base font-black text-white">Application Mobile Android (APK)</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Capacitor v8
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Le projet est configuré avec Capacitor (<code>com.liencolis.driver</code>). Vous pouvez générer un fichier APK installable sur tous les smartphones des livreurs.
                </p>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Générer et ouvrir dans Android Studio :</span>
                    <div className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-700/80 flex items-center justify-between">
                      <code className="text-xs text-amber-300 font-mono">npm run cap:sync && npm run cap:open</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('npm run cap:sync && npm run cap:open');
                          setCopiedCommand('cap');
                          setTimeout(() => setCopiedCommand(null), 2000);
                        }}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold ml-2"
                      >
                        {copiedCommand === 'cap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCommand === 'cap' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Dans Android Studio : Menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> pour obtenir le fichier <code>.apk</code>.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    💡 Astuce PWA : L'application est aussi installable directement sans passer par le store via le navigateur Chrome !
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>ID: com.liencolis.driver</span>
                </span>
              </div>
            </div>

            {/* ETAPE 4 : Gestion des Tarifs & Mobile Money */}
            <div className="bg-slate-900/90 border border-slate-700/80 hover:border-purple-500/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-black text-sm flex items-center justify-center">
                      4
                    </span>
                    <h4 className="text-base font-black text-white">Tarifs, Commissions & Mobile Money</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Actif en FCFA
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Supervisez la grille tarifaire et les passerelles de paiement pour les encaissements et retraits de commissions.
                </p>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Abonnement Moto 2 Roues</span>
                    <span className="text-sm font-black text-amber-400 font-mono">1 200 FCFA / mois</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Abonnement Tricycle</span>
                    <span className="text-sm font-black text-amber-400 font-mono">1 500 FCFA / mois</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Commission par Course</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">5% à 20%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Recharge Portefeuille Min</span>
                    <span className="text-sm font-black text-blue-400 font-mono">250 FCFA</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Passerelles : FedaPay, Kkiapay, MTN MoMo, Moov Money, Celtiis Cash</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">Connecté</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('commissions_treasury')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow flex items-center gap-1.5 transition-all"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Gérer la Caisse & Faire un Retrait</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'smtp_settings' ? (
        <SmtpBackofficePanel isDarkMode={isDarkMode} />
      ) : null}

      {/* Modal de Modification du Code PIN ou Mot de Passe Administrateur Propriétaire */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/50 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Sécurité & Clés Administrateur</h3>
                  <p className="text-[11px] text-slate-400">Modifier vos identifiants Propriétaire exclusifs</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChangePinModal(false);
                  setChangePinMsg(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: PIN vs Password */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setSecurityModalTab('pin');
                  setChangePinMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  securityModalTab === 'pin'
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Modifier Code PIN (4 chiffres)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecurityModalTab('password');
                  setChangePinMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  securityModalTab === 'password'
                    ? 'bg-indigo-600 text-white font-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Modifier Mot de Passe
              </button>
            </div>

            {changePinMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  changePinMsg.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : 'bg-red-950/90 border-red-500/60 text-red-200'
                }`}
              >
                {changePinMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{changePinMsg.text}</span>
              </div>
            )}

            {securityModalTab === 'pin' ? (
              <form onSubmit={handleChangePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ancien Code PIN (4 chiffres) :
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm tracking-widest text-center focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nouveau Code PIN (4 chiffres) :
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm tracking-widest text-center focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirmer Nouveau Code PIN :
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm tracking-widest text-center focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePinModal(false);
                      setChangePinMsg(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-4 h-4" />
                    <span>Enregistrer le PIN</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ancien Mot de Passe / PIN :
                  </label>
                  <input
                    type="password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    placeholder="Saisir ancien mot de passe..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nouveau Mot de Passe (min 6 caractères) :
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Nouveau mot de passe fort..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirmer Nouveau Mot de Passe :
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirmer nouveau mot de passe..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePinModal(false);
                      setChangePinMsg(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enregistrer Mot de Passe</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
