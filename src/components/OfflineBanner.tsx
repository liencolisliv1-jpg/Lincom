import React from 'react';
import { OfflineSyncState } from '../types';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Database,
  PhoneCall,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface OfflineBannerProps {
  offlineState: OfflineSyncState;
  onOpenSyncModal: () => void;
  onManualSync: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  offlineState,
  onOpenSyncModal,
  onManualSync,
  isSyncing = false,
}) => {
  const isOffline = !offlineState.isOnline;
  const hasPending = offlineState.pendingActionsCount > 0;

  if (!isOffline && !hasPending) {
    return null;
  }

  return (
    <div
      id="liencolis-offline-status-banner"
      className={`w-full z-40 transition-all duration-300 ${
        isOffline
          ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white shadow-lg border-b border-amber-500/40'
          : 'bg-gradient-to-r from-emerald-700 to-teal-800 text-emerald-100 shadow-md border-b border-emerald-600/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-xl ${
              isOffline ? 'bg-amber-900/60 border border-amber-400/40' : 'bg-emerald-900/60 border border-emerald-400/40'
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-200" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xs tracking-wide">
                {isOffline ? '📡 Mode Hors-Ligne Actif' : '✅ Connexion Rétablie'}
              </span>
              {offlineState.isForcedOffline && (
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-amber-200 uppercase">
                  Mode Économie Forcé
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/90 leading-tight">
              {isOffline
                ? 'Vos courses, validations PIN, annonces et messages sont sauvegardés localement sur votre téléphone.'
                : `${offlineState.pendingActionsCount} action(s) locale(s) prête(s) à être synchronisée(s).`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {hasPending && (
            <button
              onClick={onOpenSyncModal}
              className="px-2.5 py-1 rounded-xl bg-black/30 hover:bg-black/40 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span>{offlineState.pendingActionsCount} en attente</span>
            </button>
          )}

          {!isOffline ? (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-3 py-1 rounded-xl bg-white text-emerald-950 font-black text-xs shadow hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenSyncModal}
              className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Détails & SOS Hors-Ligne</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
