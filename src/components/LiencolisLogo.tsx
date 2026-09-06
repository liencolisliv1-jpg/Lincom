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
      {/* Official Emblem Icon with Transparent Background for Light Mode */}
      <div 
        className="relative flex items-center justify-center shrink-0 overflow-hidden"
        style={{
          width: currentSize.icon,
          height: currentSize.icon,
        }}
      >
        <img
          src="/icon.svg"
          alt="Logo LienColis"
          className="w-full h-full object-contain filter drop-shadow-sm"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider uppercase text-slate-900 dark:text-white font-display leading-none ${currentSize.text}`}>
              LIEN<span className="text-amber-500 dark:text-amber-400">COLIS</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30">
              BJ 🇧🇯
            </span>
          </div>
          {showSubtitle && (
            <span className={`text-slate-500 dark:text-slate-300 font-semibold tracking-wide mt-0.5 ${currentSize.sub}`}>
              driver & community
            </span>
          )}
        </div>
      )}
    </div>
  );
};

