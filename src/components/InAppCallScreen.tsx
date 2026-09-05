import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  User,
  Shield,
  MapPin,
  Package,
  AlertTriangle,
  ExternalLink,
  Radio,
  Clock,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';
import { Delivery } from '../types';

interface InAppCallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  callTarget?: 'client' | 'emergency';
  autoDial?: boolean;
  autoDialReason?: '300m_proximity' | 'manual' | 'emergency';
}

export const InAppCallScreen: React.FC<InAppCallScreenProps> = ({
  isOpen,
  onClose,
  delivery,
  callTarget = 'client',
  autoDial = true,
  autoDialReason = '300m_proximity',
}) => {
  const [callState, setCallState] = useState<'dialing' | 'ringing' | 'connected' | 'ended'>('dialing');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // Default ON for motorcyclists
  const [isMuted, setIsMuted] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Audio elements or synthetic tones
  useEffect(() => {
    if (!isOpen || !delivery) {
      setCallState('dialing');
      setCallDurationSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Progression of the simulated call
    setCallState('dialing');
    setCallDurationSeconds(0);

    const dialTimeout = setTimeout(() => {
      setCallState('ringing');
    }, 1200);

    const connectTimeout = setTimeout(() => {
      setCallState('connected');
      timerRef.current = window.setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    }, 3200);

    return () => {
      clearTimeout(dialTimeout);
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, delivery]);

  if (!isOpen || !delivery) return null;

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    setCallState('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const targetPhone =
    autoDialReason === 'emergency' && delivery.emergencyPhone
      ? delivery.emergencyPhone
      : delivery.clientPhone;

  const targetName =
    autoDialReason === 'emergency' && delivery.emergencyContactName
      ? `${delivery.emergencyContactName} (Secours)`
      : delivery.clientPseudo;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in select-none">
      {/* Background ambient pulse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div
        className="relative bg-slate-900/90 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col min-h-[580px] justify-between p-6 sm:p-8 text-white z-10"
        id="in-app-call-screen"
      >
        {/* Top Header & Alert context */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>
              {autoDialReason === '300m_proximity'
                ? '🚨 Alerte 300m • Appel Automatique Mains-Libres'
                : autoDialReason === 'emergency'
                ? '🆘 Appel du Numéro de Secours'
                : '📞 Appel Client Sécurisé Liencolis'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            {isSpeakerOn ? '🔊 Haut-parleur activé pour la conduite' : 'Écouteur standard'}
          </p>
        </div>

        {/* Center: Contact Avatar & Info */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
          {/* Avatar with pulse ring */}
          <div className="relative">
            <div
              className={`w-28 h-28 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all ${
                callState === 'connected'
                  ? 'border-emerald-500 bg-emerald-950/40 shadow-emerald-500/20 ring-8 ring-emerald-500/20'
                  : callState === 'ringing'
                  ? 'border-amber-400 bg-amber-950/40 shadow-amber-500/20 ring-8 ring-amber-500/20 animate-pulse'
                  : 'border-slate-600 bg-slate-800 ring-4 ring-slate-700/50'
              }`}
            >
              <User className="w-14 h-14 text-slate-200" />
            </div>

            {callState === 'connected' && (
              <span className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full text-slate-950 shadow-md">
                <Radio className="w-4 h-4" />
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{targetName}</h2>
            <p className="text-sm font-mono text-amber-400 font-bold mt-0.5">{targetPhone}</p>
          </div>

          {/* Call status display */}
          <div className="space-y-1">
            {callState === 'dialing' && (
              <p className="text-xs text-slate-300 font-medium animate-pulse">
                Composition automatique sans contact...
              </p>
            )}

            {callState === 'ringing' && (
              <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Tonalité d'appel... Le client est averti</span>
              </div>
            )}

            {callState === 'connected' && (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatDuration(callDurationSeconds)}</span>
                </div>

                {/* Animated sound wave bars */}
                <div className="flex items-center justify-center gap-1 h-6">
                  {[40, 75, 100, 60, 90, 45, 80, 55, 95, 30].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full transition-all duration-300"
                      style={{
                        height: isMuted ? '4px' : `${Math.max(6, (h * (callDurationSeconds % 3 + 1)) % 24)}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {callState === 'ended' && (
              <p className="text-xs text-rose-400 font-bold">Appel terminé</p>
            )}
          </div>

          {/* Delivery quick snippet */}
          <div className="w-full max-w-xs p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{delivery.dropoffAddress}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">{delivery.packageDescription}</span>
              <span className="font-mono text-emerald-400 font-bold">PIN: #{delivery.securityPin}</span>
            </div>
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="space-y-4 pt-2">
          {/* Audio toggles & Secondary options */}
          <div className="flex items-center justify-center gap-4">
            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1 text-[10px] font-bold ${
                isSpeakerOn
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Activer / Désactiver le haut-parleur"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span>Haut-Parleur</span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1 text-[10px] font-bold ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="Couper / Activer le micro"
            >
              {isMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
              <span>{isMuted ? 'Muet' : 'Micro'}</span>
            </button>

            {/* Fallback to Native Phone GSM app */}
            <a
              href={`tel:${targetPhone.replace(/\s+/g, '')}`}
              className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-700/60 hover:bg-blue-900/60 text-blue-300 transition-all flex flex-col items-center gap-1 text-[10px] font-bold text-center"
              title="Lancer l'application Téléphone de votre smartphone"
            >
              <ExternalLink className="w-5 h-5 text-blue-400" />
              <span>Appel GSM</span>
            </a>

            {/* Emergency fallback if client does not answer */}
            {delivery.emergencyPhone && autoDialReason !== 'emergency' && (
              <a
                href={`tel:${delivery.emergencyPhone.replace(/\s+/g, '')}`}
                className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-700/60 hover:bg-amber-900/60 text-amber-300 transition-all flex flex-col items-center gap-1 text-[10px] font-bold text-center"
                title="Appeler le numéro de secours facultatif"
              >
                <LifeBuoy className="w-5 h-5 text-amber-400" />
                <span>Secours</span>
              </a>
            )}
          </div>

          {/* End Call / Hang Up Button */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={handleHangUp}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 border border-red-400/30"
              id="hang-up-call-btn"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Raccrocher et Reprendre la Navigation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
