import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { LiencolisLogo } from './LiencolisLogo';
import { CameraCaptureModal } from './CameraCaptureModal';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { login, refreshEmailVerificationStatus, register, resendEmailVerification, sendPasswordReset, setStoredSession } from '../services/authService';
import { storageService } from '../services/storageService';
import { firebaseAuthService } from '../services/firebaseAuthService';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Building,
  Bike,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  KeyRound,
  Shield,
  Camera,
  RotateCcw,
  Send,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Settings,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onDeleteAccount: () => void;
  initialMode?: 'login' | 'register' | 'forgot_password';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onDeleteAccount,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'email_verification'>(
    initialMode
  );
  const [role, setRole] = useState<UserRole>('driver');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+229 ');
  const [city, setCity] = useState('Cotonou');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [vehicleType, setVehicleType] = useState<'moto_2wheels' | 'tricycle' | 'car_4wheels'>('moto_2wheels');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [emailDispatchStatus, setEmailDispatchStatus] = useState<{ sent: boolean; message?: string; isBadCredentials?: boolean } | null>(null);
  const [forgotEmailInput, setForgotEmailInput] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<{ message: string; isEmailInUse?: boolean; isTooManyRequests?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOAuthGuide, setShowOAuthGuide] = useState(false);
  const [copiedOAuthText, setCopiedOAuthText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOAuthText(label);
    setTimeout(() => setCopiedOAuthText(null), 2000);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await firebaseAuthService.loginWithGoogle({
        role,
        phone: phone && phone.trim() !== '+229' && phone.trim() !== '+229 ' ? phone.trim() : undefined,
        city,
        vehicleType,
        vehiclePlate,
      });

      storageService.setUser(user);
      onLoginSuccess(user);
      onClose();

      notificationService.sendPushNotification({
        type: 'recruitment',
        title: 'Connexion Google Réussie',
        body: `Bienvenue sur Liencolis, ${user.firstName || user.name} ! Vos 10 jours gratuits sont actifs.`,
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setAuthError({
        message: error?.message || 'Erreur lors de la connexion Google.',
        isEmailInUse: false,
        isTooManyRequests: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setAuthError({ message: 'Veuillez remplir tous les champs obligatoires (*).' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await register(email, password, name);
      setStoredSession(response);

      // Generate a 6-digit confirmation PIN
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      setVerificationError(null);
      setResendNotice(null);

      const newUser: UserProfile = {
        id: response.uid || `usr_${Date.now()}`,
        name,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        role,
        phone,
        email: response.email || email,
        city,
        country: 'Bénin',
        avatarUrl: avatarUrl || undefined,
        vehicleType: role === 'driver' ? vehicleType : undefined,
        vehiclePlate: role === 'driver' ? vehiclePlate || 'BJ-EN-COURS' : undefined,
        isEmailVerified: true,
        isCertified: false,
        trialDaysLeft: 10,
        hasFirstMonthDiscount: true,
        registeredOrder: 47,
        rating: 5.0,
        totalRatingsCount: 1,
        completedDeliveries: 0,
        createdAt: new Date().toISOString(),
      };

      setPendingUser(newUser);
      storageService.setUser(newUser);

      notificationService.sendPushNotification({
        type: 'recruitment',
        title: `🎉 Bienvenue chez LienColis, ${newUser.firstName || newUser.name} !`,
        body: `Votre compte est activé avec succès. Vos 10 jours d'essai gratuit sont démarrés !`,
      });

      // Non-blocking background email dispatch
      emailService.sendVerificationEmail({
        email: response.email || email,
        name,
        code: otp,
        role,
      }).catch(() => {});

      // Immediately log the user into the platform - zero blockage
      onLoginSuccess(newUser);
      onClose();
    } catch (error: any) {
      setAuthError({
        message: error?.message || 'Impossible de créer le compte.',
        isEmailInUse: error?.friendly?.isEmailInUse || error?.message?.includes('déjà inscrite') || error?.message?.includes('already-in-use'),
        isTooManyRequests: error?.friendly?.isTooManyRequests || error?.message?.includes('Trop de tentatives'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      await resendEmailVerification();

      emailService.sendVerificationEmail({
        email: pendingUser?.email || email,
        name: pendingUser?.name || name,
        code: newOtp,
        role: pendingUser?.role || role,
      }).then((res) => {
        if (res.isBadCredentials) {
          setEmailDispatchStatus({
            sent: false,
            isBadCredentials: true,
            message: "Google SMTP : Mot de passe d'application requis.",
          });
        }
      }).catch(() => {});

      setVerificationError(null);
      setResendNotice(`Nouveau code ${newOtp} généré pour ${pendingUser?.email || email}.`);
      notificationService.sendPushNotification({
        type: 'recruitment',
        title: `🔑 Nouveau Code LienColis : ${newOtp}`,
        body: `Votre nouveau code d’activation est ${newOtp}`,
      });
    } catch (error: any) {
      setVerificationError(error?.message || 'Impossible de renvoyer l’e-mail de confirmation.');
    }

    setTimeout(() => {
      setResendNotice(null);
    }, 6000);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    // Validate 6-digit code if entered OR allow instant bypass
    if (verificationCode.trim() && verificationCode.trim() !== generatedOtp) {
      setVerificationError(`Le code saisi est incorrect. Saisissez le code à 6 chiffres affiché (${generatedOtp}) ou cliquez sur "Activer mon compte directement".`);
      return;
    }

    if (pendingUser) {
      const verifiedUser: UserProfile = {
        ...pendingUser,
        isEmailVerified: true,
      };

      notificationService.sendPushNotification({
        type: 'recruitment',
        title: '🎉 Inscription Validée avec Succès !',
        body: `Bienvenue chez Liencolis, ${verifiedUser.name} ! Vos 10 jours gratuits sont activés.`,
      });

      onLoginSuccess(verifiedUser);
      onClose();
    }
  };

  const handleInstantActivate = () => {
    if (pendingUser) {
      const verifiedUser: UserProfile = {
        ...pendingUser,
        isEmailVerified: true,
      };

      notificationService.sendPushNotification({
        type: 'recruitment',
        title: '⚡ Compte Activé Immédiatement !',
        body: `Bienvenue chez Liencolis, ${verifiedUser.name} ! Vous pouvez démarrer dès maintenant.`,
      });

      onLoginSuccess(verifiedUser);
      onClose();
    }
  };

  const handleWhatsAppVerification = () => {
    const targetPhone = '2290169814631';
    const textMsg = encodeURIComponent(
      `Bonjour LienColis Bénin ! Je valide mon inscription.\n👤 Nom : ${pendingUser?.name || name}\n📧 Email : ${pendingUser?.email || email}\n🔑 Code OTP : ${generatedOtp || '123456'}`
    );
    window.open(`https://wa.me/${targetPhone}?text=${textMsg}`, '_blank');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await login(email, password);
      const savedUser = storageService.getUser();
      if (savedUser && savedUser.email.toLowerCase() === email.toLowerCase()) {
        setStoredSession(response);
        onLoginSuccess(savedUser);
        onClose();
        return;
      }

      const allUsers = storageService.getAllUsers();
      const existingUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        storageService.setUser(existingUser);
        setStoredSession(response);
        onLoginSuccess(existingUser);
        onClose();
        return;
      }

      const user: UserProfile = {
        id: response.uid || 'usr_backend_' + Date.now(),
        name: name || 'Utilisateur Liencolis',
        firstName: name ? name.split(' ')[0] : 'Utilisateur',
        lastName: name ? name.split(' ').slice(1).join(' ') || '' : '',
        role,
        phone: phone || '+229 01 00 00 00',
        email: response.email || email,
        city: city || 'Cotonou',
        country: 'Bénin',
        vehicleType: 'moto_2wheels',
        vehiclePlate: 'BJ-0000-AF',
        isEmailVerified: true,
        isCertified: true,
        trialDaysLeft: 10,
        hasFirstMonthDiscount: true,
        registeredOrder: 1,
        rating: 4.9,
        totalRatingsCount: 142,
        completedDeliveries: 386,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      setStoredSession(response);
      onLoginSuccess(user);
      onClose();
    } catch (error: any) {
      setAuthError({
        message: error?.message || 'Connexion impossible. Vérifiez vos identifiants.',
        isEmailInUse: false,
        isTooManyRequests: error?.friendly?.isTooManyRequests || error?.message?.includes('Trop de tentatives'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmailInput || !forgotEmailInput.includes('@')) {
      setForgotError('Veuillez saisir une adresse email valide.');
      return;
    }

    setIsLoading(true);
    setForgotError(null);

    try {
      await sendPasswordReset(forgotEmailInput);
      setForgotEmailSent(true);
      notificationService.sendPushNotification({
        type: 'recruitment',
        title: '🔑 Email de Récupération Transmis',
        body: `Un lien de réinitialisation sécurisé a été envoyé à ${forgotEmailInput}`,
      });
    } catch (error: any) {
      setForgotError(error?.message || 'Impossible d’envoyer le lien de réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
        
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <LiencolisLogo size="md" showSubtitle={true} />
          </div>

          {/* 150 Promo Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Offre 150 Premiers Inscrits : 10 jours GRATUITS + -10%</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {authError && (
          <div className="p-3.5 bg-red-950/90 border border-red-500/60 rounded-2xl text-red-200 text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-red-100">{authError.message}</p>
                {authError.isTooManyRequests && (
                  <p className="text-[11px] text-red-300">
                    💡 Astuce : Patientez 2 minutes ou réinitialisez votre mot de passe ci-dessous.
                  </p>
                )}
              </div>
            </div>

            {authError.isEmailInUse && (
              <div className="pt-2 border-t border-red-800/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-300">Vous avez déjà un compte ?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setMode('login');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-300 transition-colors shadow"
                >
                  <span>Passer à la Connexion</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode Switcher Buttons */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              setMode('login');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              setMode('register');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'register' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inscription (Nouveau)
          </button>
        </div>

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Mot de Passe</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmailInput(email);
                    setForgotError(null);
                    setForgotEmailSent(false);
                    setMode('forgot_password');
                  }}
                  className="text-amber-400 hover:underline text-[11px]"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se Connecter à Liencolis</span>
              )}
            </button>

            {/* Séparateur */}
            <div className="relative flex py-1.5 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ou avec Google</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Bouton Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuer avec Google (OAuth)</span>
            </button>

            {/* Lien d'aide OAuth Manuel */}
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowOAuthGuide(true)}
                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <Settings className="w-3 h-3 text-amber-400" />
                <span>Guide Activation OAuth Manuel sur lincom-1ecc6.web.app</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            {/* Step 1 Role Selection */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Votre Profil Liencolis *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'driver', label: '🛵 Livreur', desc: 'Béninois' },
                  { id: 'client', label: '👤 Particulier', desc: 'Client' },
                  { id: 'merchant', label: '🏪 Entreprise', desc: 'E-commerce' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      role === r.id
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-xs">{r.label}</span>
                    <span className="block text-[9px] text-slate-400">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name / Company Name */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                {role === 'merchant' ? "Nom de l'Entreprise ou du Responsable *" : "Nom et Prénom *"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'merchant' ? "Ex: Wax Élégance SARL" : "Ex: Germain Mensah"}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Profile Photo (All Roles) */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Aperçu avatar" className="w-10 h-10 rounded-xl object-cover object-center border border-amber-400" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Photo de Profil (Facultative)</span>
                  <span className="text-[10px] text-slate-400">Pour identifier votre compte</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{avatarUrl ? 'Changer' : 'Prendre Photo'}</span>
              </button>
            </div>

            {/* Phone (WhatsApp format) & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">N° WhatsApp Direct *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 01 69 81 46 31"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Ville de Résidence / Siège *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                >
                  {BENIN_CITY_NAMES.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                  <option value="Autre / International">Autre / International</option>
                </select>
              </div>
            </div>

            {/* If Driver: Vehicle Info */}
            {role === 'driver' && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Bike className="w-4 h-4" />
                  <span>Type d'Engin de Livraison</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'moto_2wheels', label: '2 Roues', sub: '1200F/m' },
                    { id: 'tricycle', label: 'Tricycle', sub: '1500F/m' },
                    { id: 'car_4wheels', label: '4 Roues', sub: '2000F/m' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleType(v.id as any)}
                      className={`p-1.5 rounded-lg text-center border text-[11px] font-bold ${
                        vehicleType === v.id
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>{v.label}</span>
                      <span className="block text-[9px] text-amber-300">{v.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email & Password with Visibility Toggle */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Adresse Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@gmail.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Mot de Passe Visible / Masqué *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="w-full px-3 pr-10 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Afficher/Masquer le mot de passe"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <span>Créer mon Compte & Démarrer</span>
              )}
            </button>

            {/* Séparateur */}
            <div className="relative flex py-1.5 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ou inscription rapide</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Bouton Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>S'inscrire avec Google (OAuth 1-Clic)</span>
            </button>

            {/* Lien d'aide OAuth Manuel */}
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowOAuthGuide(true)}
                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <Settings className="w-3 h-3 text-amber-400" />
                <span>Guide Activation OAuth Manuel sur lincom-1ecc6.web.app</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: EMAIL VERIFICATION & OTP */}
        {mode === 'email_verification' && (
          <div className="space-y-4 text-xs text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Validation de votre Inscription</h3>
              <p className="text-slate-300 text-xs">
                Email : <strong className="text-amber-300">{pendingUser?.email || email}</strong>
              </p>
            </div>

            {/* OTP Code Display Box */}
            <div className="p-3.5 bg-slate-950/90 border border-amber-400/40 rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Votre Code d'Activation Sécurisé (OTP)
              </span>
              <div className="text-2xl font-black tracking-widest text-amber-400 font-mono bg-slate-900 py-2 rounded-xl border border-slate-700">
                {generatedOtp || '749 218'}
              </div>
              <p className="text-[11px] text-slate-400">
                Saisissez ce code ci-dessous ou confirmez en 1 clic par WhatsApp.
              </p>
            </div>

            {/* 6-Digit OTP Form */}
            <form onSubmit={handleVerifyEmail} className="space-y-3 text-left">
              <div>
                <label className="font-semibold text-slate-300 block mb-1 text-xs text-center">
                  Entrez le Code à 6 Chiffres :
                </label>
                <div className="flex gap-2 justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={generatedOtp || '123456'}
                    className="w-48 text-center text-lg font-mono font-bold tracking-widest px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setVerificationCode(generatedOtp)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-[11px] font-bold"
                  >
                    Insérer
                  </button>
                </div>
              </div>

              {verificationError && (
                <div className="p-2.5 bg-red-950/90 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              {resendNotice && (
                <div className="p-2.5 bg-indigo-950/90 border border-indigo-500/60 rounded-xl text-indigo-200 text-xs font-bold text-center">
                  {resendNotice}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider le Code & Activer mon Compte</span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2 text-slate-500 text-[11px] my-1">
              <div className="h-px bg-slate-800 flex-1" />
              <span>OU CHOISISSEZ UNE OPTION DIRECTE</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Multi-channel Actions */}
            <div className="space-y-2">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsAppVerification}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>📲 Valider instantanément par WhatsApp (+229)</span>
              </button>

              {/* Instant Bypass Activation */}
              <button
                type="button"
                onClick={handleInstantActivate}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>⚡ Démarrer Directement (10 Jours Gratuits)</span>
              </button>
            </div>

            {/* Status of email dispatch */}
            {emailDispatchStatus && (
              <div className={`p-3 rounded-xl text-left text-xs border ${
                emailDispatchStatus.sent
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/70 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-start gap-2">
                  <Mail className={`w-4 h-4 shrink-0 mt-0.5 ${emailDispatchStatus.sent ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <div>
                    <span className="font-bold block">
                      {emailDispatchStatus.sent ? 'E-mail envoyé vers Gmail' : 'Information sur la réception Gmail'}
                    </span>
                    <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                      {emailDispatchStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Spam & Delivery Guidance */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-left space-y-2 text-slate-300 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pourquoi l'e-mail tarde ou n'apparaît pas ?</span>
                </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-amber-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Renvoyer l'e-mail</span>
                </button>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-slate-200">Dossiers Spams ou Promotions :</strong> Gmail classe fréquemment les courriels automatiques d'inscription dans l'onglet <em>Spams / Pourriels</em> ou <em>Promotions</em>.
                </li>
                <li>
                  <strong className="text-slate-200">Aucune attente nécessaire :</strong> Votre code à 6 chiffres (<span className="text-amber-300 font-mono font-bold">{generatedOtp}</span>) est généré en direct à l'écran. Vous pouvez cliquer sur <strong>« Insérer »</strong> ou <strong>« Valider le Code »</strong> sans attendre !
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* MODE 4: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 text-xs">
            <div className="text-center space-y-1">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Réinitialisation du Mot de Passe</h3>
              <p className="text-slate-300">
                Saisissez votre email pour recevoir le lien de réinstallation sécurisé ou utilisez l'assistance WhatsApp.
              </p>
            </div>

            {forgotEmailSent ? (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-center space-y-3">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
                <p className="text-xs font-medium">
                  Lien de réinitialisation transmis avec succès à <strong className="text-amber-300">{forgotEmailInput || 'votre adresse email'}</strong> !
                </p>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 text-[11px] text-left space-y-1.5">
                  <p className="font-bold text-amber-400 flex items-center gap-1">
                    <span>💡 E-mail non reçu dans votre boîte Gmail ?</span>
                  </p>
                  <p>1. Vérifiez vos <strong>Courriers Indésirables / Spams</strong> dans Gmail.</p>
                  <p>2. Si l'e-mail tarde, débloquez votre compte directement par WhatsApp ci-dessous.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const targetPhone = '2290169814631';
                    const textMsg = encodeURIComponent(
                      `Bonjour Support LienColis Bénin ! J'ai oublié mon mot de passe.\n📧 Adresse Email : ${forgotEmailInput}\nMerci de m'aider à réinitialiser mon compte.`
                    );
                    window.open(`https://wa.me/${targetPhone}?text=${textMsg}`, '_blank');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>📲 Assistance Réinitialisation Rapide WhatsApp (+229)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmailSent(false);
                    setForgotError(null);
                    setMode('login');
                  }}
                  className="text-white underline font-bold text-xs block mx-auto pt-1"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleForgotPasswordSubmit}
                className="space-y-3"
              >
                {forgotError && (
                  <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs">
                    {forgotError}
                  </div>
                )}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Votre Adresse Email Inscrite *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmailInput}
                    onChange={(e) => setForgotEmailInput(e.target.value)}
                    placeholder="votre.email@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black shadow-md flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Envoyer le Lien de Récupération Email</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-slate-500 text-[10px] my-1">
                  <div className="h-px bg-slate-800 flex-1" />
                  <span>OU ASSISTANCE DIRECTE BÉNIN</span>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const emailParam = forgotEmailInput ? forgotEmailInput : 'non spécifiée';
                    const targetPhone = '2290169814631';
                    const textMsg = encodeURIComponent(
                      `Bonjour Support LienColis Bénin ! J'ai oublié mon mot de passe.\n📧 Mon Email : ${emailParam}\nMerci de m'aider à débloquer mon compte.`
                    );
                    window.open(`https://wa.me/${targetPhone}?text=${textMsg}`, '_blank');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>📲 Débloquer mon Compte par WhatsApp (+229)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setMode('login');
                  }}
                  className="w-full text-center text-slate-400 hover:text-white pt-1"
                >
                  Annuler
                </button>
              </form>
            )}
          </div>
        )}

        {/* Delete Account & Close Dialog */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white"
          >
            Fermer la fenêtre
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Attention : Voulez-vous supprimer définitivement votre compte et désinstaller toutes vos données de Liencolis ?')) {
                onDeleteAccount();
                onClose();
              }
            }}
            className="text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer mon compte</span>
          </button>
        </div>

      </div>

      {/* Camera Capture Modal for Profile Photo */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={(photo) => setAvatarUrl(photo)}
        title="Prendre ma Photo de Profil"
      />

      {/* Modal Guide Activation OAuth Manuel */}
      {showOAuthGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Activation OAuth Manuel (Google)</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Projet : lincom-1ecc6</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOAuthGuide(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Domaine Officiel : https://lincom-1ecc6.web.app</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Pour que vos utilisateurs puissent se connecter en 1 clic avec leur compte Google/Gmail sur votre site officiel, l'authentification OAuth Google doit être activée sur la console Firebase de votre projet.
                </p>
              </div>

              {/* ETAPE 1 */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Étape 1 : Activer le fournisseur Google
                </span>
                <p className="text-[11px] text-slate-300">
                  Ouvrez la console Firebase, activez le bouton <strong>Google</strong> et sélectionnez l'e-mail d'assistance.
                </p>
                <a
                  href="https://console.firebase.google.com/project/lincom-1ecc6/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] mt-1 shadow"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ouvrir Firebase Sign-in Providers</span>
                </a>
              </div>

              {/* ETAPE 2 */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Étape 2 : URIs de redirection autorisées
                </span>
                <p className="text-[11px] text-slate-300">
                  Dans la console Google Cloud (OAuth 2.0 Client Web), vérifiez que les URIs de redirection suivantes sont bien enregistrées :
                </p>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="text-amber-300 truncate mr-2">https://lincom-1ecc6.firebaseapp.com/__/auth/handler</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('https://lincom-1ecc6.firebaseapp.com/__/auth/handler', 'uri-1')}
                      className="text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedOAuthText === 'uri-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="text-amber-300 truncate mr-2">https://lincom-1ecc6.web.app/__/auth/handler</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('https://lincom-1ecc6.web.app/__/auth/handler', 'uri-2')}
                      className="text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedOAuthText === 'uri-2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <a
                  href="https://console.cloud.google.com/apis/credentials?project=lincom-1ecc6"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] mt-1 shadow"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ouvrir Google Cloud Credentials</span>
                </a>
              </div>

              {/* ETAPE 3 : Test en direct */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowOAuthGuide(false);
                    handleGoogleSignIn();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tester la Connexion Google OAuth Maintenant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
