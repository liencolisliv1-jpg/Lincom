import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Star, Plus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';

interface MultiPhotoUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxPhotos?: number;
  label?: string;
  helperText?: string;
  themeColor?: 'amber' | 'emerald' | 'blue';
}

export const MultiPhotoUploader: React.FC<MultiPhotoUploaderProps> = ({
  images,
  onChange,
  maxPhotos = 5,
  label = 'Photos du Matériel ou de l’Engin',
  helperText = 'Ajoutez jusqu’à 5 photos sous différents angles (face, profil, intérieur cargo, compteur).',
  themeColor = 'amber',
}) => {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeClasses = {
    amber: {
      accent: 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20',
      badge: 'bg-amber-400 text-slate-950',
      button: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950',
      ring: 'focus:ring-amber-400',
    },
    emerald: {
      accent: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20',
      badge: 'bg-emerald-400 text-slate-950',
      button: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950',
      ring: 'focus:ring-emerald-400',
    },
    blue: {
      accent: 'border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20',
      badge: 'bg-blue-400 text-white',
      button: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
      ring: 'focus:ring-blue-400',
    },
  }[themeColor];

  const handleAddPhoto = (newImgUrl: string) => {
    if (!newImgUrl || !newImgUrl.trim()) return;
    if (images.length >= maxPhotos) {
      setErrorMsg(`Maximum de ${maxPhotos} photos atteint.`);
      return;
    }
    setErrorMsg(null);
    onChange([...images, newImgUrl.trim()]);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    setErrorMsg(null);
  };

  const handleSetPrimaryPhoto = (indexToPrimary: number) => {
    if (indexToPrimary === 0 || indexToPrimary >= images.length) return;
    const selected = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...remaining]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Maximum de ${maxPhotos} photos atteint.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: string[] = [];

    let processedCount = 0;
    filesToProcess.forEach((file) => {
      // Basic size check (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Une image dépasse la taille limite de 5 Mo.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result;
        if (typeof result === 'string') {
          newPhotos.push(result);
        }
        processedCount++;
        if (processedCount === filesToProcess.length) {
          onChange([...images, ...newPhotos]);
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    handleAddPhoto(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      {/* Label and Counter */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-400">({images.length}/{maxPhotos})</span>
        </label>

        {images.length < maxPhotos && (
          <span className="text-[10px] text-emerald-400 font-semibold">
            +{maxPhotos - images.length} restante(s)
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">{helperText}</p>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Existing Photos */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl overflow-hidden border-2 bg-slate-950 group h-28 flex flex-col justify-between shadow-md transition-all ${
                idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <img
                src={img}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />

              {/* Badges */}
              <div className="absolute top-1.5 left-1.5">
                {idx === 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] shadow">
                    ★ Principale
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-300 font-bold text-[9px] border border-slate-700">
                    #{idx + 1}
                  </span>
                )}
              </div>

              {/* Action Buttons overlay */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryPhoto(idx)}
                    className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                    title="Définir comme photo principale"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                  title="Supprimer cette photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more photo box if slots available */}
          {images.length < maxPhotos && (
            <div className="h-28 rounded-2xl border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/40 p-2 flex flex-col items-center justify-center gap-1.5 text-center transition-colors">
              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                title="Prendre une photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-slate-400 font-medium">Ajouter photo</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons: Camera, File Upload, Web URL */}
      {images.length < maxPhotos && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. Camera */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${themeClasses.accent}`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Caméra Smartphone</span>
            </button>

            {/* 2. Upload from gallery/device */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Galerie / Fichiers</span>
            </button>

            {/* 3. Paste URL */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lien URL Photo</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Collapsible URL Input */}
          {showUrlInput && (
            <form onSubmit={handleAddFromUrl} className="flex gap-2 animate-in fade-in">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Coller l'URL d'une image (https://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
              >
                Ajouter
              </button>
            </form>
          )}
        </div>
      )}

      {/* Reusable Camera Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={(photo) => {
          handleAddPhoto(photo);
          setShowCameraModal(false);
        }}
        title="Prendre une Photo sous un nouvel angle"
      />
    </div>
  );
};
