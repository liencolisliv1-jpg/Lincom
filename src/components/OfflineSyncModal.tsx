import React, { useState } from 'react';
import { OfflineSyncState, QueuedOfflineAction } from '../types';
import { offlineSyncService } from '../services/offlineSyncService';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Database,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  X,
  Smartphone,
  HardDrive,
  ShieldCheck,
  Zap,
  MapPin,
  FileCheck,
} from 'lucide-react';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineState: OfflineSyncState;
  onTriggerSync: () => void;
  isSyncing?: boolean;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  offlineState,
  onTriggerSync,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'emergency' | 'storage'>('queue');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleForcedOffline = () => {
    offlineSyncService.setForcedOffline(!offlineState.isForcedOffline);
  };

  const handleManualSync = async () => {
    setSyncFeedback('Synchronisation des données en cours...');
    const res = await offlineSyncService.syncQueuedActions();
    setSyncFeedback(`${res.syncedCount} action(s) synchronisée(s) avec succès.`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleClearSynced = () => {
    offlineSyncService.clearSyncedActions();
  };

  const getActionTypeLabel = (type: QueuedOfflineAction['type']) => {
    switch (type) {
      case 'delivery_status_update':
        return 'Mise à jour statut livraison';
      case 'delivery_pin_verified':
        return 'Validation code PIN client';
      case 'new_classified_ad':
        return 'Publication petite annonce';
      case 'chat_message_sent':
        return 'Message salon d\'entraide';
      case 'aid_request_created':
        return 'Demande d\'aide financière';
      default:
        return 'Action hors-ligne';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        id="offline-sync-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                offlineState.isOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {offlineState.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Gestionnaire & Mode Hors-Ligne</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    offlineState.isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {offlineState.isOnline ? 'EN LIGNE' : 'HORS-LIGNE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PWA Offline Caching • Sauvegarde locale continue pour les livreurs béninois
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline Diagnostic Bar */}
        <div className="p-3.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">
              Actions locales en attente :{' '}
              <strong className="text-white font-mono">{offlineState.pendingActionsCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleForcedOffline}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                offlineState.isForcedOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {offlineState.isForcedOffline
                ? '⚡ Désactiver Forçage Hors-Ligne'
                : '📡 Simuler Mode Hors-Ligne (Test)'}
            </button>

            {offlineState.isOnline && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing || offlineState.pendingActionsCount === 0}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Synchroniser tout</span>
              </button>
            )}
          </div>
        </div>

        {syncFeedback && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-center text-xs font-bold text-emerald-300">
            {syncFeedback}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 text-xs px-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2.5 px-3.5 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'queue'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>File de Synchronisation ({offlineState.queuedActions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`py-2.5 px-3.5 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'emergency'
                ? 'text-rose-400 border-b-2 border-rose-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>SOS & Numéros d'Urgence 100% Hors-Ligne</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`py-2.5 px-3.5 font-bold flex items-center gap-1.5 transition-colors ml-auto ${
              activeTab === 'storage'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Stockage Appareil</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {activeTab === 'queue' && (
            <div className="space-y-3">
              {offlineState.queuedActions.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Toutes vos données sont à jour</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Lorsque vous enregistrez des courses ou mettez à jour des livraisons en zone sans réseau,
                    elles s'affichent ici et sont réexpédiées dès le retour d'Internet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {offlineState.queuedActions.map((action) => (
                    <div
                      key={action.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        action.status === 'pending'
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : action.status === 'failed'
                          ? 'bg-rose-950/30 border-rose-500/50'
                          : 'bg-slate-800/50 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                action.status === 'pending'
                                  ? 'bg-amber-400 text-slate-950'
                                  : action.status === 'failed'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {action.status === 'pending'
                                ? 'En attente de réseau'
                                : action.status === 'failed'
                                ? 'Échec'
                                : 'Synchronisé'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {getActionTypeLabel(action.type)}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-white">{action.title}</h5>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(action.timestamp).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {action.status === 'synced' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}

                  {offlineState.queuedActions.some((a) => a.status === 'synced') && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleClearSynced}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Effacer l'historique synchronisé</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                <p className="font-bold flex items-center gap-1.5 text-rose-300">
                  <ShieldCheck className="w-4 h-4" />
                  Ces numéros fonctionnent directement sur le réseau GSM / Téléphonique sans connexion Internet :
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <a
                  href="tel:117"
                  className="p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:border-rose-500/60 hover:bg-slate-750 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">Police Secours Bénin</span>
                    <p className="text-[11px] text-slate-400">Intervention d'urgence & braquages</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-sm">
                    117
                  </span>
                </a>

                <a
                  href="tel:118"
                  className="p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:border-amber-500/60 hover:bg-slate-750 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">Sapeurs-Pompiers (SAMU)</span>
                    <p className="text-[11px] text-slate-400">Accident de la route & secours médical</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-sm">
                    118
                  </span>
                </a>

                <a
                  href="tel:+2290169814632"
                  className="p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:border-teal-500/60 hover:bg-slate-750 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">Assistance Conducteurs LIENCOLIS</span>
                    <p className="text-[11px] text-slate-400">Support central & médiation colis</p>
                  </div>
                  <span className="px-2 py-1 rounded-xl bg-teal-500/20 text-teal-300 font-mono font-bold text-xs">
                    Appel Direct
                  </span>
                </a>

                <a
                  href="tel:166"
                  className="p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:border-blue-500/60 hover:bg-slate-750 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">Ligne Verte Sécurité Routière</span>
                    <p className="text-[11px] text-slate-400">Signalement état des voies & barrages</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 font-mono font-black text-sm">
                    166
                  </span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <h4 className="font-black text-amber-300 uppercase tracking-wider text-[11px]">
                  État du Cache & Base de Données PWA
                </h4>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-slate-400">Moteur Hors-Ligne</span>
                    <p className="text-sm font-black text-white mt-0.5">Service Worker v2</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-slate-400">Dernière Synchro Réseau</span>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">
                      {offlineState.lastSyncAt
                        ? new Date(offlineState.lastSyncAt).toLocaleTimeString('fr-FR')
                        : 'À l\'instant'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-slate-400">Chiffrement Local</span>
                    <p className="text-xs font-bold text-white mt-0.5">Actif (LocalStorage/IndexedDB)</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-slate-400">Protection PIN Colis</span>
                    <p className="text-xs font-bold text-amber-400 mt-0.5">Vérification Locale</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">LIENCOLIS Offline Sync Engine 2.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
