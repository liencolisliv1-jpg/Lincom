import React, { useState, useEffect } from 'react';
import { ClassifiedAd, AdCategory, UserProfile } from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { calculateDeliveryCommission } from '../utils/pricingCalculator';
import {
  Radio,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Plus,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Zap,
  Sparkles,
  Store,
  Bike,
  User,
  HeartHandshake,
  Utensils,
  Share2,
  Bell,
  Percent,
} from 'lucide-react';

interface ClassifiedAdsBoardProps {
  ads: ClassifiedAd[];
  currentUser: UserProfile | null;
  onAddAd: (ad: ClassifiedAd) => void;
  onDeleteAd: (id: string) => void;
  isDarkMode: boolean;
  onOpenRecharge?: () => void;
}

export const ClassifiedAdsBoard: React.FC<ClassifiedAdsBoardProps> = ({
  ads,
  currentUser,
  onAddAd,
  onDeleteAd,
  isDarkMode,
  onOpenRecharge,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [showPostModal, setShowPostModal] = useState(false);
  const [, setTick] = useState(0); // Trigger countdown re-render every 10s

  const isDriver = currentUser?.role === 'driver';
  const isMuted = isDriver && storageService.isDriverMuted(currentUser);

  // New Ad Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<AdCategory>('individual_need');
  const [newCity, setNewCity] = useState('Cotonou');
  const [newPrice, setNewPrice] = useState('1500');
  const [newPhone, setNewPhone] = useState('+229 ');

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const calculateMinutesRemaining = (expiresAt: string): number => {
    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(remainingMs / 60000));
  };

  const activeAds = ads.filter((ad) => {
    const minutesLeft = calculateMinutesRemaining(ad.expiresAt);
    if (minutesLeft <= 0) return false;
    if (selectedCategory !== 'all' && ad.category !== selectedCategory) return false;
    if (selectedCity !== 'all' && ad.city !== selectedCity) return false;
    return true;
  });

  const handlePostAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const now = Date.now();
    const createdAd: ClassifiedAd = {
      id: `ad_${now}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      city: newCity,
      authorId: currentUser?.id || 'usr_anon',
      authorName: currentUser?.name || 'Utilisateur Liencolis',
      authorRole: currentUser?.role || 'client',
      phone: newPhone || currentUser?.phone || '+229 01 69 81 46 31',
      whatsapp: (newPhone || currentUser?.phone || '+2290169814632').replace(/[^\d]/g, ''),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 30 * 60000).toISOString(), // Exact 30 minutes lifetime
      isApproved: true,
      price: newPrice ? parseInt(newPrice) : undefined,
    };

    onAddAd(createdAd);
    
    // Trigger Web Push alert to drivers
    if (createdAd.category === 'recruitment') {
      notificationService.notifyNewRecruitmentAd(createdAd);
    } else if (createdAd.category === 'individual_need' || createdAd.category === 'driver_relay') {
      notificationService.notifyUrgentDelivery(
        createdAd.title,
        createdAd.city,
        createdAd.price || 1500
      );
    }

    setShowPostModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Alert on Ephemeral Ads */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/60 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Annonces Éphémères 30 Minutes</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AUTO-SUPPRESSION EN TEMPS RÉEL
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Besoin urgent d'un coursier, relais de colis entre collègues ou offre traiteur/restaurant : chaque publication reste active <strong>30 minutes</strong> puis s'efface automatiquement.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isMuted) {
              alert("🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est inférieur à 50 FCFA. Veuillez recharger votre portefeuille pour publier des annonces et contacter d'autres chauffeurs.");
              onOpenRecharge?.();
              return;
            }
            setShowPostModal(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105"
          id="btn-post-ad"
        >
          <Plus className="w-4 h-4" />
          <span>Publier une Annonce (30 min)</span>
        </button>
      </div>

      {/* SOURDINE INACTIVE ACCOUNT BANNER FOR DRIVERS (< 50 FCFA) */}
      {isMuted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-500/70 text-xs shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-red-300 flex items-center gap-2">
                <span>COMPTE EN SOURDINE (INACTIF - SOLDE &lt; 50 FCFA)</span>
              </h4>
              <p className="text-[11px] text-red-200">
                Votre solde prépayé est de <strong>{currentUser?.driverWallet?.balance ?? 0} FCFA</strong>. Pour postuler aux annonces et accepter de nouvelles courses, veuillez recharger votre portefeuille.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenRecharge?.()}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Recharger (Dès 250 F)</span>
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'all', label: 'Toutes les Annonces', icon: Filter },
            { id: 'individual_need', label: 'Particuliers (Urgence Colis)', icon: User },
            { id: 'driver_relay', label: 'Livreurs (Relais & Entraide)', icon: Bike },
            { id: 'restaurant_promo', label: 'Restaurants & Commerces', icon: Utensils },
            { id: 'recruitment', label: 'Recrutements', icon: Store },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">Toutes les Villes du Bénin</option>
            {BENIN_CITY_NAMES.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeAds.map((ad) => {
          const minutesLeft = calculateMinutesRemaining(ad.expiresAt);
          
          // Color coding for urgency: > 15min (Green), 5-15min (Orange), < 5min (Red)
          const urgencyColor =
            minutesLeft > 15
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : minutesLeft > 5
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';

          const categoryLabels: Record<AdCategory, { label: string; color: string }> = {
            individual_need: { label: 'Particulier', color: 'text-blue-400' },
            driver_relay: { label: 'Relais Livreur', color: 'text-emerald-400' },
            restaurant_promo: { label: 'Restaurant', color: 'text-amber-400' },
            merchant_call: { label: 'E-commerce', color: 'text-purple-400' },
            recruitment: { label: 'Recrutement', color: 'text-teal-400' },
            mutual_aid: { label: 'Entraide Don', color: 'text-rose-400' },
          };

          return (
            <div
              key={ad.id}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Top Row: Category & Countdown badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-black uppercase tracking-wider ${categoryLabels[ad.category]?.color}`}>
                  {categoryLabels[ad.category]?.label || 'Annonce'} • 📍 {ad.city}
                </span>

                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${urgencyColor}`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{minutesLeft} min restantes</span>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                  {ad.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {ad.description}
                </p>
              </div>

              {/* Price / Fee if present */}
              {ad.price && (
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">Rémunération / Budget :</span>
                    <span className="text-xs font-mono font-black text-amber-400">{ad.price.toLocaleString()} FCFA</span>
                  </div>
                  {currentUser?.role === 'driver' && (
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/60 font-mono">
                      {(() => {
                        const plan = currentUser.pricingPlan || currentUser.driverWallet?.pricingPlan || 'commission';
                        const calc = calculateDeliveryCommission(ad.price, true, plan);
                        if (plan === 'subscription') {
                          return (
                            <span className="text-emerald-400 font-bold">
                              👑 Abonné : 100% net ({ad.price.toLocaleString()} F)
                            </span>
                          );
                        }
                        return (
                          <>
                            <span className="text-slate-400">Comm. {calc.ratePercent}% ({calc.commissionAmount} F)</span>
                            <span className="text-emerald-400 font-bold">Net : {calc.netDriverPayout.toLocaleString()} F</span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Author & Action buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <p className="font-bold text-slate-200 truncate max-w-[120px]">{ad.authorName}</p>
                  <p className="text-[10px] capitalize text-slate-500">{ad.authorRole}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isMuted ? (
                    <button
                      type="button"
                      onClick={() => {
                        alert("🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est inférieur à 50 FCFA. Veuillez recharger votre portefeuille (à partir de 250 FCFA) pour débloquer les contacts et accepter des courses.");
                        onOpenRecharge?.();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-xs shadow transition-colors"
                      title="Compte en sourdine - Rechargez pour contacter"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sourdine (&lt; 50 F)</span>
                    </button>
                  ) : (
                    <>
                      <a
                        href={`tel:${ad.phone.replace(/\s+/g, '')}`}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow"
                        title="Appeler directement"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={`https://wa.me/${ad.whatsapp || ad.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Bonjour ${ad.authorName}, je vous contacte suite à votre annonce sur Liencolis : "${ad.title}"`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeAds.length === 0 && (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-3">
          <Radio className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-200">Aucune annonce active pour le moment dans cette catégorie.</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Les annonces sont éphémères et disparaissent après 30 minutes pour garder les informations fraîches et fiables.
          </p>
          <button
            onClick={() => setShowPostModal(true)}
            className="mt-2 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow"
          >
            Publier la première annonce
          </button>
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Publier une Annonce Éphémère (30 min)</h3>
              </div>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePostAd} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Catégorie *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AdCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="individual_need">Particulier (Besoin urgent d'un livreur)</option>
                  <option value="driver_relay">Livreur (Recherche de collègue pour relais colis)</option>
                  <option value="restaurant_promo">Restaurant / Traiteur (Livraison de repas)</option>
                  <option value="merchant_promo">E-commerçant / Boutique (Offres & courses)</option>
                  <option value="recruitment">Recrutement / Emploi Livreur</option>
                  <option value="mutual_aid">Entraide & Dons de matériel</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Titre de l'annonce *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Livreur urgent pour colis Dantokpa ➔ Calavi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Description détaillée *</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Précisez le type de colis, le lieu exact et les contraintes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ville Concernée *</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {BENIN_CITY_NAMES.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Rémunération proposée (FCFA)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Numéro WhatsApp / Appel *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cette annonce sera automatiquement supprimée du flux public après 30 minutes chrono.</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg"
                >
                  Publier l'Annonce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
