import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Camera } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  subtitle?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
  subtitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const validImages = images.filter((img) => Boolean(img && img.trim()));
  const currentImg = validImages[currentIndex] || validImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between text-white px-2">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-amber-300">
              📷 {currentIndex + 1} / {validImages.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div className="relative w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
          <img
            src={currentImg}
            alt={`Vue ${currentIndex + 1}`}
            className="max-h-[70vh] w-auto max-w-full object-contain select-none"
            referrerPolicy="no-referrer"
          />

          {validImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-110 shadow-lg"
                title="Photo précédente"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-110 shadow-lg"
                title="Photo suivante"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Bar */}
        {validImages.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 max-w-full">
            {validImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  idx === currentIndex
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Vignette ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
