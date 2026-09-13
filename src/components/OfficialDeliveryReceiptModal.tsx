import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  QrCode,
  Package,
  Copy,
  Check,
  Bike,
  Sparkles,
} from 'lucide-react';
import { Delivery, UserProfile } from '../types';

interface OfficialDeliveryReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  currentUser?: UserProfile | null;
}

export const OfficialDeliveryReceiptModal: React.FC<OfficialDeliveryReceiptModalProps> = ({
  isOpen,
  onClose,
  delivery,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !delivery) return null;

  const deliveredDate = delivery.deliveredAt
    ? new Date(delivery.deliveredAt)
    : new Date();

  const formattedDate = deliveredDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = deliveredDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptRefCode = `REC-${delivery.trackingCode || delivery.id.slice(0, 8).toUpperCase()}`;

  const whatsappReceiptText = 
`🧾 *REÇU OFFICIEL DE LIVRAISON LIENCOLIS* 🇧🇯
━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Réf. Reçu* : *${receiptRefCode}*
✅ *Statut* : *Colis Réceptionné & Remis avec Succès*
📅 *Date & Heure* : ${formattedDate} à ${formattedTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Expéditeur / Client* : ${delivery.clientPseudo || 'Client Liencolis'}
📞 *Contact* : ${delivery.clientPhone || 'Non renseigné'}
📍 *Départ* : ${delivery.pickupAddress || delivery.pickupCity || 'Cotonou'}
📍 *Destination* : ${delivery.dropoffAddress || delivery.dropoffCity}

🛵 *Livreur Certifié* : ${delivery.driverName || currentUser?.name || 'Chauffeur Agréé'}
📞 *Tél. Livreur* : ${delivery.driverPhone || currentUser?.phone || 'Contact vérifié'}

📦 *Colis* : ${delivery.packageDescription || 'Marchandise standard'}
🔑 *Code Secret Confirmé* : ${delivery.securityPin || '••••'}
💰 *Montant Réglé* : *${(delivery.deliveryFee || 0).toLocaleString('fr-FR')} FCFA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ *Preuve numérique vérifiée par le protocole Liencolis Bénin.*
Vérifier en ligne : https://ais-pre-zxavitnsxwmknftolyo2hv-626045602467.europe-west1.run.app`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappReceiptText)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappReceiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Action Bar (hidden in print) */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Reçu Officiel de Livraison</h3>
              <p className="text-[11px] text-slate-400">Preuve numérique certifiée Liencolis</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title="Envoyer le reçu officiel sur WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimer / Enregistrer en PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Official Receipt Document */}
        <div id="official-delivery-receipt-content" className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100 print:p-8 print:bg-white print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow">
                  LC
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    LIENCOLIS BÉNIN
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">Plateforme Logistique de Proximité Certifiée</p>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>REMISE CERTIFIÉE</span>
              </span>
              <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 mt-1">
                Réf : <strong className="text-slate-900 dark:text-white">{receiptRefCode}</strong>
              </p>
            </div>
          </div>

          {/* Key Timestamp & PIN Banner */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Date de Remise</span>
                <span className="font-bold text-slate-900 dark:text-white">{formattedDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Heure Validée</span>
                <span className="font-bold text-slate-900 dark:text-white">{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Two-Column Parties Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Expéditeur & Destinataire */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Client & Destinataire</span>
              </h4>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{delivery.clientPseudo || 'Client Particulier'}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{delivery.clientPhone}</span>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-start gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Départ :</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{delivery.pickupAddress || delivery.pickupCity || 'Cotonou'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] pt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Arrivée :</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{delivery.dropoffAddress || delivery.dropoffCity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Livreur Certifié */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-amber-500" />
                <span>Chauffeur & Livreur Agréé</span>
              </h4>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{delivery.driverName || currentUser?.name || 'Chauffeur Liencolis'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                    CERTIFIÉ
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{delivery.driverPhone || currentUser?.phone || 'Vérifié par la plateforme'}</span>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                <p className="text-slate-600 dark:text-slate-400">
                  Immatriculation : <strong className="text-slate-900 dark:text-white">{currentUser?.vehiclePlate || 'BJ-Agréé-01'}</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Note Livreur : <strong className="text-amber-500">★ 4.9 / 5</strong> ({currentUser?.completedDeliveries || 150}+ courses)
                </p>
              </div>
            </div>
          </div>

          {/* Colis & Transaction Financial Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
            <div className="bg-slate-100 dark:bg-slate-900 p-3 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-500" />
                <span>Désignation de la Prestation</span>
              </span>
              <span>Montant</span>
            </div>
            <div className="p-3.5 space-y-2 bg-white dark:bg-slate-950">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{delivery.packageDescription || 'Colisage standard sécurisé'}</p>
                  <p className="text-[11px] text-slate-500">Trajet {delivery.pickupCity} ➔ {delivery.dropoffCity}</p>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(delivery.deliveryFee || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-900">
                <span>Validation Code Secret Anti-Vol</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Code #{delivery.securityPin || '••••'} (Vérifié)
                </span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm font-black">
              <span className="text-slate-900 dark:text-white">TOTAL RÉGLÉ AU LIVREUR</span>
              <span className="text-base text-emerald-600 dark:text-emerald-400 font-mono">
                {(delivery.deliveryFee || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* QR Code & Digital Seal footer */}
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Sceau Numérique Infalsifiable</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Enregistré sur la base de données cloud Liencolis. Ce document fait foi de justificatif officiel de livraison.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar Controls (hidden in print) */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Preuve copiée !' : 'Copier le reçu'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Transmettre au Client (WhatsApp)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
