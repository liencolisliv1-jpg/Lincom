import React from 'react';
import { LiencolisLogo } from './LiencolisLogo';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  Users,
  Lock,
  HeartHandshake,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

interface RulesAndTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesAndTermsModal: React.FC<RulesAndTermsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <LiencolisLogo size="sm" showSubtitle={false} />
            <div>
              <h3 className="text-base font-black text-white">Charte Officielle Liencolis Driver Community</h3>
              <p className="text-[11px] text-slate-400">Règles de sécurité, Déontologie & Conditions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs text-slate-300 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
          
          {/* Section 1: Road Safety & No Phone Manipulation */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>1. Sécurité Routière Zéro-Distraction (Priorité Absolue)</span>
            </div>
            <p className="leading-relaxed">
              Il est <strong>strictement interdit de manipuler l'écran d'un téléphone à deux ou trois roues en circulation</strong>. L'application Liencolis fournit un système sonore et vocal :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-200">
              <li><strong>À 500 mètres :</strong> Une alerte primaire automatique informe le destinataire.</li>
              <li><strong>À 300 mètres :</strong> Une forte sonnerie + vibration retentit dans les écouteurs du livreur, déclenchant l'annonce vocale mains-libres pour lancer l'appel sans toucher l'écran.</li>
              <li><strong>Port du casque homologué et gilet réfléchissant obligatoire</strong> pour tout coursier certifié.</li>
            </ul>
          </div>

          {/* Section 2: Community Chat Rules & Expulsion */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Users className="w-5 h-5" />
              <span>2. Règlement du Grand Groupe & Salons de Villes</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Grand Groupe Public :</strong> Libre d'accès. <em>Tout partage de lien Internet, de numéro direct de téléphone ou de message à caractère sexuel / injurieux entraîne l'expulsion immédiate du compte.</em></li>
              <li><strong>Groupes par Villes (Cotonou, Calavi, Porto-Novo, Parakou...) :</strong> Réservés aux membres abonnés, permettant les notes vocales, relais de courses et entraide locale.</li>
            </ul>
          </div>

          {/* Section 3: Subscriptions & VIP Badge */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Award className="w-5 h-5" />
              <span>3. Grille Tarifaire & Avantages</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-white font-bold">2 Roues (Motos)</p>
                <p className="text-amber-400">1 200 FCFA / mois</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-white font-bold">Tricycles Cargo</p>
                <p className="text-amber-400">1 500 FCFA / mois</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <p className="text-white font-bold">4 Roues Utilitaires</p>
                <p className="text-amber-400">2 000 FCFA / mois</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Badge Premium VIP : <strong>500 FCFA / semaine</strong> pour être épinglé en tête d'affiche.
            </p>
          </div>

          {/* Section 4: Mutual Aid Fund */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <HeartHandshake className="w-5 h-5" />
              <span>4. Caisse d'Entraide & Dépannage Solidaire</span>
            </div>
            <p className="leading-relaxed">
              Pour bénéficier du fonds d'assistance en cas d'accident ou de panne mécanique majeure :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le livreur doit être certifié (pièce d'identité CIP/NIP ou Permis validée par l'administration).</li>
              <li>Être à jour de son abonnement mensuel.</li>
              <li>Avoir un score de réputation positif auprès des clients.</li>
            </ul>
          </div>

          {/* Section 5: Data Privacy & Account Deletion */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Lock className="w-5 h-5" />
              <span>5. Confidentialité & Droit à l'Oubli</span>
            </div>
            <p className="leading-relaxed">
              Chaque utilisateur dispose du droit de supprimer son compte et l'ensemble de ses données GPS et de livraisons à tout moment en un clic depuis le profil.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg"
          >
            J'ai Lu et J'Accepte la Charte Liencolis
          </button>
        </div>

      </div>
    </div>
  );
};
