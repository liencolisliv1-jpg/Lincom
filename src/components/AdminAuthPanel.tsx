import React, { useState } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../services/firebase';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Database,
  CloudLightning,
} from 'lucide-react';

interface AdminAuthPanelProps {
  currentFirebaseUser: any;
  onAdminAuthenticated: (user: any) => void;
  onAdminLoggedOut: () => void;
}

export const AdminAuthPanel: React.FC<AdminAuthPanelProps> = ({
  currentFirebaseUser,
  onAdminAuthenticated,
  onAdminLoggedOut,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('admin@liencolis.example');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe administrateur.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegisterMode) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('Compte administrateur Firebase créé et connecté avec succès.');
        onAdminAuthenticated(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('Session administrateur sécurisée validée.');
        onAdminAuthenticated(cred.user);
      }
    } catch (err: any) {
      console.error('Firebase Admin Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Identifiants incorrects ou compte non encore créé. Cliquez sur "Créer le compte Super-Admin" pour l\'initialiser.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Ce compte existe déjà. Connectez-vous avec votre mot de passe.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        setErrorMsg(err.message || "Erreur d'authentification Firebase.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onAdminLoggedOut();
      setSuccessMsg('Déconnexion effectuée.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la déconnexion.');
    }
  };

  if (currentFirebaseUser) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-slate-100 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Authentification Firebase Cloud Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SUPER-ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Connecté en tant que : <strong className="text-amber-300 font-mono">{currentFirebaseUser.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Base Firestore Connectée</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se Déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 shadow-2xl space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>Accès Sécurisé Base de Données & Espace Administratif</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              FIREBASE AUTH
            </span>
          </h3>
          <p className="text-xs text-slate-300">
            Connectez-vous pour déverrouiller la synchronisation Firestore Cloud, la validation des pièces et la gestion des abonnements.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Email Super-Admin</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@liencolis.example"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Mot de Passe Secret</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            required
          />
        </div>

        <div className="flex flex-col justify-end gap-1.5">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <CloudLightning className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Connexion en cours...' : isRegisterMode ? 'Créer le Compte Admin' : 'Déverrouiller Espace Admin'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-[10px] text-slate-400 hover:text-amber-300 text-center underline font-medium"
          >
            {isRegisterMode ? 'Déjà un compte ? Se connecter' : 'Première utilisation ? Créer le compte Admin'}
          </button>
        </div>
      </form>
    </div>
  );
};
