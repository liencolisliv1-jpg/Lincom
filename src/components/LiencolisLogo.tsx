import React from 'react';

interface LiencolisLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LiencolisLogo: React.FC<LiencolisLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { icon: 34, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 46, text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 64, text: 'text-2xl', sub: 'text-sm' },
    xl: { icon: 96, text: 'text-4xl', sub: 'text-base' },
  };

  const currentSize = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
      id="liencolis-logo-brand"
    >
      {/* Official Emblem Icon */}
      <div 
        className="relative rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-950/40 border border-slate-700/60 overflow-hidden"
        style={{
          width: currentSize.icon,
          height: currentSize.icon,
          background: 'linear-gradient(135deg, #071322 0%, #0B192C 50%, #112239 100%)',
        }}
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle background glow */}
          <circle cx="80" cy="80" r="74" fill="#0B192C" />
          <circle cx="80" cy="80" r="72" stroke="url(#borderGradient)" strokeWidth="2" opacity="0.4" />

          {/* Green Left Infinity Wing */}
          <path
            d="M 52 50 C 30 50 16 65 16 80 C 16 95 30 110 52 110 C 72 110 82 95 86 85 C 80 92 70 98 55 98 C 42 98 32 89 32 80 C 32 71 42 62 55 62 C 68 62 76 70 82 78 C 76 66 68 50 52 50 Z"
            fill="url(#greenGradient)"
          />
          <path
            d="M 50 54 C 34 54 22 66 22 80 C 22 94 34 106 50 106 C 63 106 72 96 78 88 C 72 76 64 68 50 68"
            stroke="#34D399"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Yellow/Gold Right Infinity Wing */}
          <path
            d="M 108 50 C 130 50 144 65 144 80 C 144 95 130 110 108 110 C 88 110 78 95 74 85 C 80 92 90 98 105 98 C 118 98 128 89 128 80 C 128 71 118 62 105 62 C 92 62 84 70 78 78 C 84 66 92 50 108 50 Z"
            fill="url(#yellowGradient)"
          />
          <path
            d="M 110 54 C 126 54 138 66 138 80 C 138 94 126 106 110 106 C 97 106 88 96 82 88 C 88 76 96 68 110 68"
            stroke="#FDE047"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Central 3D Isometric White Delivery Parcel */}
          <g transform="translate(62, 60)">
            {/* Top Face */}
            <polygon
              points="18,0 35,9 18,18 1,9"
              fill="#FFFFFF"
              stroke="#0B192C"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Left Face */}
            <polygon
              points="1,9 18,18 18,36 1,27"
              fill="#E2E8F0"
              stroke="#0B192C"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Right Face */}
            <polygon
              points="18,18 35,9 35,27 18,36"
              fill="#CBD5E1"
              stroke="#0B192C"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Parcel Flap / Tape Accent */}
            <line x1="9.5" y1="4.5" x2="26.5" y2="13.5" stroke="#0B192C" strokeWidth="1.8" />
            <polygon points="17,14 19,15 19,21 17,20" fill="#0B192C" />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="greenGradient" x1="16" y1="50" x2="86" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="yellowGradient" x1="74" y1="50" x2="144" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="borderGradient" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider uppercase text-white font-display leading-none ${currentSize.text}`}>
              LIEN<span className="text-amber-400">COLIS</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              BJ 🇧🇯
            </span>
          </div>
          {showSubtitle && (
            <span className={`text-slate-300 font-medium tracking-wide mt-0.5 ${currentSize.sub}`}>
              driver and communauty
            </span>
          )}
        </div>
      )}
    </div>
  );
};
