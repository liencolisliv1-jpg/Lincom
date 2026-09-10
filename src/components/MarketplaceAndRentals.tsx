import React, { useState, useEffect } from 'react';
import {
  MarketplaceItem,
  RentalItem,
  UserProfile,
  DirectConversation,
  VehicleType,
} from '../types';
import { BENIN_CITY_NAMES } from '../constants/beninCities';
import { storageService } from '../services/storageService';
import { MultiPhotoUploader } from './MultiPhotoUploader';
import { ImageLightboxModal } from './ImageLightboxModal';
import { DirectChatModal } from './DirectChatModal';
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Clock,
  MapPin,
  Car,
  Truck,
  Layers,
  Fuel,
  Weight,
  Gauge,
  Check,
  X,
  UserCheck,
  Star,
} from 'lucide-react';

interface MarketplaceAndRentalsProps {
  marketplaceItems: MarketplaceItem[];
  rentalItems: RentalItem[];
  currentUser: UserProfile | null;
  onAddMarketplaceItem: (item: MarketplaceItem) => void;
  onAddRentalItem: (rental: RentalItem) => void;
  isDarkMode: boolean;
  onOpenAuth?: () => void;
  onOpenPayment?: (purpose?: any) => void;
  initialTab?: 'market' | 'rentals' | 'conversations';
}

export const MarketplaceAndRentals: React.FC<MarketplaceAndRentalsProps> = ({
  marketplaceItems,
  rentalItems,
  currentUser,
  onAddMarketplaceItem,
  onAddRentalItem,
  isDarkMode,
  onOpenAuth,
  onOpenPayment,
  initialTab = 'market',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'market' | 'rentals' | 'conversations'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  const [searchFilter, setSearchFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');

  // Modal Visibility State
  const [showAddModal, setShowAddModal] = useState(false);

  // Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [lightboxSubtitle, setLightboxSubtitle] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Direct Conversation State
  const [activeConversation, setActiveConversation] = useState<DirectConversation | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [conversationsList, setConversationsList] = useState<DirectConversation[]>([]);

  // Card Image Carousel Index State: { [itemId: string]: number }
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  // New Market Item Form State
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mPrice, setMPrice] = useState('6500');
  const [mCategory, setMCategory] = useState<any>('gps_mount');
  const [mCondition, setMCondition] = useState<'new' | 'used'>('new');
  const [mCity, setMCity] = useState('Cotonou');
  const [mImages, setMImages] = useState<string[]>([]);

  // New Rental Form State
  const [rTitle, setRTitle] = useState('');
  const [rVehicleType, setRVehicleType] = useState<VehicleType>('tricycle');
  const [rDailyPrice, setRDailyPrice] = useState('7000');
  const [rWeeklyPrice, setRWeeklyPrice] = useState('42000');
  const [rDeposit, setRDeposit] = useState('20000');
  const [rCity, setRCity] = useState('Abomey-Calavi');
  const [rDesc, setRDesc] = useState('');
  const [rImages, setRImages] = useState<string[]>([]);
  const [rPayloadKg, setRPayloadKg] = useState('800');
  const [rFuelType, setRFuelType] = useState<'essence' | 'diesel' | 'electrique'>('essence');
  const [rHelmetIncluded, setRHelmetIncluded] = useState(true);
  const [rInsuranceIncluded, setRInsuranceIncluded] = useState(true);

  // Load conversations on mount & subTab change
  useEffect(() => {
    const list = storageService.getConversations(currentUser?.id);
    setConversationsList(list);
  }, [currentUser?.id, activeSubTab, isChatModalOpen]);

  const totalUnreadConversations = conversationsList.reduce((acc, c) => {
    if (currentUser?.id === c.buyerOrRenterId) return acc + (c.unreadCountForBuyer || 0);
    if (currentUser?.id === c.sellerOrOwnerId) return acc + (c.unreadCountForSeller || 0);
    return acc;
  }, 0);

  // Carousel Next/Prev handler
  const handleCarouselNav = (itemId: string, totalImages: number, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndices((prev) => {
      const current = prev[itemId] || 0;
      let nextIndex = direction === 'next' ? current + 1 : current - 1;
      if (nextIndex < 0) nextIndex = totalImages - 1;
      if (nextIndex >= totalImages) nextIndex = 0;
      return { ...prev, [itemId]: nextIndex };
    });
  };

  const handleOpenLightbox = (images: string[], title: string, subtitle?: string, startIndex = 0) => {
    const valid = images.filter((img) => Boolean(img && img.trim()));
    if (valid.length === 0) return;
    setLightboxImages(valid);
    setLightboxTitle(title);
    setLightboxSubtitle(subtitle || '');
    setIsLightboxOpen(true);
  };

  const handleStartConversation = (
    item: MarketplaceItem | RentalItem,
    targetType: 'marketplace' | 'rental'
  ) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const conv = storageService.getOrCreateConversation(item, targetType, currentUser);
    setActiveConversation(conv);
    setIsChatModalOpen(true);
  };

  const handleCreateMarketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mPrice) return;

    const finalImages = mImages.length > 0
      ? mImages
      : ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'];

    const newItem: MarketplaceItem = {
      id: `mkt_${Date.now()}`,
      title: mTitle,
      description: mDesc || 'Matériel de sécurité et livraison de qualité certifié.',
      price: parseInt(mPrice),
      condition: mCondition,
      category: mCategory,
      imageUrl: finalImages[0],
      images: finalImages,
      sellerId: currentUser?.id || 'usr_seller_01',
      sellerName: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Vendeur Liencolis',
      sellerPhone: currentUser?.phone || '+229 01 69 81 46 31',
      sellerCity: mCity || currentUser?.city || 'Cotonou',
      sellerCountry: 'Bénin',
      sellerCountryCode: 'BJ',
      sellerAvatar: currentUser?.avatarUrl,
      isSold: false,
      createdAt: new Date().toISOString(),
    };

    onAddMarketplaceItem(newItem);
    setShowAddModal(false);
    setMTitle('');
    setMDesc('');
    setMImages([]);
  };

  const handleCreateRentalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle || !rDailyPrice) return;

    const finalImages = rImages.length > 0
      ? rImages
      : ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'];

    const newRental: RentalItem = {
      id: `rnt_${Date.now()}`,
      title: rTitle,
      vehicleType: rVehicleType,
      dailyPrice: parseInt(rDailyPrice),
      weeklyPrice: rWeeklyPrice ? parseInt(rWeeklyPrice) : undefined,
      depositAmount: rDeposit ? parseInt(rDeposit) : undefined,
      city: rCity,
      country: 'Bénin',
      countryCode: 'BJ',
      imageUrl: finalImages[0],
      images: finalImages,
      ownerId: currentUser?.id || 'usr_owner_01',
      ownerName: currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Loueur Agréé',
      ownerPhone: currentUser?.phone || '+229 01 69 81 46 31',
      ownerWhatsapp: (currentUser?.phone || '+2290169814632').replace(/[^\d]/g, ''),
      ownerAvatar: currentUser?.avatarUrl,
      isAvailable: true,
      description: rDesc || 'Engin en excellent état avec visite technique, assurance et entretien régulier.',
      specs: {
        payloadCapacityKg: rPayloadKg ? parseInt(rPayloadKg) : 150,
        fuelType: rFuelType,
        hasHelmetIncluded: rHelmetIncluded,
        hasInsurance: rInsuranceIncluded,
        hasLockIncluded: true,
      },
      createdAt: new Date().toISOString(),
    };

    onAddRentalItem(newRental);
    setShowAddModal(false);
    setRTitle('');
    setRDesc('');
    setRImages([]);
  };

  // Filter items
  const filteredMarketplace = marketplaceItems.filter((item) => {
    const matchesSearch = !searchFilter || item.title.toLowerCase().includes(searchFilter.toLowerCase()) || item.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCity = cityFilter === 'all' || item.sellerCity.toLowerCase() === cityFilter.toLowerCase();
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCity && matchesCat;
  });

  const filteredRentals = rentalItems.filter((rental) => {
    const matchesSearch = !searchFilter || rental.title.toLowerCase().includes(searchFilter.toLowerCase()) || rental.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCity = cityFilter === 'all' || rental.city.toLowerCase() === cityFilter.toLowerCase();
    const matchesType = vehicleTypeFilter === 'all' || rental.vehicleType === vehicleTypeFilter;
    return matchesSearch && matchesCity && matchesType;
  });

  const categoryLabels: Record<string, string> = {
    gps_mount: '📱 Supports GPS & Chargeurs',
    delivery_bag: '🎒 Sacs Isothermes & Caissons',
    helmet: '🪖 Casques Homologués',
    jacket: '🦺 Gilets & Vêtements Pro',
    spare_parts: '⚙️ Pièces & Accessoires',
    other: '📦 Autres Équipements',
  };

  const vehicleLabels: Record<string, { label: string; icon: any; color: string }> = {
    moto_2wheels: { label: 'Moto 2 Roues', icon: Bike, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
    tricycle: { label: 'Tricycle Cargo Benne', icon: Truck, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    car_4wheels: { label: 'Camionnette Utilitaires', icon: Car, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shadow-inner">
            {activeSubTab === 'market' ? (
              <ShoppingBag className="w-7 h-7" />
            ) : activeSubTab === 'rentals' ? (
              <Bike className="w-7 h-7" />
            ) : (
              <MessageSquare className="w-7 h-7" />
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
              <span>Marketplace & Espace Location de Véhicules / Tricycles</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MULTI-PHOTOS & CHAT DIRECT
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
              Consultez les annonces avec galerie multi-photos, négociez en direct avec le vendeur ou le loueur, proposez des offres de prix et réservez motos, tricycles cargo et accessoires en toute sécurité.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeSubTab === 'market'
              ? 'Mettre en Vente du Matériel'
              : activeSubTab === 'rentals'
              ? 'Proposer un Véhicule / Tricycle'
              : 'Créer une Nouvelle Annonce'}
          </span>
        </button>
      </div>

      {/* Sub Tabs Navigation Selector */}
      <div className="flex flex-wrap items-center justify-center p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl mx-auto shadow-lg gap-1">
        <button
          onClick={() => setActiveSubTab('market')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'market'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Matériel & Pièces ({marketplaceItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rentals')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'rentals'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Location Motos & Tricycles ({rentalItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('conversations')}
          className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'conversations'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Mes Conversations ({conversationsList.length})</span>
          {totalUnreadConversations > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
              {totalUnreadConversations}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters Bar (only on Market and Rentals) */}
      {activeSubTab !== 'conversations' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3 shadow-md">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={
                activeSubTab === 'market'
                  ? 'Rechercher un support, sac isotherme, casque...'
                  : 'Rechercher tricycle cargo, moto 110cc, camionnette...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">Toutes les Villes</option>
              {BENIN_CITY_NAMES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Category / Vehicle Filter */}
          {activeSubTab === 'market' ? (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">Toutes les Catégories</option>
              <option value="gps_mount">Supports GPS & Chargeurs</option>
              <option value="delivery_bag">Sacs Isothermes & Caissons</option>
              <option value="helmet">Casques Moto Homologués</option>
              <option value="jacket">Gilets & Vestes</option>
              <option value="spare_parts">Pièces Détachées</option>
              <option value="other">Autres</option>
            </select>
          ) : (
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">Tous types de véhicules</option>
              <option value="moto_2wheels">Motos 2 Roues</option>
              <option value="tricycle">Tricycles Cargo Benne</option>
              <option value="car_4wheels">Camionnettes 4 Roues</option>
            </select>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MARKETPLACE ITEMS (Achat / Vente) */}
      {/* ========================================================================= */}
      {activeSubTab === 'market' && (
        <>
          {filteredMarketplace.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">Aucun matériel trouvé</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Aucun article ne correspond à vos filtres actuels. Modifiez la recherche ou publiez le premier article.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Mettre en Vente du Matériel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarketplace.map((item) => {
                const itemImages = item.images && item.images.length > 0 ? item.images : [item.imageUrl];
                const activeImgIndex = carouselIndices[item.id] || 0;
                const currentImg = itemImages[activeImgIndex] || itemImages[0];

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group"
                  >
                    {/* Top Image Carousel Area */}
                    <div className="relative h-52 bg-slate-950 overflow-hidden">
                      <img
                        src={currentImg}
                        alt={item.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() => handleOpenLightbox(itemImages, item.title, `Vendu par ${item.sellerName} à ${item.sellerCity}`, activeImgIndex)}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-950/85 backdrop-blur px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-200 border border-slate-700 shadow">
                          {item.condition === 'new' ? '✨ Neuf' : '👌 Occasion'}
                        </span>
                        <span className="bg-blue-600/90 text-white font-bold px-2 py-0.5 rounded-lg text-[9px] shadow">
                          {categoryLabels[item.category] || 'Matériel'}
                        </span>
                      </div>

                      {/* Multi-photo Indicator Badge */}
                      <button
                        onClick={() => handleOpenLightbox(itemImages, item.title, `Vendu par ${item.sellerName}`, activeImgIndex)}
                        className="absolute top-3 right-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur px-2 py-1 rounded-xl text-[10px] font-mono font-bold text-amber-300 border border-slate-700 flex items-center gap-1 shadow"
                        title="Voir toutes les photos en plein écran"
                      >
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>{activeImgIndex + 1}/{itemImages.length}</span>
                        <Maximize2 className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                      </button>

                      {/* Carousel Arrow Controls (if multi-photo) */}
                      {itemImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handleCarouselNav(item.id, itemImages.length, 'prev', e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all opacity-80 hover:opacity-100"
                            title="Photo précédente"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleCarouselNav(item.id, itemImages.length, 'next', e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all opacity-80 hover:opacity-100"
                            title="Photo suivante"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Price Badge */}
                      <div className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black px-3.5 py-1.5 rounded-2xl text-xs shadow-lg flex items-center gap-1">
                        <span>{item.price.toLocaleString()} FCFA</span>
                      </div>

                      {/* Mini Thumbnail Dots (if multi-photo) */}
                      {itemImages.length > 1 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                          {itemImages.map((_, dotIdx) => (
                            <div
                              key={dotIdx}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                dotIdx === activeImgIndex ? 'bg-amber-400 w-3' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-bold text-blue-400">
                            <MapPin className="w-3 h-3" />
                            <span>{item.sellerCity}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Vendeur : <strong className="text-slate-300">{item.sellerName}</strong>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mt-1 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Action Buttons: Chat in-app, Call, WhatsApp */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        {/* 1. Direct In-App Chat (Conversations) */}
                        <button
                          onClick={() => handleStartConversation(item, 'marketplace')}
                          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        >
                          <MessageCircle className="w-4 h-4 text-blue-200" />
                          <span>Discuter & Négocier (In-App)</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${item.sellerPhone.replace(/\s+/g, '')}`}
                            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center shrink-0"
                            title="Appeler directement"
                          >
                            <Phone className="w-4 h-4 text-emerald-400" />
                          </a>

                          <a
                            href={`https://wa.me/${item.sellerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                              `Bonjour ${item.sellerName}, je souhaite acheter votre article sur Liencolis : "${item.title}" (${item.price} FCFA).`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 px-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: VEHICLE RENTALS (Motos, Tricycles Cargo, Utilitaires) */}
      {/* ========================================================================= */}
      {activeSubTab === 'rentals' && (
        <>
          {filteredRentals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Bike className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">Aucun véhicule trouvé</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Aucun engin ne correspond à vos filtres. Modifiez la recherche ou proposez votre engin en location.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Proposer un Véhicule en Location
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRentals.map((rental) => {
                const rentalImages = rental.images && rental.images.length > 0 ? rental.images : [rental.imageUrl];
                const activeImgIndex = carouselIndices[rental.id] || 0;
                const currentImg = rentalImages[activeImgIndex] || rentalImages[0];
                const vConfig = vehicleLabels[rental.vehicleType] || {
                  label: 'Véhicule',
                  icon: Bike,
                  color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
                };
                const VehicleIcon = vConfig.icon;

                return (
                  <div
                    key={rental.id}
                    className="bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group"
                  >
                    {/* Top Image Carousel Area */}
                    <div className="relative h-52 bg-slate-950 overflow-hidden">
                      <img
                        src={currentImg}
                        alt={rental.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() =>
                          handleOpenLightbox(
                            rentalImages,
                            rental.title,
                            `Loueur : ${rental.ownerName} à ${rental.city} (${rental.dailyPrice} FCFA/j)`,
                            activeImgIndex
                          )
                        }
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border shadow backdrop-blur flex items-center gap-1 ${vConfig.color}`}>
                          <VehicleIcon className="w-3 h-3" />
                          <span>{vConfig.label}</span>
                        </span>
                        {rental.isAvailable && (
                          <span className="bg-emerald-500/90 text-slate-950 font-black px-2 py-0.5 rounded-lg text-[9px] shadow">
                            ✓ DISPONIBLE
                          </span>
                        )}
                      </div>

                      {/* Multi-photo Indicator Badge */}
                      <button
                        onClick={() => handleOpenLightbox(rentalImages, rental.title, `Loueur : ${rental.ownerName}`, activeImgIndex)}
                        className="absolute top-3 right-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur px-2 py-1 rounded-xl text-[10px] font-mono font-bold text-emerald-300 border border-slate-700 flex items-center gap-1 shadow"
                        title="Voir toutes les photos en plein écran"
                      >
                        <Camera className="w-3 h-3 text-emerald-400" />
                        <span>{activeImgIndex + 1}/{rentalImages.length}</span>
                        <Maximize2 className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                      </button>

                      {/* Carousel Arrow Controls (if multi-photo) */}
                      {rentalImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handleCarouselNav(rental.id, rentalImages.length, 'prev', e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all opacity-80 hover:opacity-100"
                            title="Photo précédente"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleCarouselNav(rental.id, rentalImages.length, 'next', e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all opacity-80 hover:opacity-100"
                            title="Photo suivante"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Daily Rate Badge */}
                      <div className="absolute bottom-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black px-3.5 py-1.5 rounded-2xl text-xs shadow-lg flex items-center gap-1">
                        <span>{rental.dailyPrice.toLocaleString()} FCFA / jour</span>
                      </div>

                      {/* Mini Thumbnail Dots (if multi-photo) */}
                      {rentalImages.length > 1 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                          {rentalImages.map((_, dotIdx) => (
                            <div
                              key={dotIdx}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                dotIdx === activeImgIndex ? 'bg-emerald-400 w-3' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <MapPin className="w-3 h-3" />
                            <span>{rental.city}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Loueur : <strong className="text-slate-300">{rental.ownerName}</strong>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mt-1 leading-snug line-clamp-2">
                          {rental.title}
                        </h3>

                        {/* Specs Badges (Tricycle cargo payload, Helmet, Insurance) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {rental.specs?.payloadCapacityKg && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1">
                              <Weight className="w-3 h-3 text-amber-400" />
                              <span>{rental.specs.payloadCapacityKg} kg max</span>
                            </span>
                          )}
                          {rental.specs?.fuelType && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 capitalize">
                              <Fuel className="w-3 h-3 text-blue-400" />
                              <span>{rental.specs.fuelType}</span>
                            </span>
                          )}
                          {rental.specs?.hasHelmetIncluded && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Casque fourni</span>
                            </span>
                          )}
                          {rental.depositAmount && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                              Caution : {rental.depositAmount.toLocaleString()} FCFA
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {rental.description}
                        </p>

                        {rental.weeklyPrice && (
                          <p className="text-[11px] text-amber-400 font-bold mt-1">
                            Tarif Semaine avantageux : {rental.weeklyPrice.toLocaleString()} FCFA
                          </p>
                        )}
                      </div>

                      {/* Action Buttons: Chat in-app, Call, WhatsApp */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        {/* 1. Direct In-App Chat (Conversations) */}
                        <button
                          onClick={() => handleStartConversation(rental, 'rental')}
                          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        >
                          <MessageCircle className="w-4 h-4 text-slate-950" />
                          <span>Discuter & Réserver la Location</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${rental.ownerPhone.replace(/\s+/g, '')}`}
                            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center shrink-0"
                            title="Appeler le loueur"
                          >
                            <Phone className="w-4 h-4 text-emerald-400" />
                          </a>

                          <a
                            href={`https://wa.me/${(rental.ownerWhatsapp || rental.ownerPhone).replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                              `Bonjour ${rental.ownerName}, je souhaite louer votre engin sur Liencolis : "${rental.title}" (${rental.dailyPrice} FCFA/jour).`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 px-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MY DIRECT CONVERSATIONS (Achats, Ventes, Locations) */}
      {/* ========================================================================= */}
      {activeSubTab === 'conversations' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Messagerie Directe Liencolis</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Toutes vos discussions en cours avec les vendeurs de matériel et loueurs d'engins.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-300">
                {conversationsList.length} conversation(s)
              </span>
            </div>

            {conversationsList.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Aucune conversation active</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Cliquez sur « Discuter & Négocier » ou « Réserver la Location » sur une annonce pour initier un échange.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveSubTab('market')}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    Explorer le Matériel
                  </button>
                  <button
                    onClick={() => setActiveSubTab('rentals')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Explorer les Locations
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationsList.map((conv) => {
                  const isMeBuyer = currentUser ? currentUser.id === conv.buyerOrRenterId : true;
                  const partnerName = isMeBuyer ? conv.sellerOrOwnerName : conv.buyerOrRenterName;
                  const unreadCount = isMeBuyer ? conv.unreadCountForBuyer : conv.unreadCountForSeller;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv);
                        setIsChatModalOpen(true);
                      }}
                      className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <img
                            src={conv.itemImageUrl}
                            alt={conv.itemTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-center py-0.5 text-[8px] font-black text-amber-300">
                            {conv.targetType === 'marketplace' ? 'VENTE' : 'LOCATION'}
                          </span>
                        </div>

                        {/* Text and excerpts */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate max-w-[240px] sm:max-w-[340px]">
                              {conv.itemTitle}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black shrink-0">
                              {conv.itemPrice.toLocaleString()} FCFA{conv.itemPriceType === 'per_day' ? '/j' : ''}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                            <span>Avec <strong>{partnerName}</strong> :</span>
                            <span className="text-slate-400 italic">"{conv.lastMessageText}"</span>
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(conv.lastMessageTimestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </span>
                            {conv.itemSecondaryInfo && (
                              <>
                                <span>•</span>
                                <span>{conv.itemSecondaryInfo}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side status & action */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs animate-bounce shadow">
                            {unreadCount} nouveau(x)
                          </span>
                        )}

                        <button className="px-3.5 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Ouvrir le Chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD MODAL (Marketplace / Rental creation with Multi-Photo Uploader) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                {activeSubTab === 'market' ? (
                  <>
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                    <span>Mettre en Vente du Matériel (Multi-photos)</span>
                  </>
                ) : (
                  <>
                    <Bike className="w-5 h-5 text-amber-400" />
                    <span>Proposer un Véhicule / Tricycle en Location (Multi-photos)</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeSubTab === 'market' ? (
              <form onSubmit={handleCreateMarketItem} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Titre de l'Annonce *</label>
                  <input
                    type="text"
                    required
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="Ex: Support Smartphone guidon étanche avec chargeur USB 3.0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Prix de Vente (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={mPrice}
                      onChange={(e) => setMPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Catégorie</label>
                    <select
                      value={mCategory}
                      onChange={(e) => setMCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="gps_mount">Support GPS & Chargeur</option>
                      <option value="delivery_bag">Sac Isotherme & Caisson</option>
                      <option value="helmet">Casque Moto Homologué</option>
                      <option value="jacket">Gilet / Veste Haute Visibilité</option>
                      <option value="spare_parts">Pièces & Accessoires</option>
                      <option value="other">Autre équipement</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">État de l'article</label>
                    <select
                      value={mCondition}
                      onChange={(e) => setMCondition(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="new">✨ Neuf sous emballage</option>
                      <option value="used">👌 Occasion très bon état</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Ville de disponibilité</label>
                  <select
                    value={mCity}
                    onChange={(e) => setMCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {BENIN_CITY_NAMES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Multi-Photo Uploader Component */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <MultiPhotoUploader
                    images={mImages}
                    onChange={setMImages}
                    maxPhotos={5}
                    label="Photos de l'équipement (jusqu'à 5 photos)"
                    helperText="Prenez des photos sous plusieurs angles (vue d'ensemble, fixation, zoom sur le système d'étanchéité, etc.)."
                    themeColor="blue"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Description détaillée</label>
                  <textarea
                    rows={3}
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    placeholder="Précisez la compatibilité, la robustesse, les dimensions et les modalités de remise en main propre..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/20"
                  >
                    Publier l'Article sur Liencolis
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateRentalItem} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Modèle / Nom du Véhicule *</label>
                  <input
                    type="text"
                    required
                    value={rTitle}
                    onChange={(e) => setRTitle(e.target.value)}
                    placeholder="Ex: Tricycle Cargo Dayang 200cc avec Benne Renforcée"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Type d'engin</label>
                    <select
                      value={rVehicleType}
                      onChange={(e) => setRVehicleType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="tricycle">🛺 Tricycle Cargo Benne</option>
                      <option value="moto_2wheels">🛵 Moto 2 Roues</option>
                      <option value="car_4wheels">🚚 Camionnette 4 Roues</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Tarif Journalier (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={rDailyPrice}
                      onChange={(e) => setRDailyPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Tarif Semaine (FCFA)</label>
                    <input
                      type="number"
                      value={rWeeklyPrice}
                      onChange={(e) => setRWeeklyPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Ville</label>
                    <select
                      value={rCity}
                      onChange={(e) => setRCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {BENIN_CITY_NAMES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Capacité de charge (kg)</label>
                    <input
                      type="number"
                      value={rPayloadKg}
                      onChange={(e) => setRPayloadKg(e.target.value)}
                      placeholder="Ex: 800"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">Caution demandée (FCFA)</label>
                    <input
                      type="number"
                      value={rDeposit}
                      onChange={(e) => setRDeposit(e.target.value)}
                      placeholder="Ex: 20000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Specs Checkboxes */}
                <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rHelmetIncluded}
                      onChange={(e) => setRHelmetIncluded(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Casque & Antivol fournis</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rInsuranceIncluded}
                      onChange={(e) => setRInsuranceIncluded(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>Assurance & Visite technique à jour</span>
                  </label>
                </div>

                {/* Multi-Photo Uploader Component for Rentals */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <MultiPhotoUploader
                    images={rImages}
                    onChange={setRImages}
                    maxPhotos={5}
                    label="Photos du véhicule / tricycle (jusqu'à 5 photos)"
                    helperText="Prenez des photos de face, de profil, de la benne cargo, du tableau de bord/compteur et des pneus."
                    themeColor="amber"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Conditions et Description</label>
                  <textarea
                    rows={3}
                    value={rDesc}
                    onChange={(e) => setRDesc(e.target.value)}
                    placeholder="Précisez la consommation, les documents requis (permis, CIP), l'état de la benne cargo et les horaires de récupération..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
                  >
                    Publier l'Engin en Location
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Lightbox Zoom Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={lightboxImages}
        title={lightboxTitle}
        subtitle={lightboxSubtitle}
      />

      {/* Direct In-App Chat Modal */}
      <DirectChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        conversation={activeConversation}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
