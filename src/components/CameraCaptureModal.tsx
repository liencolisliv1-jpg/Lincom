import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Check,
  X,
  FlipHorizontal,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Zap,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured?: (photoDataUrl: string) => void;
  onCapture?: (photoDataUrl: string) => void;
  title?: string;
  description?: string;
  initialTab?: 'camera' | 'import';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  onCapture,
  title = 'Photo du document ou matériel',
  description = 'Prenez une photo ou importez une image depuis votre galerie',
  initialTab = 'import',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'import'>(initialTab);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & resize image to max 1280px to ensure fast load & persistence
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const img = document.createElement('img');
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setCapturedImage(compressed);
          } else {
            setCapturedImage(result);
          }

          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream if running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès direct à la caméra n'est pas supporté par ce navigateur.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        "Impossible d'activer le flux vidéo direct. Vous pouvez soit utiliser le bouton déclencheur de votre smartphone, soit importer directement depuis votre galerie."
      );
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialTab === 'camera' && !capturedImage) {
        startCamera(facingMode);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'camera' | 'import') => {
    setActiveTab(tab);
    if (tab === 'camera' && !capturedImage) {
      startCamera(facingMode);
    } else if (tab === 'import' && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);

      // Stop video tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (activeTab === 'camera') {
      startCamera(facingMode);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      if (onPhotoCaptured) onPhotoCaptured(capturedImage);
      if (onCapture) onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  const handleToggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        id="camera-capture-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {activeTab === 'import' ? <FolderOpen className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Galerie vs Caméra */}
        {!capturedImage && (
          <div className="p-3 bg-slate-950/40 border-b border-slate-800">
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => handleTabChange('import')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'import'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Importer depuis la Galerie</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('camera')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Prendre Photo (Caméra)</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Stage */}
        <div className="p-4 space-y-4 flex-1 flex flex-col justify-center">
          {/* If image already selected or captured */}
          {capturedImage ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Aperçu sélectionné"
                  className="w-full h-full object-cover object-center rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Photo prête</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Changer / Recommencer</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider Cette Photo</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'import' ? (
            /* TAB: IMPORT FROM GALLERY / DEVICE */
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => galleryInputRef.current?.click()}
                className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-700 hover:border-amber-400 bg-slate-950/60 hover:bg-slate-950/80'
                }`}
              >
                <div className="p-4 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3 shadow-lg group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-black text-white">Sélectionner une photo dans votre galerie</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Cliquez ici pour parcourir vos dossiers ou glissez-déposez une image (JPG, PNG, WebP)
                </p>

                <div className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Parcourir les fichiers</span>
                </div>
              </div>

              {/* Hidden file input without capture so it opens gallery on all devices */}
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleNativeFileChange}
              />

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Tous formats acceptés (JPG, PNG, WEBP)</span>
                <span className="font-bold text-amber-400">Optimisation automatique</span>
              </div>
            </div>
          ) : (
            /* TAB: LIVE CAMERA VIEW */
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                {cameraError ? (
                  <div className="p-6 text-center space-y-3 max-w-xs">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs text-slate-300">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 mx-auto"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ouvrir l'Appareil Photo Téléphone</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder frame */}
                    <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-amber-400/40 rounded-full animate-pulse" />
                    </div>

                    {isLoadingCamera && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center gap-2 text-xs text-amber-300 font-bold">
                        <Zap className="w-4 h-4 animate-spin" />
                        <span>Démarrage de l'objectif...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Native camera trigger input */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleNativeFileChange}
              />

              {/* Camera Shutter Bar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Changer de caméra (Avant / Arrière)"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={isLoadingCamera || !!cameraError}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span>Capturer la Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Déclencheur Appareil Photo Système"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">LIENCOLIS Photos & Documents</span>
          <button
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
