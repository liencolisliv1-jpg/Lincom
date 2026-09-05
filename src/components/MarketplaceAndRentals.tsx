import React, { useState } from 'react';
import { MarketplaceItem, RentalItem, UserProfile } from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  ShoppingBag,
  Bike,
  Plus,
  Phone,
  MessageCircle,
  Tag,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';

interface MarketplaceAndRentalsProps {
  marketplaceItems: MarketplaceItem[];
  rentalItems: RentalItem[];
  currentUser: UserProfile | null;
  onAddMarketplaceItem: (item: MarketplaceItem) => void;
  onAddRentalItem: (rental: RentalItem) => void;
  isDarkMode: boolean;
}

export const MarketplaceAndRentals: React.FC<MarketplaceAndRentalsProps> = ({
  marketplaceItems,
  rentalItems,
  currentUser,
  onAddMarketplaceItem,
  onAddRentalItem,
  isDarkMode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'market' | 'rentals'>('market');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'market' | 'rental'>('market');

  // New Market Item Form
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mPrice, setMPrice] = useState('5000');
  const [mCategory, setMCategory] = useState<any>('gps_mount');
  const [mCondition, setMCondition] = useState<'new' | 'used'>('new');
  const [mImage, setMImage] = useState('');

  // New Rental Form
  const [rTitle, setRTitle] = useState('');
  const [rVehicleType, setRVehicleType] = useState<any>('moto_2wheels');
  const [rDailyPrice, setRDailyPrice] = useState('3000');
  const [rWeeklyPrice, setRWeeklyPrice] = useState('18000');
  const [rCity, setRCity] = useState('Cotonou');
  const [rDesc, setRDesc] = useState('');
  const [rImage, setRImage] = useState('');

  const handleOpenPhotoCapture = (target: 'market' | 'rental') => {
    setCameraTarget(target);
    setShowCameraModal(true);
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    if (cameraTarget === 'market') {
      setMImage(photoDataUrl);
    } else {
      setRImage(photoDataUrl);
    }
  };

  const handleCreateMarketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mPrice) return;

    const newItem: MarketplaceItem = {
      id: `mkt_${Date.now()}`,
      title: mTitle,
      description: mDesc || 'Matériel de qualité pour livreur.',
      price: parseInt(mPrice),
      condition: mCondition,
      category: mCategory,
      imageUrl: mImage || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
      sellerId: currentUser?.id || 'usr_01',
      sellerName: currentUser?.name || 'Vendeur Liencolis',
      sellerPhone: currentUser?.phone || '+229 01 69 81 46 31',
      sellerCity: currentUser?.city || 'Cotonou',
      isSold: false,
      createdAt: new Date().toISOString(),
    };

    onAddMarketplaceItem(newItem);
    setShowAddModal(false);
    setMTitle('');
    setMDesc('');
  };

  const handleCreateRentalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle || !rDailyPrice) return;

    const newRental: RentalItem = {
      id: `rnt_${Date.now()}`,
      title: rTitle,
      vehicleType: rVehicleType,
      dailyPrice: parseInt(rDailyPrice),
      weeklyPrice: rWeeklyPrice ? parseInt(rWeeklyPrice) : undefined,
      city: rCity,
      imageUrl: rImage || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      ownerName: currentUser?.name || 'Loueur Agréé',
      ownerPhone: currentUser?.phone || '+229 01 69 81 46 31',
      ownerWhatsapp: (currentUser?.phone || '+2290169814632').replace(/[^\d]/g, ''),
      isAvailable: true,
      description: rDesc || 'Engin en excellent état avec visite technique à jour.',
    };

    onAddRentalItem(newRental);
    setShowAddModal(false);
    setRTitle('');
    setRDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            {activeSubTab === 'market' ? <ShoppingBag className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Marketplace & Location d'Engins Liencolis</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AFFAIRES VÉRIFIÉES
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Achetez vos équipements de sécurité (sacs isothermes, casques, supports GPS) et louez motos, tricycles et utilitaires entre professionnels et particuliers.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === 'market' ? 'Mettre en Vente du Matériel' : 'Proposer un Engin en Location'}</span>
        </button>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center justify-center p-1 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveSubTab('market')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'market'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Achat & Vente Matériel ({marketplaceItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rentals')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'rentals'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Location Motos & Tricycles ({rentalItems.length})</span>
        </button>
      </div>

      {/* TAB 1: Marketplace Items */}
      {activeSubTab === 'market' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-800 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-200 border border-slate-700">
                  {item.condition === 'new' ? '✨ État Neuf' : '👌 Très Bon État'}
                </div>
                <div className="absolute bottom-3 right-3 bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl text-xs shadow-lg">
                  {item.price} FCFA
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                    📍 {item.sellerCity} • Vendeur: {item.sellerName}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <a
                    href={`tel:${item.sellerPhone.replace(/\s+/g, '')}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Appeler"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://wa.me/${item.sellerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Bonjour ${item.sellerName}, je souhaite acheter votre article sur Liencolis : "${item.title}" (${item.price} FCFA).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Vehicle Rentals */}
      {activeSubTab === 'rentals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentalItems.map((rental) => {
            const vehicleLabels: Record<string, string> = {
              moto_2wheels: '🛵 Moto 2 Roues',
              tricycle: '🛺 Tricycle Cargo',
              car_4wheels: '🚚 Camionnette 4 Roues',
            };

            return (
              <div
                key={rental.id}
                className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div className="relative h-48 bg-slate-800 overflow-hidden">
                  <img
                    src={rental.imageUrl}
                    alt={rental.title}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow">
                    {vehicleLabels[rental.vehicleType] || 'Engin'}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl text-xs shadow-lg">
                    {rental.dailyPrice} FCFA / jour
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      📍 {rental.city} • Propriétaire: {rental.ownerName}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1 leading-snug">{rental.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{rental.description}</p>
                    {rental.weeklyPrice && (
                      <p className="text-[11px] text-amber-400 font-semibold mt-1">
                        Tarif Semaine avantageux : {rental.weeklyPrice} FCFA
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <a
                      href={`tel:${rental.ownerPhone.replace(/\s+/g, '')}`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      title="Appeler"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <a
                      href={`https://wa.me/${rental.ownerWhatsapp || rental.ownerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Bonjour ${rental.ownerName}, je souhaite louer votre engin : "${rental.title}" (${rental.dailyPrice} FCFA/jour) disponible sur Liencolis.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Réserver Location</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {activeSubTab === 'market' ? 'Mettre en Vente un Matériel' : 'Ajouter un Engin en Location'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {activeSubTab === 'market' ? (
              <form onSubmit={handleCreateMarketItem} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Nom du Matériel *</label>
                  <input
                    type="text"
                    required
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="Ex: Support Smartphone guidon étanche"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Prix (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={mPrice}
                      onChange={(e) => setMPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">État</label>
                    <select
                      value={mCondition}
                      onChange={(e) => setMCondition(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="new">Neuf sous emballage</option>
                      <option value="used">Occasion bon état</option>
                    </select>
                  </div>
                </div>

                {/* Photo Upload / Camera Capture Section */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block mb-1">
                    Photo de l'article (Caméra Smartphone ou Lien) *
                  </label>

                  {mImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
                      <img
                        src={mImage}
                        alt="Aperçu article"
                        className="w-16 h-16 rounded-xl object-cover object-center border border-slate-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Photo enregistrée avec succès</span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">Prête pour publication</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoCapture('market')}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs border border-slate-700 transition-colors"
                          title="Reprendre la photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMImage('')}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs border border-slate-700 transition-colors"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoCapture('market')}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-2 shadow transition-all"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>Prendre Photo (Caméra)</span>
                      </button>

                      <div className="relative">
                        <input
                          type="url"
                          value={mImage}
                          onChange={(e) => setMImage(e.target.value)}
                          placeholder="Ou coller un lien photo..."
                          className="w-full h-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-lg"
                >
                  Publier l'Article
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateRentalItem} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Modèle / Marque du Véhicule *</label>
                  <input
                    type="text"
                    required
                    value={rTitle}
                    onChange={(e) => setRTitle(e.target.value)}
                    placeholder="Ex: Moto Haojue 110cc"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Type d'engin</label>
                    <select
                      value={rVehicleType}
                      onChange={(e) => setRVehicleType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="moto_2wheels">Moto 2 Roues</option>
                      <option value="tricycle">Tricycle Cargo</option>
                      <option value="car_4wheels">Camionnette 4 Roues</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Ville</label>
                    <select
                      value={rCity}
                      onChange={(e) => setRCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      {BENIN_CITY_NAMES.map((cityName) => (
                        <option key={cityName} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Prix Journalier (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={rDailyPrice}
                      onChange={(e) => setRDailyPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Prix Semaine (FCFA)</label>
                    <input
                      type="number"
                      value={rWeeklyPrice}
                      onChange={(e) => setRWeeklyPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                {/* Rental Photo Section */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block mb-1">
                    Photo de l'engin (Caméra Smartphone ou Lien) *
                  </label>

                  {rImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
                      <img
                        src={rImage}
                        alt="Aperçu engin"
                        className="w-16 h-16 rounded-xl object-cover object-center border border-slate-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Photo engin enregistrée avec succès</span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">Prête pour location</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoCapture('rental')}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs border border-slate-700 transition-colors"
                          title="Reprendre la photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRImage('')}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs border border-slate-700 transition-colors"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoCapture('rental')}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center gap-2 shadow transition-all"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>Prendre Photo de l'Engin</span>
                      </button>

                      <div className="relative">
                        <input
                          type="url"
                          value={rImage}
                          onChange={(e) => setRImage(e.target.value)}
                          placeholder="Ou coller un lien photo..."
                          className="w-full h-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg"
                >
                  Publier l'Engin en Location
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reusable Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCaptured}
        title={cameraTarget === 'market' ? 'Prendre en Photo le Matériel' : "Prendre en Photo l'Engin"}
      />
    </div>
  );
};
