import React, { useState } from 'react';
import { ThemeStatus, ThemeMode, themeService } from '../services/themeService';
import { Sun, Moon, Sparkles, Check, Clock } from 'lucide-react';

interface ThemeSwitcherProps {
  themeStatus: ThemeStatus;
  onCycleThemeMode: () => void;
  onSetThemeMode?: (mode: ThemeMode) => void;
  variant?: 'compact' | 'pill' | 'dropdown' | 'full';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  themeStatus,
  onCycleThemeMode,
  onSetThemeMode,
  variant = 'compact',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectMode = (mode: ThemeMode) => {
    if (onSetThemeMode) {
      onSetThemeMode(mode);
    } else {
      themeService.setMode(mode);
    }
    setIsOpen(false);
  };

  const getReasonLabel = () => {
    if (themeStatus.mode === 'dark') return 'Mode Nuit forcé';
    if (themeStatus.mode === 'light') return 'Mode Jour forcé';
    if (themeStatus.reason === 'night_hours') return 'Auto (Nuit 19h-6h)';
    return 'Auto (Système)';
  };

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-sm ${className}`}>
        <button
          type="button"
          onClick={() => handleSelectMode('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            themeStatus.mode === 'light'
              ? 'bg-amber-400 text-slate-950 shadow-sm scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Activer le Mode Jour (Clair)"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Jour</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            themeStatus.mode === 'dark'
              ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Activer le Mode Nuit (Sombre)"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Nuit</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('auto')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            themeStatus.mode === 'auto'
              ? 'bg-emerald-600 text-white shadow-sm scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Mode Automatique : Sombre la nuit (19h-6h) et Clair le jour"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95"
        title={`Thème actuel : ${getReasonLabel()}. Cliquez pour changer le mode Jour/Nuit/Auto.`}
        id="theme-switcher-dropdown-btn"
      >
        {themeStatus.isDarkMode ? (
          <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Moon className="w-3.5 h-3.5 text-amber-400" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </div>
        )}

        <div className="flex flex-col text-left">
          <span className="text-[11px] font-extrabold text-white leading-tight">
            {themeStatus.mode === 'auto' ? 'Auto' : themeStatus.mode === 'dark' ? 'Nuit' : 'Jour'}
          </span>
          <span className="text-[9px] text-slate-400 leading-tight">
            {themeStatus.isDarkMode ? 'Sombre' : 'Clair'}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-800 mb-1">
              <div className="text-xs font-black text-white flex items-center justify-between">
                <span>Affichage & Thème</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  {themeStatus.isDarkMode ? '🌙 Mode Nuit' : '☀️ Mode Jour'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adaptez la luminosité de l'application selon votre confort de conduite.
              </p>
            </div>

            <div className="space-y-1">
              {/* Option 1: Mode Jour */}
              <button
                type="button"
                onClick={() => handleSelectMode('light')}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                  themeStatus.mode === 'light'
                    ? 'bg-amber-400/10 border border-amber-400/40 text-amber-300 font-bold'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Mode Jour (Clair)</div>
                    <div className="text-[10px] text-slate-400">Optimisé pour la lumière du soleil</div>
                  </div>
                </div>
                {themeStatus.mode === 'light' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>

              {/* Option 2: Mode Nuit */}
              <button
                type="button"
                onClick={() => handleSelectMode('dark')}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                  themeStatus.mode === 'dark'
                    ? 'bg-indigo-500/10 border border-indigo-500/40 text-indigo-300 font-bold'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Mode Nuit (Sombre)</div>
                    <div className="text-[10px] text-slate-400">Anti-éblouissement sur route nocturne</div>
                  </div>
                </div>
                {themeStatus.mode === 'dark' && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
              </button>

              {/* Option 3: Automatique */}
              <button
                type="button"
                onClick={() => handleSelectMode('auto')}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                  themeStatus.mode === 'auto'
                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-bold'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Automatique Intelligent</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Nuit de 19h00 à 06h00</span>
                    </div>
                  </div>
                </div>
                {themeStatus.mode === 'auto' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            </div>

            {/* Info footer */}
            <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>
                État actuel : <strong className="text-white">{getReasonLabel()}</strong>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
