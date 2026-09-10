import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  ExternalLink, 
  Clock, 
  Share2, 
  Radio, 
  Copy, 
  Check, 
  Compass,
  AlertCircle
} from 'lucide-react';
import { LiveLocationData, UserProfile } from '../types';

interface LiveLocationCardProps {
  location: LiveLocationData;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
  onStopLive?: () => void;
}

export const LiveLocationCard: React.FC<LiveLocationCardProps> = ({
  location,
  senderName,
  senderAvatar,
  isMe,
  onStopLive,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Compute live remaining countdown
  useEffect(() => {
    if (!location.isLive || !location.expiresAt) {
      return;
    }

    const updateCountdown = () => {
      const diffMs = new Date(location.expiresAt!).getTime() - Date.now();
      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeLeftStr('Terminé');
      } else {
        const mins = Math.floor(diffMs / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [location.isLive, location.expiresAt]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `📍 Position GPS de ${senderName} sur Liencolis : ${location.landmark || location.address || 'Bénin'} - https://maps.google.com/?q=${location.latitude},${location.longitude}`
  )}`;

  const handleCopyCoords = () => {
    navigator.clipboard?.writeText(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-xl my-1 text-slate-100">
      
      {/* Live Status Header Bar */}
      <div className={`px-3 py-2 flex items-center justify-between border-b ${
        location.isLive && !isExpired
          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          {location.isLive && !isExpired ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black tracking-wider uppercase">
                Position En Direct
              </span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold">Position Partagée</span>
            </>
          )}
        </div>

        {location.isLive && (
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{isExpired ? 'Expiré' : `Expire dans ${timeLeftStr}`}</span>
          </div>
        )}
      </div>

      {/* Styled Interactive Radar / Mini-Map Canvas Simulation */}
      <div className="relative h-36 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Radar concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-64 h-64 rounded-full border border-emerald-500/30"></div>
          <div className="w-44 h-44 rounded-full border border-emerald-500/40"></div>
          <div className="w-24 h-24 rounded-full border border-emerald-500/60"></div>
          <div className="absolute w-full h-[1px] bg-emerald-500/30"></div>
          <div className="absolute h-full w-[1px] bg-emerald-500/30"></div>
        </div>

        {/* Decorative Compass Rose */}
        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-500 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
          <Compass className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '18s' }} />
          <span>N 6.37° E 2.40°</span>
        </div>

        {/* Central Pulse Beacon with Driver Avatar / Photo */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            {location.isLive && !isExpired && (
              <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-pulse"></div>
            )}

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 p-0.5 shadow-2xl ring-2 ring-emerald-400/80 overflow-hidden flex items-center justify-center">
              {senderAvatar ? (
                <img
                  src={senderAvatar}
                  alt={senderName}
                  className="w-full h-full object-cover rounded-[14px]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-slate-950 font-black text-sm">
                  {senderName[0]}
                </span>
              )}
            </div>

            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-emerald-400 flex items-center justify-center text-[10px]">
              🛵
            </div>
          </div>

          <span className="mt-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-black text-[10px] shadow border border-slate-700 truncate max-w-[150px]">
            {senderName}
          </span>
        </div>
      </div>

      {/* Location Details & Landmark */}
      <div className="p-3 space-y-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{location.landmark || location.address || 'Position GPS'}</span>
          </div>

          {location.address && location.address !== location.landmark && (
            <p className="text-[11px] text-slate-400 pl-5 truncate">
              {location.address}
            </p>
          )}
        </div>

        {/* Lat / Lng Row with Quick Copy */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
          <button
            type="button"
            onClick={handleCopyCoords}
            className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            title="Copier les coordonnées"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
        </div>

        {/* Action Buttons: Navigate GPS & WhatsApp */}
        <div className="flex items-center gap-1.5 pt-1">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors text-center cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>Itinéraire GPS</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Transférer sur WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </a>

          {isMe && location.isLive && !isExpired && onStopLive && (
            <button
              type="button"
              onClick={onStopLive}
              className="py-2 px-2.5 rounded-xl bg-red-950/50 hover:bg-red-900 text-red-300 border border-red-800/60 text-xs font-bold transition-colors"
              title="Arrêter le partage en direct"
            >
              Arrêter
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
