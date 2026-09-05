import React, { useState, useMemo } from 'react';
import {
  Smile,
  Sparkles,
  Search,
  Zap,
  Check,
  Bike,
  Package,
  Shield,
  Clock,
  ThumbsUp,
  Flame,
  Heart,
  X,
  AlertTriangle,
  Send,
} from 'lucide-react';

export interface DriverSticker {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  category: 'delivery' | 'status' | 'alert' | 'community';
  gradient: string;
  badgeColor: string;
  borderColor: string;
}

export const DRIVER_STICKERS: DriverSticker[] = [
  {
    id: 'stk_en_route',
    emoji: '🛵💨',
    title: "J'ARRIVE !",
    subtitle: 'En route vers le client',
    category: 'delivery',
    gradient: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-400 text-blue-950',
    borderColor: 'border-blue-400/50',
  },
  {
    id: 'stk_colis_recup',
    emoji: '📦✨',
    title: 'COLIS RÉCUPÉRÉ',
    subtitle: 'Prêt pour livraison',
    category: 'delivery',
    gradient: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-400 text-emerald-950',
    borderColor: 'border-emerald-400/50',
  },
  {
    id: 'stk_livraison_ok',
    emoji: '✅🏆',
    title: 'LIVRÉ AVEC SUCCÈS',
    subtitle: 'Course validée par PIN',
    category: 'delivery',
    gradient: 'from-green-600 to-emerald-800',
    badgeColor: 'bg-green-300 text-green-950',
    borderColor: 'border-green-400/50',
  },
  {
    id: 'stk_bouchon',
    emoji: '🚦🛑',
    title: 'GROS BOUCHON',
    subtitle: 'Ralentissement carrefour',
    category: 'alert',
    gradient: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-400 text-amber-950',
    borderColor: 'border-amber-400/50',
  },
  {
    id: 'stk_pluie',
    emoji: '🌧️⚡',
    title: 'ALERTE PLUIE',
    subtitle: 'Colis mis à l’abri',
    category: 'alert',
    gradient: 'from-sky-700 to-blue-900',
    badgeColor: 'bg-sky-300 text-sky-950',
    borderColor: 'border-sky-400/50',
  },
  {
    id: 'stk_essence',
    emoji: '⛽🏍️',
    title: 'PAUSE ESSENCE',
    subtitle: 'Plein en cours',
    category: 'status',
    gradient: 'from-purple-600 to-indigo-800',
    badgeColor: 'bg-purple-300 text-purple-950',
    borderColor: 'border-purple-400/50',
  },
  {
    id: 'stk_momo_ok',
    emoji: '💰📲',
    title: 'PAIEMENT REÇU',
    subtitle: 'MoMo / Flooz validé',
    category: 'status',
    gradient: 'from-yellow-500 to-amber-700',
    badgeColor: 'bg-yellow-300 text-yellow-950',
    borderColor: 'border-yellow-400/50',
  },
  {
    id: 'stk_vip_star',
    emoji: '⭐👑',
    title: 'LIVREUR VIP 5★',
    subtitle: 'Service Top Qualité',
    category: 'community',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    badgeColor: 'bg-slate-950 text-amber-300',
    borderColor: 'border-yellow-300',
  },
  {
    id: 'stk_solidarite',
    emoji: '🤝🛡️',
    title: 'SOLIDARITÉ 100%',
    subtitle: 'Entraide chauffeurs',
    category: 'community',
    gradient: 'from-rose-600 to-pink-800',
    badgeColor: 'bg-rose-300 text-rose-950',
    borderColor: 'border-rose-400/50',
  },
  {
    id: 'stk_benin_driver',
    emoji: '🇧🇯❤️',
    title: 'LIVREUR DU BÉNIN',
    subtitle: 'Fierté nationale',
    category: 'community',
    gradient: 'from-emerald-600 via-amber-600 to-red-600',
    badgeColor: 'bg-slate-950 text-emerald-300',
    borderColor: 'border-emerald-400/50',
  },
  {
    id: 'stk_client_absent',
    emoji: '📵🚪',
    title: 'CLIENT INJOIGNABLE',
    subtitle: 'En attente devant adresse',
    category: 'alert',
    gradient: 'from-slate-700 to-slate-900',
    badgeColor: 'bg-slate-300 text-slate-950',
    borderColor: 'border-slate-500/50',
  },
  {
    id: 'stk_relais_dispo',
    emoji: '🔄🛵',
    title: 'RELAIS COURSE',
    subtitle: 'Prêt à prendre le relais',
    category: 'delivery',
    gradient: 'from-cyan-600 to-blue-800',
    badgeColor: 'bg-cyan-300 text-cyan-950',
    borderColor: 'border-cyan-400/50',
  },
];

export const QUICK_DRIVER_PHRASES = [
  { text: "🛵 Je suis en route vers le client !", label: 'En route' },
  { text: "📦 Colis récupéré au point de retrait avec succès.", label: 'Colis pris' },
  { text: "✅ Livraison terminée et code PIN validé !", label: 'Livraison OK' },
  { text: "🚦 Gros ralentissement sur l'itinéraire, j'arrive !", label: 'Bouchon' },
  { text: "📞 Client injoignable, je patiente sur place.", label: 'Injoignable' },
  { text: "💰 Paiement reçu par MoMo, merci !", label: 'MoMo OK' },
  { text: "🌧️ Forte pluie en cours, colis protégé sous abri.", label: 'Pluie' },
  { text: "⛽ Arrêt rapide à la station essence (5 min).", label: 'Essence' },
  { text: "🤝 Disponible pour relayer une course urgente !", label: 'Relais dispo' },
];

export const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Populaires',
    icon: '🔥',
    emojis: [
      '😀', '😂', '🤣', '😍', '😎', '🥳', '🤔', '😴',
      '😇', '🤩', '😜', '🤝', '👍', '👏', '🙌', '🔥',
      '❤️', '💯', '🛵', '🏍️', '📦', '⚡', '🛡️', '🇧🇯',
      '💰', '📍', '🚨', '✅', '⛽', '🚦', '🌧️', '⭐'
    ],
  },
  {
    id: 'smileys',
    name: 'Visages & Smalley',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '🥲', '🥹', '☺️', '😊', '😇', '🙂', '🙃', '😉',
      '😌', '😍', '🥰', '😘', '😗', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🫣', '🤭', '🤫', '🤔',
      '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏',
      '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴',
      '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶',
      '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',
      '🧐', '😕', '🫤', '😟', '🙁', '😮', '😯', '😲',
      '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢',
      '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
      '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
      '💩', '🤡', '👻', '🙈', '🙉', '🙊'
    ],
  },
  {
    id: 'gestures',
    name: 'Mains & Gestes',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️',
      '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲',
      '🫳', '🫴', '🫷', '🫸', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️',
      '💪', '🦾', '🤳', '💅'
    ],
  },
  {
    id: 'transport',
    name: 'Transport & Route',
    icon: '🛵',
    emojis: [
      '🛵', '🏍️', '🚲', '🛴', '🚗', '🚘', '🚕', '🚙',
      '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻',
      '🚚', '🚛', '🚜', '⛽', '🚦', '🚥', '🛑', '🚧',
      '🚨', '🗺️', '📍', '🧭', '🏁', '🚩', '🛣️', '🛤️',
      '🛞', '🅿️', '🚏', '🔧', '🔨', '🔦'
    ],
  },
  {
    id: 'delivery',
    name: 'Colis & Argent',
    icon: '📦',
    emojis: [
      '📦', '🎁', '🏷️', '🛍️', '🛒', '💰', '💵', '💴',
      '💶', '💷', '💳', '💎', '⚖️', '🧾', '📊', '📈',
      '📉', '💼', '📁', '📂', '🗂️', '📅', '📆', '📱',
      '📲', '📞', '🔋', '🔌', '💻', '🖥️', '✉️', '📩',
      '📨', '📧', '📬', '📮'
    ],
  },
  {
    id: 'symbols',
    name: 'Symboles & Météo',
    icon: '⚡',
    emojis: [
      '⚡', '💥', '✨', '⭐', '🌟', '💫', '🔥', '❤️',
      '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
      '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
      '🛡️', '🔒', '🔓', '🔑', '🗝️', '🎯', '🏆', '🥇',
      '🥈', '🥉', '👑', '📢', '📣', '🔔', '🔕', '⚠️',
      '🛑', '⛔', '🚫', '💯', '✅', '❌', '☀️', '🌧️',
      '⛈️', '🌩️', '⛅', '🌤️', '🌙', '⭐', '⏱️', '⏳',
      '🇧🇯', '🇫🇷', '🇹🇬', '🇳🇬', '🇬🇭', '🇨🇮', '🇸🇳', '🌍'
    ],
  },
];

interface EmojiStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (sticker: DriverSticker) => void;
  onSelectPhrase?: (phrase: string) => void;
}

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  onSelectSticker,
  onSelectPhrase,
}) => {
  const [activeTab, setActiveTab] = useState<'emojis' | 'stickers' | 'phrases'>('emojis');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered Stickers
  const filteredStickers = useMemo(() => {
    if (!searchQuery.trim()) return DRIVER_STICKERS;
    const q = searchQuery.toLowerCase();
    return DRIVER_STICKERS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.emoji.includes(q)
    );
  }, [searchQuery]);

  // Filtered Emojis
  const currentEmojiList = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const all: string[] = [];
      EMOJI_CATEGORIES.forEach((cat) => {
        cat.emojis.forEach((e) => {
          if (!all.includes(e)) all.push(e);
        });
      });
      return all;
    }
    const cat = EMOJI_CATEGORIES.find((c) => c.id === selectedEmojiCategory);
    return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
  }, [selectedEmojiCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 right-0 left-0 sm:left-auto sm:right-2 w-full sm:w-96 max-h-[460px] bg-slate-900 border-2 border-slate-700/90 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
      {/* Header with Close */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        {/* Tab Switchers */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'emojis'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Smileys</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'stickers'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Stickers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phrases')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'phrases'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rapides</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer le sélecteur"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-2.5 bg-slate-950/60 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'stickers'
                ? 'Rechercher un sticker (ex: route, colis, pluie)...'
                : 'Rechercher un smiley ou emoji...'
            }
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: EMOJIS & SMALLEY */}
      {activeTab === 'emojis' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          {/* Category Pills */}
          {!searchQuery && (
            <div className="flex items-center gap-1 overflow-x-auto p-2 bg-slate-950/40 border-b border-slate-800 scrollbar-none">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedEmojiCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all ${
                    selectedEmojiCategory === cat.id
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-black'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji Grid */}
          <div className="flex-1 p-3 overflow-y-auto max-h-64 grid grid-cols-7 sm:grid-cols-8 gap-1.5 scrollbar-thin">
            {currentEmojiList.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-slate-800 hover:scale-125 active:scale-95 transition-transform"
                title={`Insérer ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 text-center">
            💡 Cliquez sur un smiley pour l'insérer instantanément dans votre texte.
          </div>
        </div>
      )}

      {/* TAB 2: STICKERS LIVREUR BÉNIN */}
      {activeTab === 'stickers' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          <div className="p-2 bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Stickers Spéciaux Chauffeur & Relais Bénin</span>
            </span>
            <span className="text-[10px] text-slate-400">1-clic pour envoyer</span>
          </div>

          {/* Stickers Grid */}
          <div className="flex-1 p-3 overflow-y-auto max-h-72 grid grid-cols-2 gap-2.5 scrollbar-thin">
            {filteredStickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => {
                  onSelectSticker(sticker);
                  onClose();
                }}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${sticker.gradient} border ${sticker.borderColor} p-3 text-left shadow-lg hover:scale-105 active:scale-95 transition-all text-white`}
              >
                {/* Background Glow */}
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />

                <div className="flex items-start justify-between gap-1">
                  <span className="text-2xl drop-shadow">{sticker.emoji}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${sticker.badgeColor}`}>
                    {sticker.category}
                  </span>
                </div>

                <div className="mt-2">
                  <h4 className="text-xs font-black tracking-tight leading-tight text-white drop-shadow">
                    {sticker.title}
                  </h4>
                  <p className="text-[10px] text-white/80 font-medium line-clamp-1 mt-0.5">
                    {sticker.subtitle}
                  </p>
                </div>

                <div className="mt-2 pt-1 border-t border-white/20 flex items-center justify-end text-[9px] font-bold text-white/90">
                  <span>Envoyer ➔</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 text-center">
            ✨ Les stickers s'affichent sous forme de badge graphique animé dans la discussion.
          </div>
        </div>
      )}

      {/* TAB 3: PHRASES RAPIDES CONDUCTEUR */}
      {activeTab === 'phrases' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          <div className="p-2 bg-emerald-950/50 border-b border-slate-800 text-xs text-emerald-300 font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Messages Rapides Mains-Libres Conduite</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto max-h-72 space-y-2 scrollbar-thin">
            {QUICK_DRIVER_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (onSelectPhrase) {
                    onSelectPhrase(phrase.text);
                  } else {
                    onSelectEmoji(phrase.text);
                  }
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-left flex items-center justify-between gap-2 text-xs text-slate-200 hover:text-white hover:border-amber-400/50 transition-all hover:scale-[1.01]"
              >
                <span className="font-medium">{phrase.text}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 text-amber-400 font-bold shrink-0 border border-slate-700">
                  {phrase.label}
                </span>
              </button>
            ))}
          </div>

          <div className="p-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 text-center">
            ⚡ Idéal pour répondre en un seul geste pendant vos livraisons.
          </div>
        </div>
      )}
    </div>
  );
};
