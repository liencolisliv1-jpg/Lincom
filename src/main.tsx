import React, { StrictMode, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Push Notifications
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Liencolis Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped or failed:', err);
      });
  });
}

// Global handler for Google Maps authentication failures and cross-origin script error suppression
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn('[Google Maps] Authentification échouée: Clé API invalide ou non autorisée.');
    window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
  };

  window.addEventListener('error', (event) => {
    const isMapsError =
      (event.message && (event.message.includes('InvalidKeyMapError') || event.message.includes('Google Maps'))) ||
      (event.filename && event.filename.includes('maps.googleapis.com'));
    if (isMapsError) {
      console.warn('[Google Maps] Erreur de script Google Maps interceptée avec succès:', event.message);
      window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <div>
              <h1 className="text-xl font-black text-white">LIENCOLIS Driver Community</h1>
              <p className="text-xs text-slate-400 mt-2">
                Une interruption temporaire a été interceptée. Vos données locales sont sécurisées.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg transition-all active:scale-95"
            >
              🔄 Recharger l'Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

