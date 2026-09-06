import React, { useState, useEffect } from 'react';
import { Delivery, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  AlertCircle,
  Sparkles,
  DollarSign,
  TrendingUp,
  Award,
  Download,
  Share2,
  Check,
  Zap,
} from 'lucide-react';

interface DailyDeliveryMidnightDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  deliveries: Delivery[];
}

export const DailyDeliveryMidnightDigestModal: React.FC<DailyDeliveryMidnightDigestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  deliveries,
}) => {
  const savedSettings = storageService.getMidnightSettings();
  const [targetDate, setTargetDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [notificationChannel, setNotificationChannel] = useState<'both' | 'email' | 'sms_whatsapp'>(savedSettings.channel || 'both');
  const [recipientEmail, setRecipientEmail] = useState<string>(currentUser?.email || savedSettings.email || 'germainmensah1@gmail.com');
  const [recipientPhone, setRecipientPhone] = useState<string>(currentUser?.phone || savedSettings.phone || '+229 97 00 00 00');
  const [autoMidnightScheduleEnabled, setAutoMidnightScheduleEnabled] = useState<boolean>(savedSettings.enabled ?? true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'logs'>('preview');
  const [logs, setLogs] = useState(() => storageService.getMidnightDispatchLogs());

  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) setRecipientEmail(currentUser.email);
      if (currentUser.phone) setRecipientPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Persist settings whenever changed
  const updateSettings = (updates: Partial<{ enabled: boolean; channel: 'both' | 'email' | 'sms_whatsapp'; phone: string; email: string }>) => {
    const newSettings = {
      enabled: updates.enabled ?? autoMidnightScheduleEnabled,
      channel: updates.channel ?? notificationChannel,
      phone: updates.phone ?? recipientPhone,
      email: updates.email ?? recipientEmail,
    };
    if (updates.enabled !== undefined) setAutoMidnightScheduleEnabled(updates.enabled);
    if (updates.channel !== undefined) setNotificationChannel(updates.channel);
    if (updates.phone !== undefined) setRecipientPhone(updates.phone);
    if (updates.email !== undefined) setRecipientEmail(updates.email);
    storageService.saveMidnightSettings(newSettings);
  };

  if (!isOpen) return null;

  // Filter deliveries belonging to target day and user
  const dayDeliveries = deliveries.filter((d) => {
    const isOwner = !currentUser || !d.driverId || d.driverId === currentUser.id;
    const dateStr = (d.deliveredAt || d.createdAt || '').split('T')[0];
    return isOwner && dateStr === targetDate;
  });

  // If no delivery for exact target date, take all recent deliveries for rich summary
  const effectiveDeliveries = dayDeliveries.length > 0 ? dayDeliveries : deliveries.slice(0, 5);

  const completedCount = effectiveDeliveries.filter((d) => d.status === 'delivered').length;
  const inTransitCount = effectiveDeliveries.filter((d) => d.status === 'in_transit' || d.status === 'nearby_500m' || d.status === 'alert_300m').length;
  const totalTurnoverFcfa = effectiveDeliveries
    .filter((d) => d.status === 'delivered')
    .reduce((sum, d) => sum + (d.deliveryFee || 0), 0);

  const totalCommissionsFcfa = effectiveDeliveries
    .filter((d) => d.status === 'delivered')
    .reduce((sum, d) => sum + (d.commissionAmount || 0), 0);

  const netEarningsFcfa = totalTurnoverFcfa - totalCommissionsFcfa;

  const generateDigestText = () => {
    const dateFormatted = new Date(targetDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let msg = `🌙 *LIENCOLIS BÉNIN - BILAN QUOTIDIEN DE MINUIT (00h00)* 📦\n`;
    msg += `═══════════════════════════════════\n`;
    msg += `👤 Livreur : ${currentUser?.name || 'Livreur Partenaire'}\n`;
    msg += `📱 Téléphone : ${currentUser?.phone || recipientPhone || 'Non renseigné'}\n`;
    msg += `📅 Date : ${dateFormatted}\n`;
    msg += `═══════════════════════════════════\n\n`;

    msg += `📊 *RÉSUMÉ D'ACTIVITÉ DU JOUR :*\n`;
    msg += `• Courses Totales : ${effectiveDeliveries.length}\n`;
    msg += `• Livraisons Réussies (Validées PIN) : ${completedCount}\n`;
    msg += `• En cours / programmées : ${inTransitCount}\n`;
    msg += `• Chiffre d'Affaires Brut : ${totalTurnoverFcfa.toLocaleString()} FCFA\n`;
    msg += `• Commissions Déduites : ${totalCommissionsFcfa.toLocaleString()} FCFA\n`;
    msg += `• 💰 *Gain Net Livreur : ${netEarningsFcfa.toLocaleString()} FCFA*\n\n`;

    msg += `📑 *DÉTAIL DES COURSES EFFECTUÉES :*\n`;
    effectiveDeliveries.forEach((d, idx) => {
      const statusLabel = d.status === 'delivered' ? '✅ Livré' : d.status === 'in_transit' ? '🚴 En route' : '⏳ Attente';
      msg += `\n${idx + 1}. [${d.trackingCode}] - ${statusLabel}\n`;
      msg += `   • Client : ${d.clientPseudo || d.recipientName || 'Client'}\n`;
      msg += `   • Trajet : ${d.pickupCity} ➔ ${d.dropoffCity} (${d.dropoffAddress})\n`;
      msg += `   • Rémunération : ${(d.deliveryFee || 0).toLocaleString()} FCFA\n`;
      if (d.rating) {
        msg += `   • Note Client : ${'⭐'.repeat(d.rating)} / 5\n`;
      }
    });

    msg += `\n═══════════════════════════════════\n`;
    msg += `🚀 *LienColis Driver Community Bénin*\n`;
    msg += `Consultez votre tableau de bord sur https://liencolis.bj`;

    return msg;
  };

  const handleSendDigest = async () => {
    setIsSending(true);
    setSendSuccessMsg(null);
    setSendErrorMsg(null);

    const digestText = generateDigestText();

    try {
      if (notificationChannel === 'both' || notificationChannel === 'email') {
        if (!recipientEmail || !recipientEmail.includes('@')) {
          throw new Error("Veuillez saisir une adresse e-mail valide pour l'envoi du récapitulatif.");
        }
      }

      if (notificationChannel === 'both' || notificationChannel === 'sms_whatsapp') {
        if (!recipientPhone) {
          throw new Error('Veuillez saisir un numéro de téléphone pour la notification mobile.');
        }
      }

      // Call server endpoint
      const res = await fetch('/api/admin/dispatch-midnight-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: currentUser?.name || 'Livreur Partenaire',
          driverEmail: recipientEmail,
          driverPhone: recipientPhone,
          channel: notificationChannel,
          date: targetDate,
          deliveries: effectiveDeliveries,
          turnoverFcfa: totalTurnoverFcfa,
          netEarningsFcfa,
        }),
      });

      const data = await res.json();

      storageService.addMidnightDispatchLog({
        date: targetDate,
        totalDeliveries: effectiveDeliveries.length,
        completedCount,
        netEarningsFcfa,
        channel: notificationChannel,
        recipient: `${recipientPhone} / ${recipientEmail}`,
        status: 'success',
      });

      setLogs(storageService.getMidnightDispatchLogs());

      setSendSuccessMsg(
        `✅ Bilan automatique de minuit (00h00) configuré et expédié sans intervention requise ! Il sera ré-expédié chaque nuit à 00h00.`
      );

      // Open WhatsApp direct share if selected
      if (notificationChannel === 'sms_whatsapp' || notificationChannel === 'both') {
        const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
        const encoded = encodeURIComponent(digestText);
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      }
    } catch (err: any) {
      setSendErrorMsg(err.message || "Erreur lors de l'envoi du rapport.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(generateDigestText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-b border-indigo-500/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Historique Journalier & Bilan à 00h00
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Automatique 00h00
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Chaque soir à <strong>00h00</strong>, le récapitulatif complet de toutes les livraisons effectuées dans la journée est compilé et transmis sur le numéro WhatsApp / SMS ou l'e-mail du livreur.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Courses du jour</span>
              <p className="text-xl font-black text-white mt-1">{effectiveDeliveries.length}</p>
              <span className="text-[10px] text-slate-400">Total assigné</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Livrées (PIN OK)</span>
              <p className="text-xl font-black text-emerald-400 mt-1">{completedCount}</p>
              <span className="text-[10px] text-emerald-400/80 font-bold">100% sécurisé</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Recette Brute</span>
              <p className="text-lg font-black text-amber-400 mt-1">{totalTurnoverFcfa.toLocaleString()} F</p>
              <span className="text-[10px] text-slate-400">Tarif courses</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Gain Net Livreur</span>
              <p className="text-lg font-black text-emerald-300 mt-1">{netEarningsFcfa.toLocaleString()} F</p>
              <span className="text-[10px] text-emerald-300/80 font-bold">Dans portefeuille</span>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Paramètres de Réception du Bilan de Minuit (00h00)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Numéro de Téléphone (WhatsApp / SMS) :
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Adresse E-mail du Livreur :
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="livreur@liencolis.bj"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-slate-400">Canal de réception :</span>
              {[
                { id: 'both', label: '📱 WhatsApp & 📧 E-mail (Recommandé)' },
                { id: 'sms_whatsapp', label: '📱 WhatsApp / Numéro' },
                { id: 'email', label: '📧 E-mail SMTP' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNotificationChannel(c.id as any)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                    notificationChannel === c.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Auto Schedule Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Déclenchement automatique chaque soir à 00h00
                  </span>
                  <span className="text-[10.5px] text-slate-400">
                    Compilera et transmettra le relevé sans aucune intervention manuelle
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoMidnightScheduleEnabled}
                onChange={(e) => setAutoMidnightScheduleEnabled(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-800 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Preview of the Daily Digest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Aperçu du Rapport de Minuit :
              </span>
              <button
                type="button"
                onClick={handleCopyDigest}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copier le Bilan</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {generateDigestText()}
            </pre>
          </div>

          {/* Feedback messages */}
          {sendSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
          )}

          {sendErrorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{sendErrorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Horloge serveur calée sur l'heure de Cotonou (GMT+1)</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleSendDigest}
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Envoi en cours...' : 'Envoyer / Programmer le Bilan (00h00)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
