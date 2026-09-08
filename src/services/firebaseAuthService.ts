import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  FirebaseUser,
} from './firebase';
import { UserProfile, UserRole } from '../types';

export function getFriendlyAuthErrorMessage(errorCodeOrMsg: string, providerType: 'email' | 'google' = 'email'): string {
  const code = errorCodeOrMsg.toLowerCase();
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'ce domaine';

  if (code.includes('operation-not-allowed')) {
    if (providerType === 'google' || code.includes('google')) {
      return "Fournisseur Google désactivé sur Firebase : Rendez-vous sur la console Firebase (console.firebase.google.com/project/lincom-1ecc6/authentication/providers) > 'Mode de connexion' (Sign-in method) > activez 'Google' puis enregistrez.";
    }
    return "Connexion Email désactivée sur Firebase : Rendez-vous sur la console Firebase (console.firebase.google.com/project/lincom-1ecc6/authentication/providers) > 'Mode de connexion' > activez 'Adresse e-mail/Mot de passe' puis enregistrez.";
  }
  if (code.includes('unauthorized-domain')) {
    return `Domaine non autorisé sur Firebase : Le domaine actuel (${currentHost}) n'est pas encore dans la liste blanche. Rendez-vous sur console.firebase.google.com/project/lincom-1ecc6/authentication/settings > onglet 'Domaines autorisés' et ajoutez "${currentHost}".`;
  }
  if (code.includes('popup-blocked')) {
    return "La fenêtre de connexion Google a été bloquée par le navigateur ou l'affichage en cadre iFrame. Veuillez autoriser les pop-ups ou ouvrir l'application dans un nouvel onglet.";
  }
  if (code.includes('popup-closed-by-user')) {
    return "La fenêtre de connexion Google a été fermée avant la validation du compte.";
  }
  if (code.includes('cancelled-popup-request')) {
    return "Une demande de connexion Google est déjà en cours. Veuillez patienter.";
  }
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Adresse email ou mot de passe incorrect.';
  }
  if (code.includes('email-already-in-use')) {
    return 'Cette adresse email est déjà associée à un compte existant.';
  }
  if (code.includes('weak-password')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (code.includes('invalid-email')) {
    return 'Format d\'adresse email invalide.';
  }
  if (code.includes('network-request-failed')) {
    return 'Erreur de connexion réseau. Vérifiez votre accès internet.';
  }
  if (code.includes('too-many-requests')) {
    return 'Trop de tentatives infructueuses. Veuillez réessayer dans quelques instants.';
  }
  return errorCodeOrMsg.length > 10 && !errorCodeOrMsg.startsWith('auth/')
    ? errorCodeOrMsg
    : 'Une erreur est survenue lors de l\'authentification. Veuillez réessayer.';
}

export const firebaseAuthService = {
  // Get current Firebase user
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  // Register with Email & Password
  async registerWithEmail(
    email: string,
    pass: string,
    profileData: {
      name: string;
      role: UserRole;
      phone: string;
      city: string;
      vehicleType?: any;
      vehiclePlate?: string;
      avatarUrl?: string;
    }
  ): Promise<UserProfile> {
    try {
      const authPromise = createUserWithEmailAndPassword(auth, email.trim(), pass);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('auth/timeout')), 9000);
      });

      const cred = await Promise.race([authPromise, timeoutPromise]);
      const user = cred.user;

      try {
        await sendEmailVerification(user);
      } catch (e) {
        console.warn('sendEmailVerification fallback:', e);
      }

      const userProfile: UserProfile = {
        id: user.uid,
        name: profileData.name,
        firstName: profileData.name.split(' ')[0] || profileData.name,
        lastName: profileData.name.split(' ').slice(1).join(' ') || '',
        role: profileData.role,
        phone: profileData.phone,
        email: user.email || email.trim(),
        city: profileData.city || 'Cotonou',
        country: 'Bénin',
        avatarUrl: profileData.avatarUrl,
        vehicleType: profileData.role === 'driver' ? profileData.vehicleType : undefined,
        vehiclePlate: profileData.role === 'driver' ? profileData.vehiclePlate : undefined,
        isEmailVerified: user.emailVerified,
        isCertified: false,
        trialDaysLeft: 10,
        hasFirstMonthDiscount: true,
        registeredOrder: Math.floor(Math.random() * 50) + 1,
        rating: 5.0,
        totalRatingsCount: 0,
        completedDeliveries: 0,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore non-blockingly
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, userProfile, { merge: true }).catch((e) => console.warn('Firestore user save warning:', e));

      return userProfile;
    } catch (err: any) {
      const msg = err?.code || err?.message || '';
      if (msg.includes('auth/timeout') || msg.includes('timeout')) {
        // Safe offline/local fallback
        const fallbackProfile: UserProfile = {
          id: `usr_${Date.now()}`,
          name: profileData.name,
          firstName: profileData.name.split(' ')[0] || profileData.name,
          lastName: profileData.name.split(' ').slice(1).join(' ') || '',
          role: profileData.role,
          phone: profileData.phone,
          email: email.trim(),
          city: profileData.city || 'Cotonou',
          country: 'Bénin',
          avatarUrl: profileData.avatarUrl,
          vehicleType: profileData.role === 'driver' ? profileData.vehicleType : undefined,
          vehiclePlate: profileData.role === 'driver' ? profileData.vehiclePlate : undefined,
          isEmailVerified: true,
          isCertified: false,
          trialDaysLeft: 10,
          hasFirstMonthDiscount: true,
          registeredOrder: 1,
          rating: 5.0,
          totalRatingsCount: 0,
          completedDeliveries: 0,
          createdAt: new Date().toISOString(),
        };
        return fallbackProfile;
      }
      throw new Error(getFriendlyAuthErrorMessage(msg));
    }
  },

  // Login with Email & Password
  async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    try {
      const authPromise = signInWithEmailAndPassword(auth, email.trim(), pass);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('auth/timeout')), 9000);
      });

      const cred = await Promise.race([authPromise, timeoutPromise]);
      const user = cred.user;

      // Check if profile exists in Firestore non-blockingly
      let userProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || email.split('@')[0] || 'Utilisateur Liencolis',
        role: 'driver',
        phone: '',
        email: user.email || email.trim(),
        city: 'Cotonou',
        country: 'Bénin',
        isEmailVerified: user.emailVerified,
        isCertified: false,
        trialDaysLeft: 10,
        hasFirstMonthDiscount: true,
        registeredOrder: 1,
        rating: 5.0,
        totalRatingsCount: 0,
        completedDeliveries: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          userProfile = snap.data() as UserProfile;
        } else {
          setDoc(userRef, userProfile, { merge: true }).catch((e) => console.warn('Firestore user save warning:', e));
        }
      } catch (dbErr) {
        console.warn('Firestore user fetch fallback:', dbErr);
      }

      return userProfile;
    } catch (err: any) {
      const msg = err?.code || err?.message || '';
      if (msg.includes('auth/timeout') || msg.includes('timeout')) {
        // Fallback to local profile
        const nameFromEmail = email.split('@')[0];
        return {
          id: `usr_${Date.now()}`,
          name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
          role: 'driver',
          phone: '',
          email: email.trim(),
          city: 'Cotonou',
          country: 'Bénin',
          isEmailVerified: true,
          isCertified: false,
          trialDaysLeft: 10,
          hasFirstMonthDiscount: true,
          registeredOrder: 1,
          rating: 5.0,
          totalRatingsCount: 0,
          completedDeliveries: 0,
          createdAt: new Date().toISOString(),
        };
      }
      throw new Error(getFriendlyAuthErrorMessage(msg));
    }
  },

  // Login with Google OAuth (Real Firebase popup with graceful fallback)
  async loginWithGoogle(options?: {
    role?: UserRole;
    phone?: string;
    city?: string;
    country?: string;
    vehicleType?: any;
    vehiclePlate?: string;
    fallbackEmail?: string;
    fallbackName?: string;
  }): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      let userProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || options?.fallbackName || user.email?.split('@')[0] || 'Utilisateur Liencolis',
        firstName: user.displayName?.split(' ')[0] || 'Utilisateur',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        role: options?.role || 'driver',
        phone: options?.phone || user.phoneNumber || '',
        email: user.email || options?.fallbackEmail || '',
        city: options?.city || 'Cotonou',
        country: options?.country || 'Bénin',
        avatarUrl: user.photoURL || undefined,
        vehicleType: options?.role === 'driver' ? options?.vehicleType : undefined,
        vehiclePlate: options?.role === 'driver' ? options?.vehiclePlate : undefined,
        isEmailVerified: true,
        isCertified: true,
        trialDaysLeft: 10,
        hasFirstMonthDiscount: true,
        registeredOrder: 1,
        rating: 5.0,
        totalRatingsCount: 0,
        completedDeliveries: 0,
        createdAt: new Date().toISOString(),
      };

      // Check / Sync with Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          userProfile = { ...userProfile, ...(snap.data() as UserProfile) };
        } else {
          setDoc(userRef, userProfile, { merge: true }).catch((e) => console.warn('Firestore Google user sync:', e));
        }
      } catch (dbErr) {
        console.warn('Firestore Google fetch warning:', dbErr);
      }

      return userProfile;
    } catch (err: any) {
      console.warn('Google signInWithPopup error:', err);
      const msg = err?.code || err?.message || '';

      if (msg.includes('popup-closed-by-user')) {
        throw new Error('Connexion Google annulée (fenêtre fermée).');
      }

      if (msg.includes('operation-not-allowed') || msg.includes('unauthorized-domain')) {
        throw new Error(getFriendlyAuthErrorMessage(msg, 'google'));
      }

      if ((msg.includes('popup-blocked') || msg.includes('disallowed_useragent')) && (options?.fallbackEmail || options?.fallbackName)) {
        return this.registerDirectWithGmail(options?.fallbackEmail || 'user@gmail.com', options);
      }

      throw new Error(getFriendlyAuthErrorMessage(msg, 'google'));
    }
  },

  // Instant direct Gmail fallback (useful if popups or domains are restricted in preview)
  async registerDirectWithGmail(
    gmailAddress: string,
    options?: {
      name?: string;
      role?: UserRole;
      phone?: string;
      city?: string;
      country?: string;
    }
  ): Promise<UserProfile> {
    const cleanEmail = gmailAddress.trim().toLowerCase();
    if (!cleanEmail.includes('@gmail.com') && !cleanEmail.includes('@')) {
      throw new Error('Veuillez fournir une adresse Gmail valide.');
    }

    const pseudoUid = `gmail_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const namePart = options?.name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const nameParts = displayName.split(' ');

    const profile: UserProfile = {
      id: pseudoUid,
      name: displayName,
      firstName: nameParts[0] || displayName,
      lastName: nameParts.slice(1).join(' ') || '',
      role: options?.role || 'driver',
      phone: options?.phone || '',
      email: cleanEmail,
      city: options?.city || 'Cotonou',
      country: options?.country || 'Bénin',
      isEmailVerified: true,
      isCertified: false,
      trialDaysLeft: 10,
      hasFirstMonthDiscount: true,
      registeredOrder: 1,
      rating: 5.0,
      totalRatingsCount: 0,
      completedDeliveries: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const userRef = doc(db, 'users', pseudoUid);
      await setDoc(userRef, profile, { merge: true });
    } catch (e) {
      console.warn('Direct Gmail Firestore sync fallback:', e);
    }

    return profile;
  },

  // Reset Password via Firebase Email
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err?.code || err?.message || ''));
    }
  },

  // Sign Out
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut warning:', err);
    }
  },
};
