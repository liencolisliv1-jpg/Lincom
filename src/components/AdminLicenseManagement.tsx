import React, { useState } from 'react';
import { AppLicense, LicenseType, LicenseStatus, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import confetti from 'canvas-confetti';
import {
  KeyRound,
  ShieldCheck,
  PlusCircle,
  Copy,
  Check,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Phone,
  Bike,
  Truck,
  Car,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Share2,
  Trash2,
  Crown,
  FileText,
  DollarSign,
  Send,
  Zap,
} from 'lucide-react';

interface AdminLicenseManagementProps {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  onRefreshUsers?: () => void;
  isDarkMode: boolean;
}

export const AdminLicenseManagement: React.FC<AdminLicenseManagementProps> = ({
  currentUser,
  allUsers,
  onRefreshUsers,
  isDarkMode,
}) => {
  const [licenses, setLicenses] = useState<AppLicense[]>(() => storageService.getLicenses());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LicenseStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LicenseType>('all');

  // New License Generator Form State
  const [newType, setNewType] = useState<LicenseType>('subscription_2wheels');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newPrice, setNewPrice] = useState<number>(1200);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [createdLicense, setCreatedLicense] = useState<AppLicense | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Quick Verification State
  const [verifyKeyInput, setVerifyKeyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<AppLicense | null>(null);

  const driversList = allUsers.filter((u) => u.role === 'driver');

  const refreshList = () => {
    const updated = storageService.getLicenses();
    setLicenses(updated);
  };

  const handleTypeChange = (type: LicenseType) => {
    setNewType(type);
    if (type === 'subscription_2wheels') setNewPrice(1200);
    else if (type === 'subscription_tricycle') setNewPrice(1500);
    else if (type === 'subscription_4wheels') setNewPrice(2000);
    else if (type === 'vip_badge') setNewPrice(300);
    else if (type === 'fleet_enterprise') setNewPrice(5000);
    else setNewPrice(1000);
  };

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    const targetUser = driversList.find((u) => u.id === targetUserId);

    const newLic = storageService.createLicense({
      type: newType,
      durationDays: Number(newDuration),
      priceFcfa: Number(newPrice),
      targetUserId: targetUser ? targetUser.id : undefined,
      targetUserName: targetUser ? targetUser.name : undefined,
      targetUserPhone: targetUser ? targetUser.phone : undefined,
      driverVehicleType: targetUser?.vehicleType,
      notes: customNotes || `Licence délivrée par l'administrateur ${currentUser?.name || ''}`,
      grantedBy: 'admin_manual',
    });

    // Sync with Firestore Cloud
    firestoreService.saveLicense(newLic);

    setCreatedLicense(newLic);
    refreshList();
    if (onRefreshUsers) onRefreshUsers();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    setActionSuccessMsg(`Licence créée avec succès ! Clé : ${newLic.licenseKey}`);
    setTargetUserId('');
    setCustomNotes('');
  };

  const handleExtendLicense = (license: AppLicense, extraDays: number) => {
    const currentExpiry = new Date(license.expiresAt).getTime();
    const now = Date.now();
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const updatedExpiry = new Date(baseTime + extraDays * 86400000).toISOString();

    const updatedLicense: AppLicense = {
      ...license,
      expiresAt: updatedExpiry,
      durationDays: (license.durationDays || 30) + extraDays,
      status: 'active',
      notes: `${license.notes || ''} | Prolongée de ${extraDays} jours le ${new Date().toLocaleDateString('fr-FR')}`,
    };

    storageService.updateLicense(updatedLicense);
    firestoreService.saveLicense(updatedLicense);

    // If assigned to user, extend user subscription
    if (license.targetUserId) {
      const user = allUsers.find((u) => u.id === license.targetUserId);
      if (user) {
        if (license.licenseType === 'vip_badge') {
          user.premiumBadgeUntil = updatedExpiry;
        } else {
          user.pricingPlan = 'subscription';
          user.subscriptionExpiresAt = updatedExpiry;
        }
        storageService.setUser(user);
        if (onRefreshUsers) onRefreshUsers();
      }
    }

    refreshList();
    setActionSuccessMsg(`Licence ${license.licenseKey} prolongée de +${extraDays} jours (jusqu'au ${new Date(updatedExpiry).toLocaleDateString('fr-FR')})`);
  };

  const handleToggleStatus = (license: AppLicense) => {
    const newStatus: LicenseStatus = license.status === 'suspended' ? 'active' : 'suspended';
    const updatedLicense: AppLicense = {
      ...license,
      status: newStatus,
    };

    storageService.updateLicense(updatedLicense);
    firestoreService.saveLicense(updatedLicense);

    if (license.targetUserId) {
      const user = allUsers.find((u) => u.id === license.targetUserId);
      if (user) {
        if (newStatus === 'suspended') {
          user.pricingPlan = 'commission';
        } else {
          user.pricingPlan = 'subscription';
        }
        storageService.setUser(user);
        if (onRefreshUsers) onRefreshUsers();
      }
    }

    refreshList();
    setActionSuccessMsg(`Statut de la licence ${license.licenseKey} mis à jour : ${newStatus === 'suspended' ? 'Suspendue' : 'Réactivée'}`);
  };

  const handleDeleteLicense = (id: string) => {
    if (!window.confirm('Êtes-vous certain de vouloir supprimer définitivement cette licence ?')) return;
    storageService.deleteLicense(id);
    firestoreService.deleteLicense(id);
    refreshList();
    setActionSuccessMsg('Licence supprimée avec succès.');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShareOnWhatsApp = (license: AppLicense) => {
    const phone = license.targetUserPhone ? license.targetUserPhone.replace(/\s+/g, '') : '';
    const expiryDate = new Date(license.expiresAt).toLocaleDateString('fr-FR');
    const message = encodeURIComponent(
      `🎉 *LIENCOLIS DRIVER - ATTESTATION DE LICENCE OFFICIELLE*\n\n` +
      `Bonjour ${license.targetUserName || 'Chauffeur'},\n` +
      `Votre licence *${license.title}* est active !\n\n` +
      `🔑 *Clé d'activation :* ${license.licenseKey}\n` +
      `📅 *Valide jusqu'au :* ${expiryDate}\n` +
      `🛡️ *Avantages :* 0% de commission sur vos courses & Assistance VIP.\n\n` +
      `Bonne route avec LienColis Driver ! 🛵💨\nhttps://lincom-1ecc6.web.app`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Stats Calculations
  const activeLicenses = licenses.filter((l) => l.status === 'active' && new Date(l.expiresAt).getTime() > Date.now());
  const expiringSoonLicenses = licenses.filter((l) => {
    const daysLeft = Math.ceil((new Date(l.expiresAt).getTime() - Date.now()) / 86400000);
    return l.status === 'active' && daysLeft > 0 && daysLeft <= 7;
  });
  const pendingKeys = licenses.filter((l) => l.status === 'pending');
  const totalRevenueFcfa = licenses.reduce((sum, l) => sum + (l.priceFcfa || 0), 0);

  // Filtered list
  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch =
      l.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.targetUserName && l.targetUserName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.targetUserPhone && l.targetUserPhone.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? l.status === 'active' && new Date(l.expiresAt).getTime() > Date.now()
        : statusFilter === 'expired'
        ? new Date(l.expiresAt).getTime() <= Date.now()
        : l.status === statusFilter;

    const matchesType = typeFilter === 'all' ? true : l.licenseType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-wider mb-1">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Contrôle & Registre Super-Administrateur</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span>Gestion des Licences & Abonnements</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                0% Commission
              </span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              Générez des clés d'activation, octroyez des abonnements mensuels/annuels, prolongez les licences et suivez les droits d'accès des chauffeurs.
            </p>
          </div>

          <button
            onClick={refreshList}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-black flex items-center gap-1.5 transition-all shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser Registre</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
              <span>Licences Actives</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{activeLicenses.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Formule 0% commission active</div>
          </div>

          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
              <span>Expirant sous 7j</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{expiringSoonLicenses.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Renouvellements à anticiper</div>
          </div>

          <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-1">
              <span>Clés Prépayées Libres</span>
              <KeyRound className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-300">{pendingKeys.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Prêtes à être activées</div>
          </div>

          <div className="bg-slate-950/70 border border-indigo-500/30 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-1">
              <span>Volume Licences</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-200">{totalRevenueFcfa.toLocaleString('fr-FR')} F</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Total cotisations enregistrées</div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-rose-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulaire de Création / Génération de Licence */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md">
        <div className="flex items-center gap-2 text-white font-black text-base md:text-lg mb-4">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span>Créer / Générer une Nouvelle Licence Chauffeur</span>
        </div>

        <form onSubmit={handleCreateLicense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Type de Licence */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5">Type de Licence / Formule</label>
              <select
                value={newType}
                onChange={(e) => handleTypeChange(e.target.value as LicenseType)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="subscription_2wheels">🛵 Moto 2 Roues (1 200 FCFA/mois)</option>
                <option value="subscription_tricycle">🛺 Tricycle Cargo (1 500 FCFA/mois)</option>
                <option value="subscription_4wheels">🚗 4 Roues / Camionnette (2 000 FCFA/mois)</option>
                <option value="vip_badge">👑 Badge VIP Or Prioritaire (300 FCFA/sem)</option>
                <option value="fleet_enterprise">🏢 Flotte Entreprise (5 000 FCFA/mois)</option>
                <option value="custom">⚙️ Licence Spéciale Personnalisée</option>
              </select>
            </div>

            {/* Durée de validité */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5">Durée de Validité</label>
              <select
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value={7}>7 jours (1 Semaine)</option>
                <option value={30}>30 jours (1 Mois standard)</option>
                <option value={90}>90 jours (3 Mois Trimestre)</option>
                <option value={180}>180 jours (6 Mois Semestre)</option>
                <option value={365}>365 jours (1 An Annuel)</option>
              </select>
            </div>

            {/* Tarif FCFA */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5">Montant Facturé (FCFA)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                placeholder="1200"
              />
            </div>

            {/* Attribution Chauffeur */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-1.5">Bénéficiaire Chauffeur</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="">🎟️ Clé Libre (Prépayée / Carte)</option>
                {driversList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone}) - {d.pricingPlan === 'subscription' ? 'Abonné' : 'Commission'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes administratives */}
          <div>
            <label className="block text-xs font-black text-slate-300 mb-1.5">Notes Administratives & Motif</label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ex: Règlement espèces agence Dantokpa, Offre promo bienvenue, etc."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Générer & Activer la Licence</span>
            </button>
          </div>
        </form>

        {/* Dernier résultat de création */}
        {createdLicense && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div>
              <div className="text-xs text-indigo-300 font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Nouvelle Clé de Licence Générée avec Succès :</span>
              </div>
              <div className="text-base font-black text-amber-300 font-mono tracking-wider mt-1 select-all">
                {createdLicense.licenseKey}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                {createdLicense.title} • {createdLicense.durationDays} jours • {createdLicense.priceFcfa} FCFA
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(createdLicense.licenseKey, createdLicense.id)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1 shadow"
              >
                {copiedKey === createdLicense.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === createdLicense.id ? 'Copié !' : 'Copier Clé'}</span>
              </button>
              {createdLicense.targetUserPhone && (
                <button
                  onClick={() => handleShareOnWhatsApp(createdLicense)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1 shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par clé (LC-...), nom de chauffeur, téléphone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tous les Statuts</option>
            <option value="active">Actives (En cours)</option>
            <option value="pending">En attente (Clés libres)</option>
            <option value="expired">Expirées</option>
            <option value="suspended">Suspendues</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tous les Véhicules</option>
            <option value="subscription_2wheels">Motos 2 Roues</option>
            <option value="subscription_tricycle">Tricycles</option>
            <option value="subscription_4wheels">4 Roues</option>
            <option value="vip_badge">Badges VIP</option>
            <option value="fleet_enterprise">Flotte</option>
          </select>
        </div>
      </div>

      {/* Registre des Licences (Tableau & Cartes) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Registre des Licences ({filteredLicenses.length} trouvée{filteredLicenses.length > 1 ? 's' : ''})</span>
          </div>
        </div>

        {filteredLicenses.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <KeyRound className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-bold">Aucune licence ne correspond aux critères de recherche.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredLicenses.map((lic) => {
              const isExpired = new Date(lic.expiresAt).getTime() <= Date.now();
              const daysRemaining = Math.max(0, Math.ceil((new Date(lic.expiresAt).getTime() - Date.now()) / 86400000));
              const isSuspended = lic.status === 'suspended';

              return (
                <div key={lic.id} className="p-4 md:p-5 hover:bg-slate-850/50 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Left: Info & Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm md:text-base font-black text-white">{lic.title}</span>

                        {/* Status Badge */}
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Suspendue
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/30">
                            Expirée
                          </span>
                        ) : lic.status === 'pending' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            En Attente d'Activation
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active ({daysRemaining}j restants)
                          </span>
                        )}

                        {lic.licenseType === 'vip_badge' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            VIP Or
                          </span>
                        )}
                      </div>

                      {/* License Key with Copy Button */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 select-all">
                          {lic.licenseKey}
                        </span>
                        <button
                          onClick={() => copyToClipboard(lic.licenseKey, lic.id)}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Copier la clé"
                        >
                          {copiedKey === lic.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Bénéficiaire & Dates */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Chauffeur : <strong>{lic.targetUserName || 'Clé non attribuée'}</strong></span>
                        </div>
                        {lic.targetUserPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{lic.targetUserPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Émise le : {new Date(lic.issuedAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Expire le : <strong>{new Date(lic.expiresAt).toLocaleDateString('fr-FR')}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-bold">
                          <span>{lic.priceFcfa} FCFA</span>
                        </div>
                      </div>

                      {lic.notes && (
                        <p className="text-[11px] text-slate-400 italic">
                          Note : {lic.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Prolonger +30j */}
                      <button
                        onClick={() => handleExtendLicense(lic, 30)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Prolonger de 30 jours"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+30j</span>
                      </button>

                      {/* Prolonger +90j */}
                      <button
                        onClick={() => handleExtendLicense(lic, 90)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Prolonger de 90 jours (Trimestre)"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+90j</span>
                      </button>

                      {/* Share WhatsApp */}
                      {lic.targetUserPhone && (
                        <button
                          onClick={() => handleShareOnWhatsApp(lic)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                          title="Envoyer l'attestation par WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {/* Suspend / Resume */}
                      <button
                        onClick={() => handleToggleStatus(lic)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSuspended
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                        title={isSuspended ? 'Réactiver la licence' : 'Suspendre la licence'}
                      >
                        {isSuspended ? 'Réactiver' : 'Suspendre'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteLicense(lic.id)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-500/30 transition-all"
                        title="Supprimer la licence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
