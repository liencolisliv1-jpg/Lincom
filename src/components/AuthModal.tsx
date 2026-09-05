import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { LiencolisLogo } from './LiencolisLogo';
import { CameraCaptureModal } from './CameraCaptureModal';
import { notificationService } from '../services/notificationService';
import { login, refreshEmailVerificationStatus, register, resendEmailVerification, setStoredSession } from '../services/authService';
import { storageService } from '../services/storageService';
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
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [forgotEmailInput, setForgotEmailInput] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const response = await register(email, password, name);
      setStoredSession(response);

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
        isEmailVerified: false,
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

      notificationService.sendPushNotification({
        type: 'recruitment',
        title: '✉️ Code de Confirmation Email',
        body: `Un lien de confirmation a été envoyé à ${email}. Consultez votre boîte de réception pour activer votre compte.`,
      });

      setMode('email_verification');
    } catch (error: any) {
      alert(error?.message || 'Impossible de créer le compte.');
    }
  };

  const handleResendCode = async () => {
    try {
      await resendEmailVerification();
      setVerificationError(null);
      setResendNotice(`Le lien de confirmation a été renvoyé à ${pendingUser?.email || email}.`);
    } catch (error: any) {
      setVerificationError(error?.message || 'Impossible de renvoyer l’e-mail de confirmation.');
    }

    setTimeout(() => {
      setResendNotice(null);
    }, 5000);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isVerified = await refreshEmailVerificationStatus();
      if (!isVerified) {
        setVerificationError('Votre adresse n’est pas encore confirmée. Ouvrez le lien reçu par e-mail, puis réessayez.');
        return;
      }

      setVerificationError(null);
      if (pendingUser) {
      const verifiedUser: UserProfile = {
        ...pendingUser,
        isEmailVerified: true,
      };

      notificationService.sendPushNotification({
        type: 'recruitment',
        title: '🎉 Email Vérifié avec Succès !',
        body: `Bienvenue chez Liencolis, ${verifiedUser.name} ! Votre compte est activé.`,
      });

      onLoginSuccess(verifiedUser);
      onClose();
      }
    } catch (error: any) {
      setVerificationError(error?.message || 'Impossible de vérifier l’adresse e-mail.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await login(email, password);
      const savedUser = storageService.getUser();
      if (savedUser && savedUser.email.toLowerCase() === email.toLowerCase()) {
        setStoredSession(response);
        onLoginSuccess(savedUser);
        onClose();
        return;
      }

      const user: UserProfile = {
        id: response.uid || 'usr_backend_' + Date.now(),
        name: name || 'Utilisateur Liencolis',
        firstName: name ? name.split(' ')[0] : 'Utilisateur',
        lastName: name ? name.split(' ').slice(1).join(' ') || '' : '',
        role,
        phone: phone || '+229 00 00 00 00',
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
      alert(error?.message || 'Connexion impossible. Vérifiez vos identifiants.');
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

        {/* Mode Switcher Buttons */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
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
                  onClick={() => setMode('forgot_password')}
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              Se Connecter à Liencolis
            </button>

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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl transition-all"
            >
              Créer mon Compte & Recevoir le Code Email
            </button>
          </form>
        )}

        {/* MODE 3: EMAIL VERIFICATION */}
        {mode === 'email_verification' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Validation de votre Email</h3>
            <p className="text-slate-300 text-xs">
              Un lien de confirmation a été envoyé à l'adresse <strong>{pendingUser?.email || email}</strong>.
              Ouvrez-le dans votre boîte de réception, puis revenez ici.
            </p>

            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-left space-y-1 text-emerald-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Message envoyé :</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Vérifiez aussi vos courriers indésirables si le message n'apparaît pas.
              </p>
            </div>

            {verificationError && (
              <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {resendNotice && (
              <div className="p-2 bg-indigo-950/80 border border-indigo-500/50 rounded-xl text-indigo-200 text-xs font-bold">
                {resendNotice}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-slate-400 text-[11px]">Après avoir cliqué sur le lien, appuyez sur le bouton ci-dessous.</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-amber-400 hover:text-amber-300 underline font-bold text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Renvoyer l’e-mail</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all"
            >
              Vérifier mon e-mail et activer mon compte
            </button>
          </form>
        )}

        {/* MODE 4: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 text-xs">
            <div className="text-center space-y-1">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Réinitialisation du Mot de Passe</h3>
              <p className="text-slate-300">
                Saisissez votre email pour recevoir le lien de réinstallation sécurisé.
              </p>
            </div>

            {forgotEmailSent ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p>
                  Lien de réinitialisation transmis avec succès à <strong>{forgotEmailInput || 'votre adresse email'}</strong> !
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmailSent(false);
                    setForgotError(null);
                    setMode('login');
                  }}
                  className="text-white underline font-bold"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!forgotEmailInput || !forgotEmailInput.includes('@')) {
                    setForgotError('Veuillez saisir une adresse email valide.');
                    return;
                  }
                  setForgotError(null);
                  setForgotEmailSent(true);
                  notificationService.sendPushNotification({
                    type: 'recruitment',
                    title: '🔑 Email de Récupération Transmis',
                    body: `Un lien de réinitialisation a été envoyé à ${forgotEmailInput}`,
                  });
                }}
                className="space-y-3"
              >
                {forgotError && (
                  <div className="p-2 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs">
                    {forgotError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  value={forgotEmailInput}
                  onChange={(e) => setForgotEmailInput(e.target.value)}
                  placeholder="votre.email@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer le Lien de Récupération</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setMode('login');
                  }}
                  className="w-full text-center text-slate-400 hover:text-white"
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
    </div>
  );
};
