import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  FirebaseUser,
} from './firebase';

export interface LoginResponse {
  success: boolean;
  uid?: string;
  email?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  error?: string;
  emailVerified?: boolean;
}

export interface RegisterResponse {
  success: boolean;
  uid?: string;
  email?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  error?: string;
}

const AUTH_SESSION_KEY = 'liencolis_auth_session';

export function getFriendlyAuthErrorMessage(error: any): { message: string; code: string; isEmailInUse?: boolean; isTooManyRequests?: boolean } {
  const rawCode = error?.code || (typeof error?.message === 'string' && error.message.includes('(') ? error.message.match(/\(([^)]+)\)/)?.[1] : '') || '';
  const code = rawCode.toLowerCase();

  if (code.includes('email-already-in-use')) {
    return {
      code: 'auth/email-already-in-use',
      message: 'Ce compte existe déjà ! Votre adresse e-mail est déjà inscrite. Cliquez sur "Connexion" pour vous connecter ou "Mot de passe oublié" si nécessaire.',
      isEmailInUse: true,
    };
  }

  if (code.includes('too-many-requests')) {
    return {
      code: 'auth/too-many-requests',
      message: 'Trop de tentatives rapprochées. Par sécurité, Firebase a temporairement bloqué les requêtes. Veuillez patienter 2 à 3 minutes avant de réessayer.',
      isTooManyRequests: true,
    };
  }

  if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
    return {
      code: 'auth/wrong-password',
      message: 'Adresse e-mail ou mot de passe incorrect. Vérifiez vos identifiants ou utilisez "Mot de passe oublié".',
    };
  }

  if (code.includes('user-not-found')) {
    return {
      code: 'auth/user-not-found',
      message: 'Aucun compte associé à cette adresse e-mail. Veuillez basculer sur l’onglet "Inscription" pour créer votre compte.',
    };
  }

  if (code.includes('weak-password')) {
    return {
      code: 'auth/weak-password',
      message: 'Le mot de passe est trop court. Il doit contenir au moins 6 caractères.',
    };
  }

  if (code.includes('invalid-email')) {
    return {
      code: 'auth/invalid-email',
      message: 'Le format de l’adresse e-mail est invalide (ex: exemple@gmail.com).',
    };
  }

  if (code.includes('network-request-failed')) {
    return {
      code: 'auth/network-request-failed',
      message: 'Connexion Internet interrompue. Vérifiez votre réseau et réessayez.',
    };
  }

  return {
    code: rawCode || 'auth/unknown',
    message: error?.message || 'Une erreur est survenue lors de l’authentification. Veuillez réessayer.',
  };
}

export function setStoredSession(session: Partial<LoginResponse> | Partial<RegisterResponse>) {
  if (typeof window === 'undefined') return;

  const payload = {
    uid: session.uid,
    email: session.email,
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
    savedAt: Date.now(),
  };

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(payload));
}

export function getStoredSession(): Partial<LoginResponse> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasStoredSession(): boolean {
  return !!getStoredSession();
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;
    
    // Note: If email verification is required, we can warn or allow access
    const data: LoginResponse = {
      success: true,
      uid: user.uid,
      email: user.email ?? email,
      emailVerified: user.emailVerified,
      idToken: await user.getIdToken(),
      refreshToken: user.refreshToken,
      expiresIn: '3600',
    };

    setStoredSession(data);
    return data;
  } catch (error: any) {
    const friendly = getFriendlyAuthErrorMessage(error);
    const err: any = new Error(friendly.message);
    err.code = friendly.code;
    err.friendly = friendly;
    throw err;
  }
}

export async function register(email: string, password: string, name?: string): Promise<RegisterResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

    if (name && userCredential.user) {
      try {
        await updateProfile(userCredential.user, { displayName: name });
      } catch (profErr) {
        console.warn('Profile name update skipped:', profErr);
      }
    }

    try {
      await sendEmailVerification(userCredential.user);
    } catch (verifErr) {
      console.warn('Email verification send optional:', verifErr);
    }

    const data: RegisterResponse = {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email ?? email,
    };

    try {
      const idToken = await userCredential.user.getIdToken();
      setStoredSession({
        ...data,
        idToken,
        refreshToken: userCredential.user.refreshToken,
        expiresIn: '3600',
      });
    } catch {
      setStoredSession(data);
    }

    return data;
  } catch (error: any) {
    const friendly = getFriendlyAuthErrorMessage(error);
    const err: any = new Error(friendly.message);
    err.code = friendly.code;
    err.friendly = friendly;
    throw err;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    const friendly = getFriendlyAuthErrorMessage(error);
    const err: any = new Error(friendly.message);
    err.code = friendly.code;
    err.friendly = friendly;
    throw err;
  }
}

export async function refreshEmailVerificationStatus(): Promise<boolean> {
  const user: FirebaseUser | null = auth.currentUser;
  if (!user) return false;
  await reload(user);
  return user.emailVerified;
}

export async function resendEmailVerification(): Promise<void> {
  const user: FirebaseUser | null = auth.currentUser;
  if (!user) throw new Error('Session d’inscription introuvable. Veuillez vous reconnecter.');
  await sendEmailVerification(user);
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Logout request failed:', error);
  } finally {
    clearStoredSession();
  }
}
