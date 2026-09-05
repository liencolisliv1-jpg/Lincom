// Service for checking, requesting, testing, and managing Smartphone & Browser permissions

export interface PermissionState {
  granted: boolean;
  status: 'granted' | 'denied' | 'prompt' | 'unsupported';
  error: string | null;
  lastTested: number | null;
}

export interface AppPermissions {
  location: PermissionState;
  microphone: PermissionState;
  camera: PermissionState;
  contacts: PermissionState;
}

class PermissionsService {
  private permissions: AppPermissions = {
    location: { granted: false, status: 'prompt', error: null, lastTested: null },
    microphone: { granted: false, status: 'prompt', error: null, lastTested: null },
    camera: { granted: false, status: 'prompt', error: null, lastTested: null },
    contacts: { granted: false, status: 'prompt', error: null, lastTested: null },
  };

  private listeners: Array<(perms: AppPermissions) => void> = [];

  constructor() {
    this.checkInitialPermissions();
  }

  // Check current permissions if Permissions API is supported
  public async checkInitialPermissions(): Promise<AppPermissions> {
    if (typeof navigator === 'undefined') return this.permissions;

    // 1. Check Location
    if ('geolocation' in navigator) {
      if ('permissions' in navigator && navigator.permissions.query) {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' as any });
          this.permissions.location.status = res.state as any;
          this.permissions.location.granted = res.state === 'granted';
        } catch (e) {
          this.permissions.location.status = 'prompt';
        }
      }
    } else {
      this.permissions.location.status = 'unsupported';
      this.permissions.location.error = 'Géolocalisation non supportée par votre navigateur';
    }

    // 2. Check Microphone
    if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
      if ('permissions' in navigator && navigator.permissions.query) {
        try {
          const res = await navigator.permissions.query({ name: 'microphone' as any });
          this.permissions.microphone.status = res.state as any;
          this.permissions.microphone.granted = res.state === 'granted';
        } catch (e) {
          this.permissions.microphone.status = 'prompt';
        }
      }
    } else {
      this.permissions.microphone.status = 'unsupported';
      this.permissions.microphone.error = 'Microphone non disponible';
    }

    // 3. Check Camera
    if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
      if ('permissions' in navigator && navigator.permissions.query) {
        try {
          const res = await navigator.permissions.query({ name: 'camera' as any });
          this.permissions.camera.status = res.state as any;
          this.permissions.camera.granted = res.state === 'granted';
        } catch (e) {
          this.permissions.camera.status = 'prompt';
        }
      }
    } else {
      this.permissions.camera.status = 'unsupported';
      this.permissions.camera.error = 'Caméra non disponible';
    }

    // 4. Check Contacts API
    if ('contacts' in navigator && 'ContactsManager' in window) {
      this.permissions.contacts.status = 'prompt';
    } else {
      this.permissions.contacts.status = 'prompt'; // Fallback picker always available
    }

    this.notify();
    return { ...this.permissions };
  }

  // Request Location (GPS) Permission
  public async requestLocationPermission(): Promise<PermissionState> {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.permissions.location = {
        granted: false,
        status: 'unsupported',
        error: 'Géolocalisation non disponible',
        lastTested: Date.now(),
      };
      this.notify();
      return this.permissions.location;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.permissions.location = {
            granted: true,
            status: 'granted',
            error: null,
            lastTested: Date.now(),
          };
          this.notify();
          resolve(this.permissions.location);
        },
        (err) => {
          let errorMsg = 'Accès GPS refusé ou indisponible.';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Autorisation GPS refusée par l\'utilisateur ou le navigateur.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Signal GPS introuvable. Activez le GPS de votre smartphone.';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'Délai dépassé pour la recherche du signal GPS.';
          }

          this.permissions.location = {
            granted: false,
            status: 'denied',
            error: errorMsg,
            lastTested: Date.now(),
          };
          this.notify();
          resolve(this.permissions.location);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // Request Microphone Permission
  public async requestMicrophonePermission(): Promise<PermissionState> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissions.microphone = {
        granted: false,
        status: 'unsupported',
        error: 'Accès micro non supporté sur ce navigateur',
        lastTested: Date.now(),
      };
      this.notify();
      return this.permissions.microphone;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after testing
      stream.getTracks().forEach((track) => track.stop());

      this.permissions.microphone = {
        granted: true,
        status: 'granted',
        error: null,
        lastTested: Date.now(),
      };
    } catch (err: any) {
      let msg = 'Accès microphone refusé.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Autorisation microphone refusée. Autorisez le micro dans vos paramètres de navigateur.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Aucun microphone détecté sur cet appareil.';
      }

      this.permissions.microphone = {
        granted: false,
        status: 'denied',
        error: msg,
        lastTested: Date.now(),
      };
    }

    this.notify();
    return this.permissions.microphone;
  }

  // Request Camera Permission
  public async requestCameraPermission(): Promise<PermissionState> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissions.camera = {
        granted: false,
        status: 'unsupported',
        error: 'Accès caméra non supporté par ce navigateur',
        lastTested: Date.now(),
      };
      this.notify();
      return this.permissions.camera;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((track) => track.stop());

      this.permissions.camera = {
        granted: true,
        status: 'granted',
        error: null,
        lastTested: Date.now(),
      };
    } catch (err: any) {
      let msg = 'Accès caméra refusé.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Autorisation caméra refusée. Vous pouvez utiliser le mode importation d\'image de secours.';
      }

      this.permissions.camera = {
        granted: false,
        status: 'denied',
        error: msg,
        lastTested: Date.now(),
      };
    }

    this.notify();
    return this.permissions.camera;
  }

  // Request Contacts Access (Native API or VCF/CSV fallback)
  public async requestContactsPermission(): Promise<{ granted: boolean; contacts?: Array<{ name?: string; tel?: string; email?: string }>; error?: string }> {
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel', 'email'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);

        this.permissions.contacts = {
          granted: true,
          status: 'granted',
          error: null,
          lastTested: Date.now(),
        };
        this.notify();

        return {
          granted: true,
          contacts: contacts.map((c: any) => ({
            name: c.name?.[0] || 'Contact',
            tel: c.tel?.[0] || '',
            email: c.email?.[0] || '',
          })),
        };
      } catch (err: any) {
        console.warn('Contacts API error or user canceled:', err);
      }
    }

    // If native contacts API is unavailable or denied, mark as supported via import picker fallback
    this.permissions.contacts = {
      granted: true,
      status: 'granted',
      error: null,
      lastTested: Date.now(),
    };
    this.notify();
    return { granted: true };
  }

  // Grant all permissions in test / simulation mode
  public grantAllPermissions(): AppPermissions {
    const now = Date.now();
    this.permissions = {
      location: { granted: true, status: 'granted', error: null, lastTested: now },
      microphone: { granted: true, status: 'granted', error: null, lastTested: now },
      camera: { granted: true, status: 'granted', error: null, lastTested: now },
      contacts: { granted: true, status: 'granted', error: null, lastTested: now },
    };
    this.notify();
    return { ...this.permissions };
  }

  public getPermissions(): AppPermissions {
    return { ...this.permissions };
  }

  public subscribe(callback: (perms: AppPermissions) => void): () => void {
    this.listeners.push(callback);
    callback(this.getPermissions());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((callback) => callback(this.getPermissions()));
  }
}

export const permissionsService = new PermissionsService();
