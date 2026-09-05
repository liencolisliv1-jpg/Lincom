import React, { useState, useEffect } from 'react';
import { permissionsService, AppPermissions, PermissionState } from '../services/permissionsService';
import {
  ShieldCheck,
  MapPin,
  Mic,
  Camera,
  Contact,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Zap,
  Info,
  HelpCircle,
} from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose }) => {
  const [perms, setPerms] = useState<AppPermissions>(() => permissionsService.getPermissions());
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = permissionsService.subscribe((updated) => setPerms(updated));
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleTestLocation = async () => {
    setTestingKey('location');
    setSuccessMsg(null);
    const res = await permissionsService.requestLocationPermission();
    setTestingKey(null);
    if (res.granted) {
      setSuccessMsg('📍 Signal GPS détecté et autorisation de géolocalisation accordée avec succès !');
    }
  };

  const handleTestMicrophone = async () => {
    setTestingKey('microphone');
    setSuccessMsg(null);
    const res = await permissionsService.requestMicrophonePermission();
    setTestingKey(null);
    if (res.granted) {
      setSuccessMsg('🎙️ Accès Microphone accordé ! La commande vocale mains-libres est activée.');
    }
  };

  const handleTestCamera = async () => {
    setTestingKey('camera');
    setSuccessMsg(null);
    const res = await permissionsService.requestCameraPermission();
    setTestingKey(null);
    if (res.granted) {
      setSuccessMsg('📷 Flux Caméra et scanner QR actifs avec succès !');
    }
  };

  const handleTestContacts = async () => {
    setTestingKey('contacts');
    setSuccessMsg(null);
    const res = await permissionsService.requestContactsPermission();
    setTestingKey(null);
    if (res.granted) {
      setSuccessMsg('📇 Accès au carnet de contacts prêt (API Web & Importateur VCF) !');
    }
  };

  const handleGrantAll = () => {
    permissionsService.grantAllPermissions();
    setSuccessMsg('⚡ Toutes les autorisations (GPS, Micro, Caméra, Contacts) ont été activées instantanément !');
  };

  const renderStatusBadge = (state: PermissionState) => {
    if (state.granted) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autorisé</span>
        </span>
      );
    }
    if (state.status === 'denied') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold text-[11px] flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Refusé (Secours disponible)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
        <span>À valider</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Centre d'Autorisations Smartphone & Navigateur
              </h3>
              <p className="text-[11px] text-slate-400">
                Gérez et autorisez l'accès au GPS, Microphone, Caméra et Contacts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Success Notification */}
        {successMsg && (
          <div className="mx-4 mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Informational iFrame Banner */}
        <div className="mx-4 mt-3 p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Remarque iFrame / Navigateur Mobiles :</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Si votre navigateur ou l'aperçu bloque l'accès matériel direct, vous pouvez cliquer sur <strong>"Activer Tout (Mode Test)"</strong> ci-dessous ou ouvrir l'application dans un nouvel onglet.
          </p>
          <div className="pt-1">
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline"
            >
              <span>Ouvrir dans un nouvel onglet externe</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Permission Item Cards List */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          
          {/* 1. Localisation GPS */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Localisation GPS Temps Réel</span>
                  {renderStatusBadge(perms.location)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Suivi satellite, guidage vocal, alertes de proximité 300m et 500m.
                </p>
                {perms.location.error && (
                  <p className="text-[10px] text-red-400 mt-1 font-mono">{perms.location.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleTestLocation}
              disabled={testingKey === 'location'}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
            >
              {testingKey === 'location' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Tester / Autoriser</span>
            </button>
          </div>

          {/* 2. Microphone & Voix */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Microphone & Commandes Vocales</span>
                  {renderStatusBadge(perms.microphone)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dictée d'annonces, commandes vocales mains-libres pendant la conduite.
                </p>
                {perms.microphone.error && (
                  <p className="text-[10px] text-red-400 mt-1 font-mono">{perms.microphone.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleTestMicrophone}
              disabled={testingKey === 'microphone'}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
            >
              {testingKey === 'microphone' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Tester / Autoriser</span>
            </button>
          </div>

          {/* 3. Caméra & QR Scanner */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Caméra & Photos Colis</span>
                  {renderStatusBadge(perms.camera)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prendre une photo de confirmation de livraison, document permis ou annonce.
                </p>
                {perms.camera.error && (
                  <p className="text-[10px] text-red-400 mt-1 font-mono">{perms.camera.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleTestCamera}
              disabled={testingKey === 'camera'}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
            >
              {testingKey === 'camera' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Tester / Autoriser</span>
            </button>
          </div>

          {/* 4. Carnet de Contacts Client */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0 mt-0.5">
                <Contact className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Contacts & Numéros Clients</span>
                  {renderStatusBadge(perms.contacts)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Importer un numéro de client depuis votre carnet d'adresses ou fichier VCF.
                </p>
              </div>
            </div>
            <button
              onClick={handleTestContacts}
              disabled={testingKey === 'contacts'}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
            >
              {testingKey === 'contacts' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Tester / Autoriser</span>
            </button>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleGrantAll}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Activer Tout (Toutes Autorisations)</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
