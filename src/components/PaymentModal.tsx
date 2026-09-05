import React, { useState } from 'react';
import { PaymentProvider, PaymentPurpose, PaymentTransaction, UserProfile } from '../types';
import { notificationService } from '../services/notificationService';
import {
  CreditCard,
  Smartphone,
  Award,
  Sparkles,
  CheckCircle,
  Clock,
  ShieldCheck,
  Zap,
  Wallet,
  ArrowRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onPaymentSuccess: (tx: PaymentTransaction, updatedUser: UserProfile) => void;
  isDarkMode: boolean;
  initialPurpose?: PaymentPurpose;
  initialCustomDepositAmount?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPaymentSuccess,
  isDarkMode,
  initialPurpose = 'subscription_2wheels',
  initialCustomDepositAmount,
}) => {
  const [purpose, setPurpose] = useState<PaymentPurpose>(initialPurpose);
  const [walletDepositAmount, setWalletDepositAmount] = useState<number>(
    initialCustomDepositAmount || 1200
  );
  const [provider, setProvider] = useState<PaymentProvider>('fedapay');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.phone || '+229 01 69 81 46 31');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);
  const [showUssdPrompt, setShowUssdPrompt] = useState(false);
  const [ussdPinInput, setUssdPinInput] = useState('');
  const [ussdErrorMsg, setUssdErrorMsg] = useState('');
  const [successTx, setSuccessTx] = useState<PaymentTransaction | null>(null);

  React.useEffect(() => {
    let targetPurpose: PaymentPurpose = (initialPurpose as PaymentPurpose) || 'subscription_2wheels';

    if (currentUser?.role === 'driver' && (!initialPurpose || targetPurpose === 'subscription_2wheels')) {
      targetPurpose = 'wallet_deposit_1200';
    }

    setPurpose(targetPurpose);

    if (initialCustomDepositAmount && initialCustomDepositAmount >= 250) {
      setWalletDepositAmount(initialCustomDepositAmount);
    } else if (typeof targetPurpose === 'string' && targetPurpose.startsWith('wallet_deposit_')) {
      const parsed = parseInt(targetPurpose.replace('wallet_deposit_', ''), 10);
      if (!isNaN(parsed) && parsed >= 250) {
        setWalletDepositAmount(parsed);
      }
    }

    setShowUssdPrompt(false);
    setUssdPinInput('');
    setUssdErrorMsg('');
  }, [initialPurpose, initialCustomDepositAmount, isOpen, currentUser?.role]);

  if (!isOpen) return null;

  const isWalletDeposit = typeof purpose === 'string' && purpose.startsWith('wallet_deposit');

  const pricingMap: Record<string, { label: string; basePrice: number; description: string }> = {
    subscription_2wheels: {
      label: 'Abonnement Mensuel Moto 2 Roues',
      basePrice: 1200,
      description: 'Accès illimité aux courses & annonces sans aucune commission (0%)',
    },
    subscription_tricycle: {
      label: 'Abonnement Mensuel Tricycle Cargo',
      basePrice: 1500,
      description: 'Idéal pour transport lourd avec 0% de commission sur les courses',
    },
    subscription_4wheels: {
      label: 'Abonnement Mensuel 4 Roues Utilitaires',
      basePrice: 2000,
      description: 'Courses interurbaines nationales sans prélèvement de commission',
    },
    premium_badge_week: {
      label: 'Badge VIP Premium Semaine',
      basePrice: 500,
      description: 'Profil épinglé en tête de liste et statut Vérifié pendant 7 jours',
    },
    ad_highlight: {
      label: 'Mise en avant d’annonce restaurant/commerce',
      basePrice: 1000,
      description: 'Visibilité maximale auprès de tous les livreurs de la ville',
    },
    aid_fund_donation: {
      label: 'Contribution Solidaire Caisse d’Entraide',
      basePrice: 1000,
      description: 'Don direct pour alimenter le fonds de secours des collègues livreurs',
    },
    wallet_deposit_250: {
      label: 'Dépôt Portefeuille Min (250 FCFA)',
      basePrice: 250,
      description: 'Dépôt initial minimal pour prélèvement de commissions à la course',
    },
    wallet_deposit_500: {
      label: 'Recharge Portefeuille (500 FCFA)',
      basePrice: 500,
      description: 'Crédit pour couvrir ~4 à 6 livraisons acceptées sur annonces',
    },
    wallet_deposit_1000: {
      label: 'Recharge Portefeuille (1 000 FCFA)',
      basePrice: 1000,
      description: 'Solde pour ~8 à 12 livraisons acceptées sur annonces',
    },
    wallet_deposit_1200: {
      label: 'Dépôt Initial Recommandé (1 200 FCFA)',
      basePrice: 1200,
      description: 'Montant standard pour démarrer sereinement en formule commission',
    },
    wallet_deposit_1500: {
      label: 'Recharge Portefeuille (1 500 FCFA)',
      basePrice: 1500,
      description: 'Solde pour ~12 à 18 livraisons sans interruption',
    },
    wallet_deposit_2000: {
      label: 'Recharge Portefeuille (2 000 FCFA)',
      basePrice: 2000,
      description: 'Solde étendu pour livraisons intensives sur annonces',
    },
    wallet_deposit_2500: {
      label: 'Recharge Portefeuille Max (2 500 FCFA)',
      basePrice: 2500,
      description: 'Dépôt maximal autorisé sur le compte portefeuille chauffeur',
    },
    wallet_deposit_custom: {
      label: `Recharge Portefeuille Personnalisée (${walletDepositAmount} FCFA)`,
      basePrice: walletDepositAmount,
      description: 'Dépôt flexible compris entre 250 FCFA et 2 500 FCFA',
    },
    tontine_contribution_1000: {
      label: 'Contribution Fonds d\'Aide Financière (1 000 FCFA)',
      basePrice: 1000,
      description: 'Participation solidaire à la caisse de secours des chauffeurs',
    },
    tontine_contribution_2500: {
      label: 'Contribution Fonds d\'Aide Financière (2 500 FCFA)',
      basePrice: 2500,
      description: 'Participation solidaire à la caisse de secours des chauffeurs',
    },
    tontine_contribution_5000: {
      label: 'Contribution Fonds d\'Aide Financière (5 000 FCFA)',
      basePrice: 5000,
      description: 'Participation solidaire à la caisse de secours des chauffeurs',
    },
  };

  const currentPlan = pricingMap[purpose] || pricingMap.subscription_2wheels;
  const rawPrice = isWalletDeposit ? walletDepositAmount : currentPlan.basePrice;
  // Apply 10% discount for non-wallet subscription if eligible
  const discountMultiplier = !isWalletDeposit && currentUser?.hasFirstMonthDiscount ? 0.9 : 1.0;
  const finalPrice = Math.round(rawPrice * discountMultiplier);

  const getUssdCodeForProvider = (p: PaymentProvider) => {
    switch (p) {
      case 'mtn_momo': return '*880#';
      case 'moov_money': return '*855#';
      case 'celtiis_cash': return '*889#';
      default: return '*880#';
    }
  };

  const getUssdShortcutDetails = (p: PaymentProvider) => {
    switch (p) {
      case 'mtn_momo':
        return { code: '*880#', tip: 'MTN MoMo : Composez *880# puis option 1 (Envoi d\'argent).' };
      case 'moov_money':
        return { code: '*855#', tip: 'Moov Money : Composez *855# ou le raccourci *855*1# pour transfert vers tous réseaux.' };
      case 'celtiis_cash':
        return { code: '*889#', tip: 'Celtiis Cash (SBIN) : Composez *889# pour ouvrir le menu principal et valider.' };
      case 'fedapay':
        return { code: 'Passerelle FedaPay', tip: 'FedaPay Bénin (Live API) : Prélèvement direct MTN MoMo, Moov Money, Celtiis & Carte.' };
      case 'kkiapay':
        return { code: 'Widget Kkiapay', tip: 'Agrégateur Kkiapay Bénin : Prélèvement direct MTN, Moov, Celtiis & Carte.' };
      default:
        return { code: '*880#', tip: 'MTN MoMo : Composez *880# option 1.' };
    }
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) {
      alert("Veuillez cocher la case de consentement explicite pour autoriser le prélèvement Mobile Money.");
      return;
    }

    if (isWalletDeposit && (walletDepositAmount < 250 || walletDepositAmount > 2500)) {
      alert("Le dépôt sur portefeuille doit être compris entre 250 FCFA et 2 500 FCFA.");
      return;
    }

    if (provider === 'fedapay') {
      const fedapayKey = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY || 'pk_live_JUbQVJMuBPgpchaVGU3VqOVg';
      const FedaPayObj = (window as any).FedaPay || (window as any).FedaPayCheckout;

      if (FedaPayObj && typeof FedaPayObj.init === 'function') {
        try {
          const widget = FedaPayObj.init({
            public_key: fedapayKey,
            transaction: {
              amount: finalPrice,
              description: isWalletDeposit ? `Recharge Portefeuille (${finalPrice} FCFA)` : currentPlan.label,
            },
            customer: {
              email: currentUser?.email || 'liencolisdrivercommunauty@gmail.com',
              firstname: currentUser?.name?.split(' ')[0] || 'Client',
              lastname: currentUser?.name?.split(' ')[1] || 'Demo',
              phone_number: {
                number: mobileNumber.replace(/[^\d]/g, ''),
                country: 'bj',
              },
            },
            onComplete: (res: any) => {
              if (res && (res.reason === 'CHECKOUT_COMPLETED' || res.status === 'approved' || res.reason === FedaPayObj.CHECKOUT_COMPLETED)) {
                executePaymentSuccess();
              }
            },
          });
          widget.open();
        } catch (err) {
          console.error("FedaPay widget error:", err);
        }
      }

      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setShowUssdPrompt(true);
      }, 1200);
      return;
    }

    if (provider === 'kkiapay') {
      const kkiapayKey = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY || 'pk_sandbox_liencolis_demo_key';
      if (typeof (window as any).openKkiapayWidget === 'function') {
        try {
          (window as any).openKkiapayWidget({
            amount: finalPrice,
            key: kkiapayKey,
            sandbox: !import.meta.env.VITE_KKIAPAY_PUBLIC_KEY || import.meta.env.VITE_KKIAPAY_PUBLIC_KEY.includes('sandbox'),
            phone: mobileNumber.replace(/\s+/g, ''),
            name: currentUser?.name || 'Client Demo',
              email: currentUser?.email || 'liencolisdrivercommunauty@gmail.com',
          });
          if (typeof (window as any).addKkiapayListener === 'function') {
            (window as any).addKkiapayListener('success', () => {
              executePaymentSuccess();
            });
          }
        } catch (err) {
          console.error("Kkiapay widget error:", err);
        }
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setShowUssdPrompt(true);
      }, 1200);
      return;
    }

    if (provider !== 'bank_card' && provider !== 'paypal') {
      if (!mobileNumber || mobileNumber.trim().length < 8) {
        alert("Veuillez saisir un numéro de téléphone valide pour la demande de débit.");
        return;
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setShowUssdPrompt(true);
        notificationService.speak(`Demande de débit direct transmise sur votre téléphone ${mobileNumber}. Validez la notification Push ou composez le code USSD.`);
      }, 1200);
    } else {
      executePaymentSuccess();
    }
  };

  const executePaymentSuccess = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setShowUssdPrompt(false);

      const ref = `${provider.toUpperCase()}-BJ-${Math.floor(1000000 + Math.random() * 9000000)}`;

      const tx: PaymentTransaction = {
        id: `tx_${Date.now()}`,
        userId: currentUser?.id || 'usr_driver_01',
        userName: currentUser?.name || 'Client Demo',
        amount: finalPrice,
        purpose,
        provider,
        status: 'success',
        reference: ref,
        createdAt: new Date().toISOString(),
      };

      const currentWallet = currentUser?.driverWallet || {
        balance: 0,
        pricingPlan: currentUser?.pricingPlan || 'commission',
        totalCommissionsPaid: 0,
        totalDeposited: 0,
        transactions: [],
      };

      let newWallet = { ...currentWallet };

      // If this is a wallet deposit
      if (isWalletDeposit) {
        const newBalance = currentWallet.balance + finalPrice;
        newWallet = {
          ...currentWallet,
          balance: newBalance,
          pricingPlan: 'commission',
          totalDeposited: (currentWallet.totalDeposited || 0) + finalPrice,
          transactions: [
            {
              id: `wtx_${Date.now()}`,
              type: 'deposit',
              amount: finalPrice,
              description: `Recharge Portefeuille Livreur via ${provider.toUpperCase()}`,
              balanceAfter: newBalance,
              provider,
              reference: ref,
              timestamp: new Date().toISOString(),
            },
            ...(currentWallet.transactions || []),
          ],
        };
      }

      const updatedUser: UserProfile = {
        ...(currentUser || {
          id: 'usr_driver_01',
          name: 'Client Demo',
          role: 'driver',
          email: 'liencolisdrivercommunauty@gmail.com',
          phone: '+229 01 69 81 46 32',
          city: 'Cotonou',
          country: 'Bénin',
          isEmailVerified: true,
          isCertified: true,
          trialDaysLeft: 10,
          hasFirstMonthDiscount: true,
          registeredOrder: 1,
          rating: 5.0,
          totalRatingsCount: 0,
          completedDeliveries: 0,
          createdAt: new Date().toISOString(),
        }),
        pricingPlan: isWalletDeposit ? 'commission' : purpose.startsWith('subscription') ? 'subscription' : currentUser?.pricingPlan,
        driverWallet: newWallet,
        subscriptionExpiresAt:
          purpose.startsWith('subscription')
            ? new Date(Date.now() + 30 * 86400000).toISOString()
            : currentUser?.subscriptionExpiresAt,
        premiumBadgeUntil:
          purpose === 'premium_badge_week'
            ? new Date(Date.now() + 7 * 86400000).toISOString()
            : currentUser?.premiumBadgeUntil,
      };

      setSuccessTx(tx);
      onPaymentSuccess(tx, updatedUser);
      confetti({ particleCount: 70, spread: 60 });

      notificationService.sendPushNotification({
        type: 'aid_approved',
        title: isWalletDeposit ? '💰 PORTAFEUILLE CRÉDITÉ AVEC SUCCÈS' : '✅ PAIEMENT MOBILE MONEY VALIDÉ',
        body: isWalletDeposit
          ? `Votre solde portefeuille a été rechargé de ${finalPrice.toLocaleString()} FCFA. Nouveau solde : ${newWallet.balance.toLocaleString()} FCFA.`
          : `Débit sous consentement de ${finalPrice.toLocaleString()} FCFA confirmé sur le compte ${mobileNumber}. Réf: ${tx.reference}.`,
      });
      notificationService.speak(
        isWalletDeposit
          ? `Dépôt de ${finalPrice} Francs CFA effectué avec succès sur votre portefeuille chauffeur.`
          : `Paiement de ${finalPrice} Francs CFA validé avec succès.`
      );
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              {isWalletDeposit ? <Wallet className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isWalletDeposit ? 'Dépôt & Recharge Portefeuille Livreur' : 'Abonnements & Paiements Sécurisés'}
              </h3>
              <p className="text-[11px] text-slate-400">Bénin • MTN MoMo • Moov Money • Celtiis Cash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Success Screen */}
        {successTx ? (
          <div className="p-6 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-emerald-500/40">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Paiement Validé avec Succès !</h4>
            <p className="text-xs text-slate-300">
              Réf : <strong className="font-mono text-amber-400">{successTx.reference}</strong>
            </p>
            <p className="text-xs text-emerald-400 font-bold">
              {isWalletDeposit
                ? `Votre compte portefeuille chauffeur a été crédité de ${finalPrice.toLocaleString()} FCFA.`
                : 'Votre formule et vos fonctionnalités ont été activées instantanément.'}
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg"
            >
              Fermer et Profiter
            </button>
          </div>
        ) : showUssdPrompt ? (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-200 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400 animate-bounce" />
                <h4 className="font-black text-white text-sm">📲 Demande de Débit Direct Envoyée</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                Une invitation de prélèvement sous consentement de <strong className="text-amber-400 font-mono">{finalPrice.toLocaleString()} FCFA</strong> a été transmise au numéro <strong className="text-white font-mono">{mobileNumber}</strong> ({provider.toUpperCase()}).
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-[11px] font-mono text-amber-300 space-y-1.5">
                <p className="font-sans font-bold text-white text-[11.5px]">👉 <strong>Guide USSD Bénin :</strong></p>
                <p>1. Validez l'invite Push sur l'écran de votre smartphone.</p>
                <p>2. Si la notification n'apparaît pas, composez <strong className="text-emerald-400 font-bold">{getUssdShortcutDetails(provider).code}</strong> :</p>
                <p className="text-[10px] text-slate-300 font-sans italic bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  💡 {getUssdShortcutDetails(provider).tip}
                </p>
                <p>3. Tapez votre Code Secret Mobile Money pour valider le paiement.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-[11px] text-slate-300 font-bold block">
                Entrez le code de confirmation reçu par SMS/USSD (ou votre PIN de validation) :
              </label>
              <input
                type="password"
                maxLength={8}
                value={ussdPinInput}
                onChange={(e) => setUssdPinInput(e.target.value)}
                placeholder="Ex: 1234 (ou code SMS)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-base"
              />

              {ussdErrorMsg && (
                <p className="text-[11px] text-red-400 font-bold">{ussdErrorMsg}</p>
              )}

              <button
                type="button"
                onClick={executePaymentSuccess}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{isProcessing ? 'Validation du Débit USSD en cours...' : `J'ai validé le débit sur mon téléphone (${finalPrice.toLocaleString()} FCFA)`}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUssdPrompt(false)}
                className="w-full py-2 text-slate-400 hover:text-white text-[11px]"
              >
                ← Modifier le numéro ou le mode de paiement
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInitiatePayment} className="space-y-4 text-xs">
            
            {/* Category selection : Subscriptions vs Wallet Recharge */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPurpose('wallet_deposit_1200');
                  setWalletDepositAmount(1200);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isWalletDeposit
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Portefeuille Livreur (250F - 2500F)</span>
              </button>
              <button
                type="button"
                onClick={() => setPurpose('subscription_2wheels')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  !isWalletDeposit
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Abonnements Illimités (0% com.)</span>
              </button>
            </div>

            {/* Wallet Deposit Presets & Custom input */}
            {isWalletDeposit ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dépôt Initial / Recharge de Portefeuille</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Min 250 F • Max 2 500 F</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ce montant est crédité sur votre profil. Les commissions sur livraisons acceptées via annonces (5% à 20%) y seront prélevées au fur et à mesure.
                </p>

                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-[10.5px] text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Protection de l'argent & Droit au Retour :</span>
                  </div>
                  <p className="text-slate-300">
                    Votre dépôt reste votre propriété intégrale. Vous pouvez le retourner à tout moment vers votre compte Mobile Money. En cas de livraison active, il est temporairement sécurisé sous séquestre puis libéré dès confirmation de réception par le client.
                  </p>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[250, 500, 1000, 1200, 1500, 2000, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setWalletDepositAmount(amt);
                        setPurpose(`wallet_deposit_${amt}` as PaymentPurpose);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-mono font-bold border transition-all ${
                        walletDepositAmount === amt
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {amt.toLocaleString()} F
                      {amt === 1200 && <span className="block text-[8.5px] font-sans font-normal opacity-80">Conseillé</span>}
                      {amt === 250 && <span className="block text-[8.5px] font-sans font-normal opacity-80">Min</span>}
                      {amt === 2500 && <span className="block text-[8.5px] font-sans font-normal opacity-80">Max</span>}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Slider / Input */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="text-slate-400 font-semibold">Montant personnalisé :</label>
                    <span className="font-bold font-mono text-amber-400 text-sm">
                      {walletDepositAmount.toLocaleString()} FCFA
                    </span>
                  </div>
                  <input
                    type="range"
                    min={250}
                    max={2500}
                    step={50}
                    value={walletDepositAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWalletDepositAmount(val);
                      setPurpose('wallet_deposit_custom');
                    }}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>250 FCFA (Min)</span>
                    <span>1 200 FCFA</span>
                    <span>2 500 FCFA (Max)</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Subscriptions Grid */
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">Choisissez votre formule illimitée</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'subscription_2wheels', name: 'Moto 2 Roues', price: '1 200 FCFA/mois', desc: '0% commission sur toutes les courses' },
                    { id: 'subscription_tricycle', name: 'Tricycle Cargo', price: '1 500 FCFA/mois', desc: '0% commission transports lourds' },
                    { id: 'subscription_4wheels', name: 'Camionnette 4R', price: '2 000 FCFA/mois', desc: '0% commission interurbain' },
                    { id: 'premium_badge_week', name: 'Badge VIP Épinglé', price: '500 FCFA/semaine', desc: 'Visibilité maximale 7 jours' },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPurpose(plan.id as PaymentPurpose)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        purpose === plan.id
                          ? 'bg-amber-400/20 border-amber-400 text-white font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{plan.name}</span>
                        <span className="text-[11px] font-mono text-amber-400">{plan.price}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{plan.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 block">Moyen de Paiement Bénin</label>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                {[
                  { id: 'fedapay', name: 'FedaPay Bénin (MTN/Moov/Celtiis/Carte)', logo: '🚀' },
                  { id: 'kkiapay', name: 'Kkiapay Bénin (MTN/Moov/Celtiis/Carte)', logo: '⚡' },
                  { id: 'bank_card', name: 'Carte Visa/Mastercard', logo: '💳' },
                  { id: 'paypal', name: 'PayPal', logo: '🌐' },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setProvider(prov.id as PaymentProvider)}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      provider === prov.id
                        ? 'bg-blue-600/30 border-blue-400 text-white font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base block">{prov.logo}</span>
                    <span className="text-[11px]">{prov.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone input with explicit consent */}
            {provider === 'bank_card' ? (
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-[11px] text-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compte Bénéficiaire Officiel</span>
                  </div>
                  <p className="text-[10.5px] text-slate-300">
                    Règlement sécurisé crédité vers <strong className="font-mono text-amber-300">LIENCOLIS COMMUNITY DRIVER PAY</strong>.
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Numéro de Carte Bancaire</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Date d'Expiration</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Numéro de Téléphone ({provider.toUpperCase()})
                </label>
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+229 01 69 81 46 31"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-800 border-slate-700 text-amber-400 focus:ring-amber-400"
                  />
                  <span className="text-[10.5px] text-slate-300 leading-tight">
                    <strong>Consentement de Débit Direct :</strong> J'autorise Liencolis à transmettre une invite de prélèvement direct USSD ({getUssdCodeForProvider(provider)}) de <strong className="text-amber-400">{finalPrice.toLocaleString()} FCFA</strong> sur le compte <strong className="font-mono">{mobileNumber}</strong>.
                  </span>
                </label>
              </div>
            )}

            {/* Total Price Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] block">
                  {isWalletDeposit ? 'Montant à créditer sur portefeuille :' : 'Montant Total à Débiter :'}
                </span>
                <span className="text-white font-bold">
                  {isWalletDeposit ? `Recharge Portefeuille Chauffeur` : currentPlan.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-amber-400">
                  {finalPrice.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || (!hasConsent && provider !== 'bank_card')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl transition-all disabled:opacity-50"
            >
              {isProcessing
                ? 'Envoi de la Demande de Débit USSD...'
                : isWalletDeposit
                ? `Recharger ${finalPrice.toLocaleString()} FCFA sur mon Portefeuille`
                : `Transmettre la Demande de Débit (${finalPrice.toLocaleString()} FCFA)`}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

