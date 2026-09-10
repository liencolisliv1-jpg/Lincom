import React, { useState } from 'react';
import { CustomChatGroup, CustomGroupCategory, UserProfile } from '../types';
import {
  Users,
  X,
  Sparkles,
  Shield,
  MapPin,
  Lock,
  Globe2,
  FileText,
  CheckCircle2,
  Upload,
  Camera,
} from 'lucide-react';
import { ALL_BENIN_CITIES } from '../constants/beninCities';

interface CreateCustomGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onGroupCreated: (group: CustomChatGroup) => void;
  isDarkMode?: boolean;
  onOpenAuth?: () => void;
}

const CATEGORY_OPTIONS: {
  key: CustomGroupCategory;
  label: string;
  desc: string;
  icon: string;
  badgeBg: string;
}[] = [
  {
    key: 'drivers_team',
    label: 'Équipe & Flotte Chauffeurs',
    desc: 'Coordination de tournées, relais et entraide sur la route',
    icon: '⚡',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    key: 'neighborhood',
    label: 'Quartier & Zone Locale',
    desc: 'Pour les livreurs et commerçants d’un quartier spécifique',
    icon: '🏘️',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    key: 'logistics',
    label: 'Cargo, Tricycles & Fret Lourd',
    desc: 'Transport volumineux, bennes renforcées et déménagements',
    icon: '🚚',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  {
    key: 'commercial',
    label: 'Boutiques & Bons Plans',
    desc: 'Partage de courses, commandes groupées et opportunités',
    icon: '🛍️',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    key: 'social',
    label: 'Salon Confraternité & Pause',
    desc: 'Discussions libres, conseils mécaniques et solidarité',
    icon: '🤝',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
];

const PRESET_EMOJIS = ['⚡', '🛵', '🚚', '📦', '🎓', '📍', '🛡️', '🚀', '💬', '🌟', '🌍', '🤝', '🔥', '🏆', '🎯', '🛒'];

export const CreateCustomGroupModal: React.FC<CreateCustomGroupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGroupCreated,
  isDarkMode,
  onOpenAuth,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CustomGroupCategory>('drivers_team');
  const [iconEmoji, setIconEmoji] = useState('⚡');
  const [city, setCity] = useState(currentUser?.city || 'Cotonou');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [pinnedNotice, setPinnedNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner un nom pour votre groupe.');
      return;
    }

    if (name.trim().length < 4) {
      setErrorMsg('Le nom du groupe doit comporter au moins 4 caractères.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Veuillez ajouter une brève description ou les objectifs du groupe.');
      return;
    }

    if (isPrivate && !passcode.trim()) {
      setErrorMsg('Veuillez définir un code d’accès pour ce groupe privé.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const newGroup: CustomChatGroup = {
      id: `grp_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      description: description.trim(),
      category,
      iconEmoji,
      avatarUrl: avatarUrl.trim() || undefined,
      city,
      country: currentUser.country || 'Bénin',
      creatorId: currentUser.id,
      creatorName: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Chauffeur Liencolis',
      creatorPhone: currentUser.phone,
      creatorAvatar: currentUser.avatarUrl,
      isPrivate,
      passcode: isPrivate ? passcode.trim() : undefined,
      memberCount: 1,
      memberIds: [currentUser.id],
      createdAt: new Date().toISOString(),
      pinnedNotice: pinnedNotice.trim() || undefined,
    };

    onGroupCreated(newGroup);
    setIsSubmitting(false);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg ring-4 ring-emerald-500/20 shrink-0 font-bold">
              {iconEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Espace Communautaire
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Nouveau Salon
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                Créer un Groupe de Conversation Personnel
              </h2>
              <p className="text-xs text-slate-400">
                Fondez votre propre groupe d'échange pour votre équipe, votre quartier ou votre spécialité de livraison.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Group Name & Emoji Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Nom du Groupe *</span>
              <span className="text-[11px] text-slate-500 font-normal">Ex: Chauffeurs Express Ganhi</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative group shrink-0">
                <button
                  type="button"
                  className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500 text-xl flex items-center justify-center transition"
                  title="Changer l'icône emoji"
                >
                  {iconEmoji}
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Club Tricycles & Grosses Bennes Calavi"
                required
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            {/* Quick Emoji Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 mr-1">Icônes rapides :</span>
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIconEmoji(emoji)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                    iconEmoji === emoji
                      ? 'bg-emerald-500 text-white font-bold scale-110 shadow'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Catégorie du Groupe *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const isSelected = category === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCategory(opt.key)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{opt.icon}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City / Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Ville ou Zone de Rattachement</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-sm text-white outline-none"
            >
              <option value="Toutes Villes (National)">🌍 Toutes Villes (National / Bénin)</option>
              {ALL_BENIN_CITIES.map((c) => (
                <option key={c.id} value={c.name}>
                  🇧🇯 {c.name} ({c.department})
                </option>
              ))}
              <option value="Lomé (Togo)">🇹🇬 Lomé (Togo)</option>
              <option value="Abidjan (Côte d'Ivoire)">🇨🇮 Abidjan (Côte d'Ivoire)</option>
              <option value="Dakar (Sénégal)">🇸🇳 Dakar (Sénégal)</option>
              <option value="International">🌐 International / Diaspora</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Description & Objectifs du Salon *</span>
              <span className="text-[11px] text-slate-500 font-normal">Max 300 car.</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Décrivez à qui s'adresse ce groupe, les règles de respect mutuel et ce que les membres y trouveront..."
              required
              maxLength={300}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-500 outline-none resize-none"
            />
          </div>

          {/* Optional Pinned Notice */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Message / Consigne Épinglée (Optionnel)</span>
            </label>
            <input
              type="text"
              value={pinnedNotice}
              onChange={(e) => setPinnedNotice(e.target.value)}
              placeholder="Ex: Réunion d'équipe le samedi à 18h ou point de ralliement"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Group Photo / Avatar (URL or File) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Photo ou Bannière du Groupe (Optionnel)</span>
              <span className="text-[11px] text-slate-500">Image Web ou Fichier</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 outline-none"
              />
              <label className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0 transition">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Importer</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {avatarUrl && (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 mt-2">
                <img
                  src={avatarUrl}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="absolute top-1 right-1 p-1 bg-slate-950/80 rounded-full text-white text-[10px]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Passcode */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">
                    {isPrivate ? 'Groupe Privé & Code Secret' : 'Groupe Public Ouvert'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isPrivate
                      ? 'Seuls les membres munis du code peuvent entrer et chatter'
                      : 'Tout chauffeur et livreur de la communauté peut rejoindre librement'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  isPrivate ? 'bg-amber-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isPrivate && (
              <div className="pt-2 animate-in fade-in">
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Définissez un code secret (Ex: CALAVI2026)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/50 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Créer le Groupe</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
