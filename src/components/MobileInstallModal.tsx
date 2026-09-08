import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Zap,
  Globe,
  Bell,
  Terminal,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'notifications'>('apk');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://lincom-1ecc6.web.app';
  const customDomainUrl = 'https://lincom-1ecc6.web.app';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    if (id === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2500);
    }
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleTestNotification = async () => {
    setTestNotificationStatus('Demande d\'autorisation...');
    const perm = await notificationService.requestBrowserPermission();
    if (perm === 'granted') {
      notificationService.sendPushNotification({
        type: 'urgent_delivery',
        title: '🚀 LIENCOLIS : Test Notification Push Réussi !',
        body: 'Votre smartphone est maintenant prêt à recevoir les alertes de courses en direct.',
        actionLabel: 'Compris',
      });
      setTestNotificationStatus('✅ Notification envoyée avec succès sur votre écran !');
    } else {
      setTestNotificationStatus('⚠️ Autorisation refusée ou non supportée sur ce navigateur.');
    }
    setTimeout(() => setTestNotificationStatus(null), 4000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=0f172a&color=f8fafc&margin=2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        id="mobile-install-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0A162B] border border-amber-400/40 p-1 shrink-0 shadow-lg flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="Logo LienColis"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Hub Mobile & Installation</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Icône Active</span>
              </h3>
              <p className="text-xs text-slate-400">
                Installation directe avec l'icône officielle LienColis sur tous smartphones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Export APK & Play Store</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>PWA & QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications & SMS</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {activeTab === 'apk' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Configuration Android Capacitor Prête !</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    android/ initialisé
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Le dossier natif <strong>/android</strong> a été généré et synchronisé avec toutes les icônes de marque, le splashscreen et les permissions géolocalisation haute précision.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">App ID: com.liencolis.driver</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">Nom: Liencolis Driver</span>
                </div>
              </div>

              {/* Step by step guide to build APK and Play Store bundle */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Étapes pour compiler l'APK / Publier sur le Play Store :</span>
                </h4>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">1. Synchroniser le projet Android</span>
                      <button
                        onClick={() => handleCopy('npm run cap:sync', 'sync')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {copiedCmd === 'sync' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCmd === 'sync' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                    <code className="text-xs font-mono text-amber-300 block bg-slate-900 p-2 rounded">
                      npm run cap:sync
                    </code>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">2. Ouvrir le projet dans Android Studio</span>
                      <button
                        onClick={() => handleCopy('npx cap open android', 'open')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {copiedCmd === 'open' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCmd === 'open' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                    <code className="text-xs font-mono text-amber-300 block bg-slate-900 p-2 rounded">
                      npx cap open android
                    </code>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-slate-200">3. Générer le Fichier d'Installation</span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      <li>
                        <strong>Pour distribuer l'APK directement :</strong> Dans Android Studio, allez dans <code>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</code>. Vous obtiendrez le fichier <code>.apk</code> à envoyer par WhatsApp ou Bluetooth.
                      </li>
                      <li>
                        <strong>Pour le Google Play Store :</strong> Allez dans <code>Build &gt; Generate Signed Bundle / APK</code>, choisissez <strong>Android App Bundle (.aab)</strong>, signez avec votre clé Keystore et téléversez sur votre console Google Play Console.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* QR Code Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="p-2 bg-slate-900 rounded-2xl border border-slate-700 shadow-inner shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code pour ouvrir sur téléphone"
                    className="w-32 h-32 rounded-xl object-contain mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-amber-400">
                    <QrCode className="w-4 h-4" />
                    <span>Scanner avec l'appareil photo</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Pointez la caméra de votre smartphone (Android ou iPhone) sur ce QR Code pour tester l'application directement.
                  </p>
                  <div className="pt-1">
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-400 hover:text-teal-300 underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ouvrir dans un nouvel onglet</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct Link Copy */}
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>Domaine Officiel : lincom-1ecc6.web.app</span>
                    </span>
                    <p className="text-xs font-mono text-white font-bold">https://lincom-1ecc6.web.app</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('https://lincom-1ecc6.web.app', 'custom-domain')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 shrink-0"
                  >
                    {copiedCmd === 'custom-domain' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === 'custom-domain' ? 'Copié !' : 'Copier le Domaine'}</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                    <span>Lien Actuel de Navigation (Session)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono focus:outline-none select-all"
                    />
                    <button
                      onClick={() => handleCopy(currentUrl, 'link')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-300" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Native Install Button if available */}
              {deferredPrompt && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-sm shadow-xl hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Installer l'App sur l'écran d'accueil</span>
                </button>
              )}

              {/* Instructions for Android & iOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300">🤖 Sur Android (Google Chrome)</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    1. Ouvrez dans Chrome.<br />
                    2. Appuyez sur <strong>⋮ (3 points)</strong> en haut à droite.<br />
                    3. Cliquez sur <strong>"Installer l'application"</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-sky-300">🍎 Sur iPhone (Safari)</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    1. Ouvrez dans Safari.<br />
                    2. Appuyez sur <strong>Partager</strong> <Share2 className="w-3 h-3 inline text-sky-400" />.<br />
                    3. Choisissez <strong>"Sur l'écran d'accueil"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                  <Bell className="w-4 h-4" />
                  <span>Système de Notifications Push & Alertes SMS/WhatsApp</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Liencolis envoie des notifications directes lors de chaque changement d'état de livraison : départ en tournée, livreur à proximité (alerte 300m), colis livré avec code PIN, et nouvelles annonces de courses express.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">Tester la notification push sur cet appareil</span>
                <button
                  onClick={handleTestNotification}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>Déclencher une notification test</span>
                </button>
                {testNotificationStatus && (
                  <p className="text-xs font-bold text-amber-300 text-center animate-pulse">
                    {testNotificationStatus}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                <span className="font-bold text-slate-200">Fonctionnalités incluses :</span>
                <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-1">
                  <li>Alertes sonores et synthèse vocale lors de l'attribution d'une course</li>
                  <li>Boutons 1-clic pour notifier le client par WhatsApp avec le code PIN</li>
                  <li>Lien direct SMS pour les zones à faible débit internet</li>
                  <li>Mémorisation hors-ligne avec synchronisation dès reconnexion</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Liencolis Mobile Ready (Bénin 🇧🇯)</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

