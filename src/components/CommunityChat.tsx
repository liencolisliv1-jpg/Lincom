import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, UserProfile, UserRole, PaymentPurpose } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { EmojiStickerPicker, DriverSticker } from './EmojiStickerPicker';
import { storageService } from '../services/storageService';
import {
  MessageSquare,
  Users,
  Mic,
  MicOff,
  Image,
  Video,
  Send,
  ShieldAlert,
  Award,
  Sparkles,
  Lock,
  Globe2,
  Smile,
  CheckCheck,
  AlertOctagon,
  Volume2,
  Play,
  Pause,
  MapPin,
  Clock,
  ChevronRight,
  Pin,
  VolumeX,
  Star,
  Phone,
  Bike,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Camera,
  ThumbsUp,
  Flame,
  Heart,
} from 'lucide-react';

interface CommunityChatProps {
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onSendMessage: (message: ChatMessage) => void;
  onOpenPayment: (purpose?: PaymentPurpose) => void;
  isDarkMode: boolean;
}

interface CityGroupDef {
  id: string;
  name: string;
  country: string;
  flag: string;
  isGlobal?: boolean;
  memberCount: number;
  description: string;
}

export interface CommunityDriverProfile {
  id: string;
  name: string;
  city: string;
  phone: string;
  whatsapp?: string;
  vehicleType: 'moto_2wheels' | 'tricycle' | 'car_4wheels';
  vehiclePlate?: string;
  rating: number;
  totalRatingsCount: number;
  completedDeliveries: number;
  isCertified: boolean;
  hasPremiumBadge: boolean;
  premiumBadgeUntil?: string;
  isOnline: boolean;
  statusText?: string;
}

const DEFAULT_COMMUNITY_DRIVERS: CommunityDriverProfile[] = [
  {
    id: 'usr_driver_01',
    name: 'Livreur Demo',
    city: 'Cotonou',
    phone: '+229 00 00 00 00',
    whatsapp: '+22900000000',
    vehicleType: 'moto_2wheels',
    vehiclePlate: 'BJ-0000-AF',
    rating: 4.9,
    totalRatingsCount: 142,
    completedDeliveries: 386,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Disponible Akpakpa / Haie Vive / Ganhi',
  },
  {
    id: 'usr_02',
    name: 'Paul A. (Express)',
    city: 'Cotonou',
    phone: '+229 97 45 67 89',
    whatsapp: '+22997456789',
    vehicleType: 'moto_2wheels',
    vehiclePlate: 'BJ-5102-AC',
    rating: 4.8,
    totalRatingsCount: 89,
    completedDeliveries: 210,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Tournée Dantokpa & Sainte Rita',
  },
  {
    id: 'usr_driver_08',
    name: 'Mireille Tossou',
    city: 'Cotonou',
    phone: '+229 96 88 11 22',
    whatsapp: '+22996881122',
    vehicleType: 'moto_2wheels',
    vehiclePlate: 'BJ-7721-BC',
    rating: 5.0,
    totalRatingsCount: 64,
    completedDeliveries: 158,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Plis urgents & Produits sensibles',
  },
  {
    id: 'usr_05',
    name: 'Fabrice Dossou',
    city: 'Abomey-Calavi',
    phone: '+229 96 55 44 33',
    whatsapp: '+22996554433',
    vehicleType: 'tricycle',
    vehiclePlate: 'BJ-9912-TG',
    rating: 4.9,
    totalRatingsCount: 112,
    completedDeliveries: 340,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Grand Volume Kpota & Zogbadjè',
  },
  {
    id: 'usr_06',
    name: 'Alain Houénou',
    city: 'Porto-Novo',
    phone: '+229 95 10 20 30',
    whatsapp: '+22995102030',
    vehicleType: 'moto_2wheels',
    vehiclePlate: 'BJ-3321-PN',
    rating: 4.8,
    totalRatingsCount: 78,
    completedDeliveries: 195,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Ouando & Avakpa disponible',
  },
  {
    id: 'usr_07',
    name: 'Issa Bio',
    city: 'Parakou',
    phone: '+229 97 88 44 11',
    whatsapp: '+22997884411',
    vehicleType: 'car_4wheels',
    vehiclePlate: 'BJ-1144-PK',
    rating: 4.9,
    totalRatingsCount: 95,
    completedDeliveries: 280,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Interurbain Grand Nord & Arzèkè',
  },
  {
    id: 'usr_09',
    name: 'Christian Agossou',
    city: 'Cotonou',
    phone: '+229 94 33 22 11',
    vehicleType: 'moto_2wheels',
    vehiclePlate: 'BJ-6651-AB',
    rating: 4.6,
    totalRatingsCount: 45,
    completedDeliveries: 98,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Sainte Rita & Vèdoko',
  },
  {
    id: 'usr_10',
    name: 'Bio Saliou',
    city: 'Abomey-Calavi',
    phone: '+229 95 66 77 88',
    vehicleType: 'moto_2wheels',
    vehiclePlate: 'BJ-2231-TG',
    rating: 4.7,
    totalRatingsCount: 50,
    completedDeliveries: 110,
    isCertified: true,
    hasPremiumBadge: false,
    isOnline: true,
    statusText: 'Arconville & IITA',
  },
];

const CITY_GROUPS: CityGroupDef[] = [
  {
    id: 'global',
    name: 'Grand Groupe Liencolis (Public)',
    country: 'International',
    flag: '🌍',
    isGlobal: true,
    memberCount: 1420,
    description: 'Ouvert à tous sans abonnement. Pas de liens, pas de numéros ni de contenu inapproprié.',
  },
  // Benin Major Cities
  {
    id: 'cotonou',
    name: 'Cotonou Capitale Économique',
    country: 'Bénin',
    flag: '🇧🇯',
    memberCount: 580,
    description: 'Dantokpa, Akpakpa, Haie Vive, Ganhi, Sainte Rita, Fidjrossè.',
  },
  {
    id: 'abomey-calavi',
    name: 'Abomey-Calavi & Environs',
    country: 'Bénin',
    flag: '🇧🇯',
    memberCount: 420,
    description: 'Kpota, Arconville, Zogbadjè, IITA, Tankpè, Akassato.',
  },
  {
    id: 'porto-novo',
    name: 'Porto-Novo Capitale',
    country: 'Bénin',
    flag: '🇧🇯',
    memberCount: 290,
    description: 'Ouando, Djassin, Avakpa, Tokpota, Carrefour Beau Rivage.',
  },
  {
    id: 'parakou',
    name: 'Parakou & Grand Nord',
    country: 'Bénin',
    flag: '🇧🇯',
    memberCount: 195,
    description: 'Marché Arzèkè, Banikanni, Titirou, Albarika.',
  },
  // Francophone West Africa & International
  {
    id: 'lome',
    name: 'Lomé (Togo)',
    country: 'Togo',
    flag: '🇹🇬',
    memberCount: 140,
    description: 'Grand Marché, Déckon, Bè, Hédzranawoé.',
  },
  {
    id: 'abidjan',
    name: 'Abidjan (Côte d’Ivoire)',
    country: 'Côte d’Ivoire',
    flag: '🇨🇮',
    memberCount: 210,
    description: 'Plateau, Cocody, Yopougon, Treichville.',
  },
  {
    id: 'dakar',
    name: 'Dakar (Sénégal)',
    country: 'Sénégal',
    flag: '🇸🇳',
    memberCount: 115,
    description: 'Plateau, Sandaga, Almadies, Médina.',
  },
  {
    id: 'montreal',
    name: 'Montréal (Canada)',
    country: 'Canada',
    flag: '🇨🇦',
    memberCount: 75,
    description: 'Diaspora & Livraisons express francophones.',
  },
  {
    id: 'paris',
    name: 'Paris & Île-de-France',
    country: 'France',
    flag: '🇫🇷',
    memberCount: 95,
    description: 'Communauté livreurs express et colis Afrique-Europe.',
  },
];

export const CommunityChat: React.FC<CommunityChatProps> = ({
  messages,
  currentUser,
  onSendMessage,
  onOpenPayment,
  isDarkMode,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('global');
  const [inputText, setInputText] = useState('');
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showVipInfoModal, setShowVipInfoModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const [isPinnedDriversExpanded, setIsPinnedDriversExpanded] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<'groups' | 'pinned_drivers'>('groups');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recordIntervalRef = useRef<number | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGroup = CITY_GROUPS.find((g) => g.id === selectedGroupId) || CITY_GROUPS[0];
  const groupMessages = messages.filter((m) => m.groupId === selectedGroupId);

  const isDriver = currentUser?.role === 'driver';
  const isMuted = isDriver && storageService.isDriverMuted(currentUser);

  // Check if current user has active VIP 500F badge
  const currentUserHasVip = Boolean(
    currentUser?.premiumBadgeUntil && new Date(currentUser.premiumBadgeUntil).getTime() > Date.now()
  );

  // Compute drivers for current group with VIP PINNED AT THE TOP
  const cityDrivers = useMemo(() => {
    let list = [...DEFAULT_COMMUNITY_DRIVERS];

    // If current logged in user is a driver, integrate or update their live profile
    if (currentUser && currentUser.role === 'driver') {
      const existingIdx = list.findIndex((d) => d.id === currentUser.id);
      const userDriverObj: CommunityDriverProfile = {
        id: currentUser.id,
        name: currentUser.name,
        city: currentUser.city || 'Cotonou',
        phone: currentUser.phone,
        whatsapp: currentUser.phone.replace(/[^0-9]/g, ''),
        vehicleType: (currentUser.vehicleType as any) || 'moto_2wheels',
        vehiclePlate: currentUser.vehiclePlate || 'BJ-8842-AF',
        rating: currentUser.rating || 5.0,
        totalRatingsCount: currentUser.totalRatingsCount || 1,
        completedDeliveries: currentUser.completedDeliveries || 0,
        isCertified: currentUser.isCertified || true,
        hasPremiumBadge: currentUserHasVip,
        premiumBadgeUntil: currentUser.premiumBadgeUntil,
        isOnline: true,
        statusText: currentUserHasVip ? '⭐ VIP Épinglé en tête • Disponible' : 'En ligne & Prêt',
      };

      if (existingIdx >= 0) {
        list[existingIdx] = userDriverObj;
      } else {
        list.unshift(userDriverObj);
      }
    }

    // Filter by city unless in global group
    if (!selectedGroup.isGlobal) {
      const cityName = selectedGroup.name.toLowerCase();
      list = list.filter(
        (d) =>
          d.city.toLowerCase().includes(selectedGroup.id) ||
          cityName.includes(d.city.toLowerCase()) ||
          d.hasPremiumBadge // Always show top VIPs in discovery
      );
    }

    // Sort: Pinned VIP (hasPremiumBadge === true) FIRST, then by rating
    return list.sort((a, b) => {
      if (a.hasPremiumBadge === b.hasPremiumBadge) {
        return b.rating - a.rating;
      }
      return a.hasPremiumBadge ? -1 : 1;
    });
  }, [currentUser, currentUserHasVip, selectedGroup]);

  // List of only VIP pinned drivers
  const pinnedVipDrivers = useMemo(() => {
    return cityDrivers.filter((d) => d.hasPremiumBadge);
  }, [cityDrivers]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      recordIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecordingVoice]);

  // Moderation check for Grand Groupe (No links, No phone numbers, No NSFW)
  const validateGrandGroupContent = (text: string): { valid: boolean; reason?: string } => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|\.com|\.org|\.bj|\.net)/i;
    const phonePattern = /(\+?[0-9]{2,4}[\s.-]?[0-9]{2,4}[\s.-]?[0-9]{2,4}[\s.-]?[0-9]{2,4}|[0-9]{8,14})/;
    const nsfwKeywords = ['sexe', 'porno', 'viagra', 'escort', 'nude', 'cul', 'baiser', 'baise'];

    if (urlPattern.test(text)) {
      return { valid: false, reason: "Partage de liens Web strictement interdit dans le Grand Groupe (risque d'expulsion)." };
    }
    if (phonePattern.test(text)) {
      return { valid: false, reason: "Partage de numéros de téléphone interdit dans le Grand Groupe. Utilisez les Groupes de Ville dédiés." };
    }
    for (const kw of nsfwKeywords) {
      if (text.toLowerCase().includes(kw)) {
        return { valid: false, reason: "Message à caractère inapproprié détecté. Risque d'expulsion immédiate." };
      }
    }
    return { valid: true };
  };

  const handleSend = () => {
    if (isMuted) {
      alert(`🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est de ${currentUser?.driverWallet?.balance ?? 0} FCFA (inférieur à 50 FCFA).\n\nVeuillez recharger votre portefeuille (dès 250 FCFA) pour débloquer l'envoi de messages et participer aux discussions.`);
      onOpenPayment('wallet_deposit_1200');
      return;
    }
    if (!inputText.trim() && !selectedMediaUrl) return;

    // Check Grand Groupe Moderation
    if (selectedGroup.isGlobal) {
      const check = validateGrandGroupContent(inputText);
      if (!check.valid) {
        setModerationWarning(check.reason || 'Message non autorisé');
        return;
      }
    }

    setModerationWarning(null);

    const now = new Date();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      groupId: selectedGroupId,
      senderId: currentUser?.id || 'usr_driver_01',
      senderName: currentUser?.name || 'Germain Mensah',
      senderRole: currentUser?.role || 'driver',
      senderCity: currentUser?.city || 'Cotonou',
      isDriverCertified: currentUser?.isCertified ?? true,
      hasPremiumBadge: currentUserHasVip,
      content: inputText.trim(),
      mediaUrl: selectedMediaUrl || undefined,
      mediaType: selectedMediaUrl ? 'image' : undefined,
      timestamp: now.toISOString(),
    };

    onSendMessage(newMsg);
    setInputText('');
    setSelectedMediaUrl(null);
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    chatInputRef.current?.focus();
  };

  const handleSendSticker = (sticker: DriverSticker) => {
    if (isMuted) {
      alert("🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est inférieur à 50 FCFA. Veuillez recharger votre portefeuille pour envoyer des stickers.");
      onOpenPayment('wallet_deposit_1200');
      return;
    }
    setModerationWarning(null);
    const now = new Date();
    const newMsg: ChatMessage = {
      id: `msg_stk_${Date.now()}`,
      groupId: selectedGroupId,
      senderId: currentUser?.id || 'usr_driver_01',
      senderName: currentUser?.name || 'Germain Mensah',
      senderRole: currentUser?.role || 'driver',
      senderCity: currentUser?.city || 'Cotonou',
      isDriverCertified: currentUser?.isCertified ?? true,
      hasPremiumBadge: currentUserHasVip,
      content: `${sticker.emoji} [STICKER] ${sticker.title} - ${sticker.subtitle}`,
      stickerId: sticker.id,
      stickerEmoji: sticker.emoji,
      stickerTitle: sticker.title,
      stickerGradient: sticker.gradient,
      timestamp: now.toISOString(),
    };

    onSendMessage(newMsg);
    setShowEmojiPicker(false);
  };

  const handleSendVoiceMessage = () => {
    if (isMuted) {
      alert("🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est inférieur à 50 FCFA. Veuillez recharger votre portefeuille pour enregistrer des messages vocaux.");
      onOpenPayment('wallet_deposit_1200');
      setIsRecordingVoice(false);
      return;
    }

    if (selectedGroup.isGlobal) {
      alert("Les messages vocaux sont réservés aux groupes de ville avec abonnement.");
      setIsRecordingVoice(false);
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg_voice_${Date.now()}`,
      groupId: selectedGroupId,
      senderId: currentUser?.id || 'usr_driver_01',
      senderName: currentUser?.name || 'Germain Mensah',
      senderRole: currentUser?.role || 'driver',
      senderCity: currentUser?.city || 'Cotonou',
      isDriverCertified: true,
      hasPremiumBadge: currentUserHasVip,
      content: '🎙️ Message vocal',
      audioUrl: 'mock_voice_audio',
      audioDurationSeconds: Math.max(2, recordingSeconds),
      timestamp: new Date().toISOString(),
    };

    onSendMessage(newMsg);
    setIsRecordingVoice(false);
  };

  // AI Translation Handler
  const handleTranslateMessage = async (msgId: string, text: string, targetLang = 'fr') => {
    setTranslatingMessageId(msgId);
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await res.json();
      if (data.translatedText) {
        const targetMsg = groupMessages.find((m) => m.id === msgId);
        if (targetMsg) {
          targetMsg.translatedText = {
            ...(targetMsg.translatedText || {}),
            [targetLang]: data.translatedText,
          };
        }
      }
    } catch (e) {
      console.warn('Translation error:', e);
    } finally {
      setTranslatingMessageId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* Left Sidebar: City & Global Groups / Pinned VIP Drivers (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950/70 flex flex-col">
          {/* Header with VIP Badge Trigger */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Salons & Livreurs</span>
              </h2>
              <p className="text-[11px] text-slate-400">Grand Groupe & Villes Bénin</p>
            </div>

            {/* Stylized Golden Star Badge Button */}
            <button
              onClick={() => onOpenPayment('premium_badge_week')}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all ring-1 ring-amber-200"
              title="Activer l'abonnement hebdomadaire de 500 FCFA pour épingler votre profil en tête de liste avec l'étoile dorée"
              id="btn-vip-badge-header"
            >
              <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Badge 500F/sem</span>
            </button>
          </div>

          {/* Sub-tabs: Salons vs Livreurs VIP Épinglés */}
          <div className="flex border-b border-slate-800 bg-slate-900/90 text-xs">
            <button
              onClick={() => setSidebarTab('groups')}
              className={`flex-1 py-2.5 px-3 font-bold flex items-center justify-center gap-1.5 transition-colors ${
                sidebarTab === 'groups'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Salons ({CITY_GROUPS.length})</span>
            </button>
            <button
              onClick={() => setSidebarTab('pinned_drivers')}
              className={`flex-1 py-2.5 px-3 font-bold flex items-center justify-center gap-1.5 transition-colors ${
                sidebarTab === 'pinned_drivers'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>VIP Épinglés ({pinnedVipDrivers.length})</span>
            </button>
          </div>

          {/* Tab 1: Groups List */}
          {sidebarTab === 'groups' && (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
              {/* Pricing Info Chip */}
              <div className="p-3 bg-gradient-to-r from-blue-950/60 to-emerald-950/60 border-b border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="truncate">Abonnements villes : <strong>1200F / 1500F / 2000F</strong></span>
                <button
                  onClick={() => onOpenPayment('subscription_2wheels')}
                  className="text-amber-400 font-bold hover:underline shrink-0 ml-1"
                >
                  Tarifs
                </button>
              </div>

              {CITY_GROUPS.map((group) => {
                const isSelected = group.id === selectedGroupId;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setModerationWarning(null);
                    }}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-blue-600/20 border-l-4 border-amber-400' : 'hover:bg-slate-850'
                    }`}
                    id={`chat-group-${group.id}`}
                  >
                    <div className="text-2xl shrink-0 p-1 bg-slate-800 rounded-xl">{group.flag}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-100'}`}>
                          {group.name}
                        </span>
                        {group.isGlobal ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            GRATUIT
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">{group.memberCount} mb</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{group.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Pinned VIP Drivers List */}
          {sidebarTab === 'pinned_drivers' && (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin p-2 space-y-2">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Livreurs VIP Épinglés :</strong> Profils prioritaires ayant activé l'abonnement hebdomadaire de <strong>500 FCFA</strong>.
                </div>
              </div>

              {pinnedVipDrivers.map((driver, idx) => (
                <div
                  key={driver.id}
                  className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/40 hover:border-amber-400 shadow-md space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow ring-2 ring-amber-400/80">
                          {driver.name[0]}
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black shadow">
                          ★
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{driver.name}</span>
                          <span className="text-emerald-400 text-xs font-bold" title="Livreur Certifié">✓</span>
                        </div>
                        <p className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                          <Pin className="w-3 h-3 text-amber-400" />
                          <span>#{idx + 1} Épinglé en Tête</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300">
                      ⭐ VIP 500F
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" /> {driver.rating} ({driver.completedDeliveries} courses)
                    </span>
                    <span className="text-slate-400">📍 {driver.city}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {isMuted ? (
                      <button
                        type="button"
                        onClick={() => {
                          alert("🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est inférieur à 50 FCFA. Veuillez recharger votre portefeuille pour contacter les chauffeurs.");
                          onOpenPayment('wallet_deposit_1200');
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-[10px] text-center flex items-center justify-center gap-1 shadow"
                      >
                        <Lock className="w-3 h-3 text-red-400" />
                        <span>Sourdine - Recharger pour contacter</span>
                      </button>
                    ) : (
                      <>
                        <a
                          href={`tel:${driver.phone}`}
                          className="flex-1 py-1 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold text-center flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Appeler</span>
                        </a>
                        {driver.whatsapp && (
                          <a
                            href={`https://wa.me/${driver.whatsapp}?text=Bonjour%20${encodeURIComponent(driver.name)},%20je%20vous%20contacte%20via%20Liencolis%20pour%20une%20livraison.`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold text-center"
                          >
                            WhatsApp
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Call to action for drivers */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-center space-y-2">
                <p className="text-xs font-black text-amber-300">Vous êtes livreur ?</p>
                <p className="text-[11px] text-slate-300">
                  Activez votre badge VIP pour <strong>500 FCFA/semaine</strong> et restez épinglé en tête de liste !
                </p>
                <button
                  onClick={() => onOpenPayment('premium_badge_week')}
                  className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs shadow hover:scale-102 transition-transform"
                >
                  ⭐ Activer mon Badge VIP (500F)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Messenger-style Chat Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 justify-between relative">
          
          {/* SOURDINE ACCOUNT INACTIVE WARNING BANNER (< 50 FCFA) */}
          {isMuted && (
            <div className="bg-gradient-to-r from-red-950/95 via-slate-900 to-red-950/95 border-b border-red-600/70 p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-100 shadow-xl shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-900/80 border border-red-500/50 text-red-400 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-red-200 flex items-center gap-2">
                    <span>COMPTE EN SOURDINE (INACTIF - SOLDE &lt; 50 FCFA)</span>
                  </h4>
                  <p className="text-[11px] text-red-300">
                    Votre solde actuel est de <strong>{currentUser?.driverWallet?.balance ?? 0} FCFA</strong>. L'envoi de messages, vocaux, stickers et la participation aux discussions sont inactifs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPayment('wallet_deposit_1200')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Recharger (Dès 250 F)</span>
              </button>
            </div>
          )}

          {/* Active Group Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl p-1 bg-slate-800/80 rounded-2xl">{selectedGroup.flag}</div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{selectedGroup.name}</span>
                  {selectedGroup.isGlobal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Modération Automatique 🛡️
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{selectedGroup.description}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions in Header: VIP Badge Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVipInfoModal(true)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs"
                title="Informations sur le badge VIP et le profil épinglé"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenPayment('premium_badge_week')}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border border-amber-300 shadow-md shadow-amber-500/20 flex items-center gap-1.5 hover:scale-105 transition-all"
                title="Abonnement hebdomadaire 500 FCFA : Profil épinglé en haut de la liste avec étoile dorée"
                id="btn-open-payment-vip"
              >
                <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span className="hidden sm:inline">Badge VIP (500F/sem)</span>
                <span className="sm:hidden">VIP 500F</span>
              </button>
            </div>
          </div>

          {/* TOP PINNED DRIVERS ROSTER (500 FCFA/week Subscription) */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border-b border-amber-500/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Livreurs VIP Épinglés en Tête (Abonnement 500 FCFA/sem)</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {pinnedVipDrivers.length} en tête
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPinnedDriversExpanded(!isPinnedDriversExpanded)}
                  className="text-slate-400 hover:text-amber-300 text-xs flex items-center gap-1"
                >
                  <span>{isPinnedDriversExpanded ? 'Réduire' : 'Afficher'}</span>
                  {isPinnedDriversExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Pinned Drivers Cards Tray */}
            {isPinnedDriversExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {pinnedVipDrivers.slice(0, 3).map((driver, idx) => {
                  const isCurrentLoggedUser = currentUser?.id === driver.id;
                  return (
                    <div
                      key={driver.id}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isCurrentLoggedUser
                          ? 'bg-blue-950/70 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                          : 'bg-slate-950/80 border-amber-500/40 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow ring-1 ring-amber-300">
                              {driver.name[0]}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[8px] font-black shadow">
                              ★
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-black text-white truncate">{driver.name}</p>
                              <span className="text-emerald-400 text-[11px] font-bold">✓</span>
                            </div>
                            <p className="text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5 text-amber-400" />
                              <span>Épinglé #{idx + 1}</span>
                            </p>
                          </div>
                        </div>

                        {/* Stylized Golden Star VIP Badge */}
                        <div
                          className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300 flex items-center gap-0.5 shrink-0 cursor-help"
                          title="Livreur VIP vérifié - 500 FCFA/semaine"
                        >
                          <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                          <span>VIP 500F</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" /> {driver.rating} ({driver.completedDeliveries})
                        </span>
                        <span className="text-slate-400 truncate">📍 {driver.city}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        {isMuted ? (
                          <button
                            type="button"
                            onClick={() => {
                              alert("🔒 Action bloquée : Votre compte est en sourdine car votre solde prépayé est inférieur à 50 FCFA. Veuillez recharger votre portefeuille pour contacter les chauffeurs.");
                              onOpenPayment('wallet_deposit_1200');
                            }}
                            className="w-full py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-[10px] text-center flex items-center justify-center gap-1 shadow"
                          >
                            <Lock className="w-3 h-3 text-red-400" />
                            <span>Sourdine - Recharger pour contacter</span>
                          </button>
                        ) : (
                          <>
                            <a
                              href={`tel:${driver.phone}`}
                              className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Appel Direct</span>
                            </a>
                            <button
                              onClick={() => {
                                setInputText(`@${driver.name} Bonjour, avez-vous de la disponibilité pour une course immédiate ? `);
                              }}
                              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold"
                              title="Mentionner dans le chat"
                            >
                              Mentionner
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* If currentUser is NOT VIP, show call to action slot */}
                {!currentUserHasVip && (
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-dashed border-amber-500/50 flex flex-col justify-between text-center space-y-1.5">
                    <div>
                      <p className="text-xs font-black text-amber-300 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Votre Place VIP Épinglée</span>
                      </p>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Restez en 1ère position dans ce salon pour <strong>500 FCFA/sem</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenPayment('premium_badge_week')}
                      className="py-1 px-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-[11px] shadow hover:scale-102 transition-all"
                    >
                      ⭐ Activer (500 FCFA)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grand Group Moderation Warning Banner */}
          {selectedGroup.isGlobal && (
            <div className="p-2.5 bg-amber-950/40 border-b border-amber-800/40 text-amber-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Règlement Grand Groupe : Pas de liens, pas de numéros de tél ni contenus sexuels (Risque d'expulsion).</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[460px] bg-slate-950/40 scrollbar-thin">
            {groupMessages.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Aucun message pour le moment dans ce salon.</p>
                <p className="text-[11px] text-slate-500">Soyez le premier à envoyer un message ou une information trafic !</p>
              </div>
            ) : (
              groupMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id || msg.senderId === 'usr_driver_01';
                const formattedTime = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const formattedDate = new Date(msg.timestamp).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                });
                const reactions = messageReactions[msg.id] || {};

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in`}
                  >
                    {/* User Avatar with Profile Photo */}
                    <div className="shrink-0 relative mt-0.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow overflow-hidden ${
                        msg.hasPremiumBadge
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 ring-2 ring-amber-400'
                          : isMe
                          ? 'bg-blue-600 text-white ring-1 ring-blue-400/60'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}>
                        {msg.senderName.slice(0, 2).toUpperCase()}
                      </div>
                      {msg.hasPremiumBadge && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[8px] font-black shadow">
                          ★
                        </span>
                      )}
                    </div>

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-md space-y-1`}>
                      {/* Sender Identity & Metadata with STYLIZED GOLDEN STAR BADGE */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 px-1">
                        <span className={`font-bold ${msg.hasPremiumBadge ? 'text-amber-300' : 'text-slate-300'}`}>
                          {msg.senderName}
                        </span>

                        {msg.senderCity && (
                          <span className="text-slate-500">📍 {msg.senderCity}</span>
                        )}

                        {msg.isDriverCertified && (
                          <span className="text-emerald-400 font-bold" title="Livreur Certifié Officiel Bénin">✓ Certifié</span>
                        )}

                        {/* STYLIZED GOLDEN STAR BADGE (500 FCFA/semaine) */}
                        {msg.hasPremiumBadge && (
                          <div
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-300 tracking-tight cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setShowVipInfoModal(true)}
                            title="⭐ Livreur VIP : Profil Épinglé en Tête (Abonnement Hebdomadaire 500 FCFA actif)"
                          >
                            <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                            <span>VIP 500F</span>
                          </div>
                        )}

                        <span className="text-slate-500">• {formattedDate} {formattedTime}</span>
                      </div>

                      {/* Message Bubble (Messenger Style) */}
                      <div
                        className={`rounded-2xl p-3.5 shadow-md text-xs relative ${
                          isMe
                            ? msg.hasPremiumBadge
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 border border-amber-400/50 text-white rounded-tr-none shadow-amber-500/10'
                              : 'bg-blue-600 text-white rounded-tr-none'
                            : msg.hasPremiumBadge
                            ? 'bg-slate-800 border-2 border-amber-500/60 text-slate-100 rounded-tl-none shadow-md shadow-amber-500/10'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none'
                        }`}
                      >
                        {/* Audio Voice Player */}
                        {msg.audioUrl ? (
                          <div className="flex items-center gap-3 py-1">
                            <button
                              onClick={() => {
                                if (playingAudioId === msg.id) {
                                  setPlayingAudioId(null);
                                } else {
                                  setPlayingAudioId(msg.id);
                                  setTimeout(() => setPlayingAudioId(null), (msg.audioDurationSeconds || 3) * 1000);
                                }
                              }}
                              className={`p-2 rounded-full shadow ${
                                playingAudioId === msg.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-white'
                              }`}
                            >
                              {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-[120px]">
                              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full bg-amber-400 transition-all ${
                                    playingAudioId === msg.id ? 'w-full duration-3000' : 'w-1/3'
                                  }`}
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-300 font-mono mt-1 block">
                                Message Vocal ({msg.audioDurationSeconds || 3}s)
                              </span>
                            </div>
                          </div>
                        ) : msg.stickerId || msg.content.includes('[STICKER]') ? (
                          /* Graphical Driver Sticker Card */
                          <div className="py-1 my-0.5">
                            <div className={`rounded-2xl p-3 bg-gradient-to-br ${msg.stickerGradient || 'from-indigo-600 to-purple-700'} text-white border border-white/20 shadow-lg relative overflow-hidden group`}>
                              <div className="flex items-center gap-3">
                                <span className="text-3xl sm:text-4xl drop-shadow filter">{msg.stickerEmoji || '✨'}</span>
                                <div>
                                  <div className="text-xs font-black tracking-wide drop-shadow uppercase text-white">
                                    {msg.stickerTitle || (msg.content.includes('[STICKER]') ? msg.content.split('[STICKER]')[1].split('-')[0].trim() : msg.content)}
                                  </div>
                                  <div className="text-[10px] text-white/85 font-medium mt-0.5">
                                    {msg.content.includes(' - ') ? msg.content.split(' - ')[1] : 'Sticker officiel Liencolis'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap text-[13px]">{msg.content}</p>
                        )}

                        {/* Photo / Media Attachment */}
                        {msg.mediaUrl && (
                          <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                            <img src={msg.mediaUrl} alt="Attachement" className="max-h-56 w-full object-cover object-center" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        {/* Translated Version View */}
                        {msg.translatedText && (
                          <div className="mt-2 pt-2 border-t border-slate-700/60 text-[11px] text-amber-200">
                            {Object.entries(msg.translatedText).map(([lang, tr]) => (
                              <p key={lang} className="italic">
                                🌐 <strong className="uppercase">{lang} :</strong> {tr}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Quick Action Footer inside Bubble */}
                        <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between gap-2">
                          {/* Quick Emoji Reactions */}
                          <div className="flex items-center gap-1">
                            {['👍', '🏍️', '🚨', '❤️'].map((emoji) => {
                              const count = reactions[emoji] || 0;
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setMessageReactions((prev) => {
                                      const current = prev[msg.id] || {};
                                      return {
                                        ...prev,
                                        [msg.id]: {
                                          ...current,
                                          [emoji]: (current[emoji] || 0) + 1,
                                        },
                                      };
                                    });
                                  }}
                                  className={`px-1.5 py-0.5 rounded-lg text-[10px] flex items-center gap-0.5 transition-all ${
                                    count > 0 ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40' : 'hover:bg-slate-700/60 text-slate-400'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  {count > 0 && <span>{count}</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* AI Translation quick buttons */}
                          <div className="flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleTranslateMessage(msg.id, msg.content, 'fon')}
                              className="text-[9px] text-slate-300 hover:text-amber-300 bg-slate-900/60 px-1.5 py-0.5 rounded font-medium"
                              title="Traduire en Fon béninois"
                            >
                              Fon
                            </button>
                            <button
                              onClick={() => handleTranslateMessage(msg.id, msg.content, 'en')}
                              className="text-[9px] text-slate-300 hover:text-amber-300 bg-slate-900/60 px-1.5 py-0.5 rounded font-medium"
                              title="Translate to English"
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Moderation Error Warning Box */}
          {moderationWarning && (
            <div className="p-3 bg-red-950/80 border-t border-red-800 text-red-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                <span>{moderationWarning}</span>
              </div>
              <button onClick={() => setModerationWarning(null)} className="text-red-300 hover:text-white font-bold">✕</button>
            </div>
          )}

          {/* Selected Media Preview before send */}
          {selectedMediaUrl && (
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={selectedMediaUrl} alt="Aperçu" className="w-12 h-12 object-cover object-center rounded-lg border border-slate-700" referrerPolicy="no-referrer" />
                <span className="text-xs text-emerald-400 font-bold">Photo prête à être partagée</span>
              </div>
              <button
                onClick={() => setSelectedMediaUrl(null)}
                className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Supprimer
              </button>
            </div>
          )}

          {/* Input Messenger Bar with Stickers, Smalleys & Prominent Send Button */}
          <div className="bg-slate-950 border-t border-slate-800 relative">
            {/* If muted */}
            {isMuted ? (
              <div className="p-3.5 bg-gradient-to-r from-red-950/90 via-slate-900 to-red-950/90 border-t border-red-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 m-2 rounded-2xl shadow-inner">
                <div className="flex items-center gap-2.5 text-red-200 text-xs font-bold">
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Discussion inactive : Votre compte est en sourdine (&lt; 50 FCFA).</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPayment('wallet_deposit_1200')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow flex items-center justify-center gap-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Recharger mon portefeuille (dès 250 F)</span>
                </button>
              </div>
            ) : isRecordingVoice ? (
              <div className="p-3 flex items-center justify-between bg-red-950/60 border-t border-red-700/60 rounded-2xl m-2">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-xs font-bold text-red-200">
                    Enregistrement vocal en cours ({recordingSeconds}s)...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecordingVoice(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendVoiceMessage}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow"
                  >
                    Envoyer Vocal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Fast Emoji & Sticker Access Bar (Above input) */}
                <div className="px-3 pt-2 pb-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                  {/* Button to open Emoji & Stickers picker */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        showEmojiPicker
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-slate-800 text-amber-300 hover:text-amber-200 hover:bg-slate-750 border border-slate-700'
                      }`}
                      title="Ouvrir le panneau de smileys et stickers chauffeur"
                      id="btn-open-stickers-drawer"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>Smileys & Stickers</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>

                  {/* 1-Tap Quick Emoticons Strip */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                    {['😀', '👍', '🛵', '📦', '🚨', '❤️', '🔥', '🇧🇯', '💰', '⛽', '🌧️', '⭐'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectEmoji(emoji)}
                        className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-sm hover:scale-125 active:scale-95 transition-transform shrink-0"
                        title={`Insérer ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Input Row */}
                <div className="p-3 relative flex items-center gap-2">
                  {/* Emoji & Sticker Drawer Popover */}
                  <EmojiStickerPicker
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onSelectEmoji={handleSelectEmoji}
                    onSelectSticker={handleSendSticker}
                    onSelectPhrase={(phrase) => {
                      setInputText(phrase);
                      chatInputRef.current?.focus();
                    }}
                  />

                  {/* Media, Camera and Voice buttons (in City Groups) */}
                  {!selectedGroup.isGlobal ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
                        title="Enregistrer un message vocal"
                        id="btn-voice-recorder"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCameraModal(true)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                        title="Prendre une photo avec l'appareil photo"
                        id="btn-camera-chat"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Collez l’URL d’une photo de matériel ou de colis :');
                          if (url) setSelectedMediaUrl(url);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors hidden sm:inline-flex"
                        title="Partager un lien d'image"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-1 text-[10px] text-slate-500 flex items-center gap-1 font-mono shrink-0" title="Texte uniquement dans le grand groupe">
                      <VolumeX className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Text Input Container with embedded Smiley Trigger */}
                  <div className="relative flex-1 min-w-0">
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        setModerationWarning(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        selectedGroup.isGlobal
                          ? 'Écrire un message public (pas de lien, ni numéro)...'
                          : `Écrire dans le salon ${selectedGroup.name}...`
                      }
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                      id="chat-text-input"
                    />

                    {/* Smiley Icon inside input */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 transition-colors"
                      title="Ajouter smileys ou stickers"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  {/* HIGH-VISIBILITY ALWAYS-RENDERED SEND BUTTON */}
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() && !selectedMediaUrl}
                    className={`shrink-0 px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all min-h-[44px] ${
                      inputText.trim() || selectedMediaUrl
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black shadow-emerald-500/25 active:scale-95 cursor-pointer ring-2 ring-emerald-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-70 hover:opacity-90'
                    }`}
                    title={
                      inputText.trim() || selectedMediaUrl
                        ? 'Envoyer le message (ou touche Entrée)'
                        : 'Écrivez un message ou choisissez un sticker pour envoyer'
                    }
                    id="chat-send-btn"
                  >
                    <Send className={`w-4 h-4 shrink-0 ${inputText.trim() || selectedMediaUrl ? 'fill-slate-950 text-slate-950' : 'text-slate-400'}`} />
                    <span className="font-black hidden sm:inline">
                      Envoyer
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* VIP Badge Info Modal */}
      {showVipInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black">
                  <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Badge VIP Premium (500 FCFA/semaine)</h3>
                  <p className="text-[11px] text-amber-400">Épinglage en tête de liste & Étoile dorée</p>
                </div>
              </div>
              <button onClick={() => setShowVipInfoModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Pin className="w-4 h-4 text-amber-400" />
                  <span>1. Profil Épinglé en Tête de Salon</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Votre profil reste affiché en première position dans le bandeau VIP des salons de votre ville, vous garantissant d'être contacté en priorité par les clients et e-commerçants.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>2. Étoile Dorée Stylisée</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Tous vos messages dans les discussions de groupe arborent le badge doré <strong>⭐ VIP 500F</strong> pour inspirer une confiance immédiate.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>3. Multipliez vos Livraisons par 3</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Bouton d'appel direct WhatsApp et téléphone cliquable immédiatement pour les courses express et relais de colis.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setShowVipInfoModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowVipInfoModal(false);
                  onOpenPayment('premium_badge_week');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs shadow-lg hover:scale-102 transition-transform"
              >
                Activer pour 500 FCFA ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Photo Capture Modal for Group Chat */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="Photo pour le Salon de Discussion"
        description="Prenez une photo en direct de l'état de la route, d'un colis ou du matériel"
        onCapture={(photoUrl) => {
          setSelectedMediaUrl(photoUrl);
          setShowCameraModal(false);
        }}
      />
    </div>
  );
};
