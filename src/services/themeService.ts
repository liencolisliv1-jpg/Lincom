export type ThemeMode = 'auto' | 'dark' | 'light';

export interface ThemeStatus {
  mode: ThemeMode;
  isDarkMode: boolean;
  reason: 'night_hours' | 'system_preference' | 'user_forced_dark' | 'user_forced_light';
  nightRangeText: string;
}

const STORAGE_KEY = 'liencolis_theme_mode';

// Default night driving hours: 19:00 (7 PM) to 06:00 (6 AM)
const NIGHT_START_HOUR = 19;
const NIGHT_END_HOUR = 6;

class ThemeService {
  private listeners: Array<(status: ThemeStatus) => void> = [];

  constructor() {
    // Listen for system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        this.notify();
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }
    }

    // Check periodically for hour changes (e.g., transition into 19:00 or 06:00)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.notify();
      }, 30000); // Check every 30 seconds
    }
  }

  public getSavedMode(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode;
    if (saved === 'dark' || saved === 'light' || saved === 'auto') {
      return saved;
    }
    return 'light';
  }

  public setMode(mode: ThemeMode): ThemeStatus {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    const status = this.getThemeStatus(mode);
    this.notify();
    return status;
  }

  public isNightHour(hour: number = new Date().getHours()): boolean {
    return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
  }

  public isSystemDark(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default fallback for night drive safety
  }

  public getThemeStatus(customMode?: ThemeMode): ThemeStatus {
    const mode = customMode || this.getSavedMode();
    const currentHour = new Date().getHours();
    const night = this.isNightHour(currentHour);
    const systemDark = this.isSystemDark();

    if (mode === 'dark') {
      return {
        mode: 'dark',
        isDarkMode: true,
        reason: 'user_forced_dark',
        nightRangeText: '19h00 - 06h00',
      };
    }

    if (mode === 'light') {
      return {
        mode: 'light',
        isDarkMode: false,
        reason: 'user_forced_light',
        nightRangeText: '19h00 - 06h00',
      };
    }

    // Mode is 'auto'
    if (night) {
      return {
        mode: 'auto',
        isDarkMode: true,
        reason: 'night_hours',
        nightRangeText: '19h00 - 06h00',
      };
    }

    return {
      mode: 'auto',
      isDarkMode: systemDark,
      reason: 'system_preference',
      nightRangeText: '19h00 - 06h00',
    };
  }

  public subscribe(callback: (status: ThemeStatus) => void): () => void {
    this.listeners.push(callback);
    // Send initial status
    callback(this.getThemeStatus());

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(): void {
    const status = this.getThemeStatus();
    // Update root document element dark class for CSS selectors
    if (typeof document !== 'undefined') {
      if (status.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    this.listeners.forEach((callback) => callback(status));
  }
}

export const themeService = new ThemeService();
