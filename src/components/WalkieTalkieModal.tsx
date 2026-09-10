import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Zap, 
  X, 
  AlertTriangle, 
  CloudRain, 
  Package, 
  Fuel, 
  HelpCircle, 
  Send, 
  Check,
  Headphones
} from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { UserProfile, ChatMessage } from '../types';

interface WalkieTalkieModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  selectedCityName: string;
  selectedGroupId: string;
  onSendVoiceMessage: (msg: Partial<ChatMessage>) => void;
  autoPlayIncomingAudio: boolean;
  onToggleAutoPlayIncomingAudio: (enabled: boolean) => void;
}

// Quick canned voice radio messages adapted for riders on Benin roads
const QUICK_RADIO_DISPATCHES = [
  {
    id: 'traffic_jam',
    emoji: '🚨',
    title: 'Bouchon Sévère',
    content: '🚨 ALERTE TRAFIC : Gros bouchon signalé, circulation bloquée dans le secteur ! Déviation conseillée.',
    duration: 3,
  },
  {
    id: 'rain_alert',
    emoji: '🌧️',
    title: 'Pluie & Glissade',
    content: '🌧️ ATTENTION PLUIE : Forte averse dans la zone, chaussée très glissante. Ralentissez vos motos.',
    duration: 3,
  },
  {
    id: 'relay_available',
    emoji: '📦',
    title: 'Relais Colis Dispo',
    content: '📦 RELAIS DISPONIBLE : Je suis stationné dans le secteur, prêt à prendre un relais de colis.',
    duration: 3,
  },
  {
    id: 'fuel_open',
    emoji: '⛽',
    title: 'Carburant Fluide',
    content: '⛽ STATION ESSENCE : Station ouverte et approvisionnée, service rapide sans attente.',
    duration: 3,
  },
  {
    id: 'police_slow',
    emoji: '⚠️',
    title: 'Ralentissement Voie',
    content: '⚠️ PRUDENCE : Contrôle et travaux en cours sur l’axe principal, ralentissez.',
    duration: 3,
  },
  {
    id: 'client_lost',
    emoji: '❓',
    title: 'Client Injoignable',
    content: '❓ AIDE REPÈRE : Client introuvable au carrefour convenu, quelqu’un connaît le point de repère ?',
    duration: 3,
  },
];

export const WalkieTalkieModal: React.FC<WalkieTalkieModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedCityName,
  selectedGroupId,
  onSendVoiceMessage,
  autoPlayIncomingAudio,
  onToggleAutoPlayIncomingAudio,
}) => {
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [talkMode, setTalkMode] = useState<'hold' | 'tap'>('tap'); // Default to tap mode for safer motorcycle use
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(true);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize and cleanup microphone stream
  const startRecordingAudio = async () => {
    try {
      voiceService.playRadioPttStart();
      audioChunksRef.current = [];

      let stream = streamRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      // Audio Analyzer for dynamic visualizer
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        voiceService.playRadioPttEnd();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioBase64 = reader.result as string;
          const duration = Math.max(2, recordingSeconds);

          onSendVoiceMessage({
            content: `📻 Message Radio Talkie-Walkie (${duration}s)`,
            audioUrl: audioBase64,
            audioDurationSeconds: duration,
            isWalkieTalkie: true,
          });

          setSentNotice(`Message radio diffusé sur ${selectedCityName} !`);
          setTimeout(() => setSentNotice(null), 3000);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsTalking(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 30) {
            // Auto stop at 30 seconds
            stopRecordingAudio();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn("Could not start audio recording:", err);
      setHasMicPermission(false);
      // Fallback voice dispatch
      setIsTalking(true);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecordingAudio = () => {
    if (!isTalking) return;
    setIsTalking(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback dispatch if MediaRecorder failed
      voiceService.playRadioPttEnd();
      const duration = Math.max(2, recordingSeconds);
      onSendVoiceMessage({
        content: `📻 Message Radio Talkie-Walkie (${duration}s)`,
        audioUrl: 'mock_radio_ptt_audio',
        audioDurationSeconds: duration,
        isWalkieTalkie: true,
      });
      setSentNotice(`Message radio diffusé sur ${selectedCityName} !`);
      setTimeout(() => setSentNotice(null), 3000);
    }

    setVolumeLevel(0);
  };

  // Quick dispatch canned button handler
  const handleSendQuickDispatch = (item: typeof QUICK_RADIO_DISPATCHES[0]) => {
    voiceService.playRadioPttStart();
    setTimeout(() => {
      voiceService.playRadioPttEnd();
      onSendVoiceMessage({
        content: item.content,
        audioUrl: 'canned_voice_alert',
        audioDurationSeconds: item.duration,
        isWalkieTalkie: true,
      });
      setSentNotice(`Alerte radio « ${item.title} » diffusée !`);
      setTimeout(() => setSentNotice(null), 3000);
    }, 250);
  };

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header with Radio Channel Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Talkie-Walkie CB</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/40">
                  CANAL {selectedCityName.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Communication radio instantanée entre livreurs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {sentNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{sentNotice}</span>
          </div>
        )}

        {/* Hands-free Mode Bar & Auto-Play Toggle */}
        <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">Écoute Mains-Libres (Auto-Play)</p>
              <p className="text-[10px] text-slate-400">Lit automatiquement les vocaux reçus sur moto</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleAutoPlayIncomingAudio(!autoPlayIncomingAudio)}
            className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
              autoPlayIncomingAudio ? 'bg-amber-400' : 'bg-slate-700'
            }`}
            title="Activer ou désactiver la lecture automatique des messages vocaux reçus"
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                autoPlayIncomingAudio ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* PTT Mode Switch (1-Tap Mains Libres vs Hold PTT) */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setTalkMode('tap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              talkMode === 'tap'
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Mode 1-Clic (Mains Libres Moto)
          </button>

          <button
            type="button"
            onClick={() => setTalkMode('hold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              talkMode === 'hold'
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Mode Maintenir (PTT)
          </button>
        </div>

        {/* Central Tactile PTT Button */}
        <div className="flex flex-col items-center justify-center py-3 space-y-4">
          <div className="relative">
            {/* Glowing rings when broadcasting */}
            {isTalking && (
              <>
                <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping"></div>
                <div className="absolute -inset-8 rounded-full bg-amber-500/10 animate-pulse"></div>
              </>
            )}

            {/* Main Interactive Button */}
            <button
              type="button"
              id="btn-walkie-talkie-ptt"
              onMouseDown={() => {
                if (talkMode === 'hold' && !isTalking) startRecordingAudio();
              }}
              onMouseUp={() => {
                if (talkMode === 'hold' && isTalking) stopRecordingAudio();
              }}
              onTouchStart={() => {
                if (talkMode === 'hold' && !isTalking) startRecordingAudio();
              }}
              onTouchEnd={() => {
                if (talkMode === 'hold' && isTalking) stopRecordingAudio();
              }}
              onClick={() => {
                if (talkMode === 'tap') {
                  if (isTalking) {
                    stopRecordingAudio();
                  } else {
                    startRecordingAudio();
                  }
                }
              }}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all select-none cursor-pointer border-4 ${
                isTalking
                  ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 border-white text-white scale-105 ring-8 ring-red-500/30 shadow-red-500/50'
                  : 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-amber-200 text-slate-950 hover:scale-105 active:scale-95 shadow-amber-500/30'
              }`}
            >
              <Mic className={`w-10 h-10 ${isTalking ? 'animate-pulse' : ''}`} />
              
              <span className="font-black text-xs uppercase tracking-wider mt-1 text-center px-2">
                {isTalking
                  ? talkMode === 'tap'
                    ? 'TERMINER'
                    : 'TRANSMISSION'
                  : talkMode === 'tap'
                  ? 'PARLER'
                  : 'MAINTENIR'}
              </span>

              {isTalking && (
                <span className="text-[11px] font-mono font-bold mt-0.5">
                  {recordingSeconds}s / 30s
                </span>
              )}
            </button>
          </div>

          {/* Sound Wave Graphic Simulation */}
          <div className="w-full max-w-xs h-8 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center gap-1 px-3">
            {[20, 45, 70, 95, 60, 85, 40, 100, 50, 75, 30, 90, 65, 45, 80].map((h, i) => {
              const activeHeight = isTalking ? Math.max(15, (volumeLevel * h) / 100) : 15;
              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isTalking ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                  style={{ height: `${activeHeight}%` }}
                />
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 text-center max-w-xs">
            {isTalking
              ? 'Micro actif : parlez clairement face à votre téléphone.'
              : talkMode === 'tap'
              ? 'Touchez une fois pour démarrer, touchez à nouveau pour envoyer.'
              : 'Maintenez le bouton enfoncé pendant que vous parlez, relâchez pour envoyer.'}
          </p>
        </div>

        {/* 1-Tap Quick Radio Alert Dispatches */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Alertes Radio Rapides (1 Clic)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Boutons guidon</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUICK_RADIO_DISPATCHES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSendQuickDispatch(item)}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-left transition-all hover:border-amber-400/50 flex items-center gap-2 group cursor-pointer"
              >
                <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">Diffusion radio</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
