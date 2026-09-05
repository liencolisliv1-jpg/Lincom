import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error('Veuillez confirmer votre adresse e-mail avant de vous connecter.');
    }
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
    const message = error?.message || 'Auth failed';
    throw new Error(message);
  }
}

export async function register(email: string, password: string, name?: string): Promise<RegisterResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }

    await sendEmailVerification(userCredential.user);

    const data: RegisterResponse = {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email ?? email,
    };

    setStoredSession({
      ...data,
      idToken: await userCredential.user.getIdToken(),
      refreshToken: userCredential.user.refreshToken,
      expiresIn: '3600',
    });

    return data;
  } catch (error: any) {
    const message = error?.message || 'Registration failed';
    throw new Error(message);
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
  if (!user) throw new Error('Session d’inscription introuvable. Veuillez recommencer l’inscription.');
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
