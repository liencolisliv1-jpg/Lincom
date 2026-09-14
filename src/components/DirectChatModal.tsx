import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  DirectConversation,
  DirectConversationMessage,
  UserProfile,
  MarketplaceItem,
  RentalItem,
  MessageReplyInfo,
} from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  X,
  Send,
  Phone,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Mic,
  MicOff,
  Play,
  Pause,
  AlertCircle,
  Tag,
  Bike,
  ShoppingBag,
  Trash2,
  Edit2,
  Check,
  Reply,
} from 'lucide-react';

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: DirectConversation | null;
  currentUser: UserProfile | null;
  onOpenAuth?: () => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onOpenAuth,
}) => {
  const [messages, setMessages] = useState<DirectConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState<string>('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageReplyInfo | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRentalBookingModal, setShowRentalBookingModal] = useState(false);
  const [customOfferAmount, setCustomOfferAmount] = useState<string>('');
  const [rentalDays, setRentalDays] = useState<number>(2);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const voiceTimerRef = useRef<any>(null);

  // Load conversation messages
  useEffect(() => {
    if (!conversation) return;

    const loadMessages = () => {
      const msgs = storageService.getConversationMessages(conversation.id);
      setMessages(msgs);
      if (currentUser) {
        storageService.markConversationAsRead(conversation.id, currentUser.id);
      }
    };

    loadMessages();

    // Polling / listener
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [conversation?.id, currentUser?.id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen || !conversation) return null;

  const isMarketplace = conversation.targetType === 'marketplace';
  const isBuyerOrRenter = currentUser ? currentUser.id === conversation.buyerOrRenterId : true;
  const isSellerOrOwner = currentUser ? currentUser.id === conversation.sellerOrOwnerId : false;

  const partnerName = isBuyerOrRenter ? conversation.sellerOrOwnerName : conversation.buyerOrRenterName;
  const partnerPhone = isBuyerOrRenter ? conversation.sellerOrOwnerPhone : conversation.buyerOrRenterPhone;
  const partnerAvatar = isBuyerOrRenter ? conversation.sellerOrOwnerAvatar : conversation.buyerOrRenterAvatar;

  const handleSendMessage = (customPayload?: Partial<DirectConversationMessage>) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    const content = customPayload?.content || inputText.trim();
    if (!content && !customPayload?.imageUrl && !customPayload?.audioUrl && !customPayload?.offerAmount) {
      return;
    }

    const replyPayload = replyingToMessage ? { replyTo: replyingToMessage } : {};

    const newMsg: DirectConversationMessage = {
      id: `cmsg_${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Utilisateur',
      senderRole: currentUser.role,
      ...(currentUser.avatarUrl ? { senderAvatar: currentUser.avatarUrl } : {}),
      content: content || '',
      timestamp: new Date().toISOString(),
      ...replyPayload,
      ...customPayload,
    };

    storageService.addConversationMessage(conversation.id, newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setReplyingToMessage(null);
  };

  const handleTriggerReply = (msg: DirectConversationMessage) => {
    const snippet = msg.content || (msg.imageUrl ? '📷 Photo' : msg.audioUrl ? '🎤 Message vocal' : msg.offerAmount ? `💰 Offre : ${msg.offerAmount.toLocaleString()} F` : 'Message');
    setReplyingToMessage({
      id: msg.id,
      messageId: msg.id,
      senderName: msg.senderName,
      text: snippet,
    });
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customOfferAmount);
    if (!amount || amount <= 0) return;

    handleSendMessage({
      content: `💰 Je vous propose une offre de prix ferme à ${amount.toLocaleString()} FCFA pour cet article.`,
      offerAmount: amount,
      offerStatus: 'pending',
    });

    setShowOfferModal(false);
    setCustomOfferAmount('');
  };

  const handleSendRentalRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalDays || rentalDays <= 0) return;
    const totalEst = rentalDays * conversation.itemPrice;

    handleSendMessage({
      content: `📅 Demande de réservation pour ${rentalDays} jour(s) de location (Total estimé : ${totalEst.toLocaleString()} FCFA).`,
      rentalDaysRequested: rentalDays,
      offerAmount: totalEst,
      offerStatus: 'pending',
    });

    setShowRentalBookingModal(false);
  };

  const handleRespondToOffer = (messageId: string, status: 'accepted' | 'declined') => {
    storageService.updateConversationOfferStatus(conversation.id, messageId, status);
    const updated = messages.map((m) => (m.id === messageId ? { ...m, offerStatus: status } : m));
    setMessages(updated);

    const msg = status === 'accepted'
      ? `✅ J'accepte votre proposition ! Contactez-moi pour finaliser la transaction.`
      : `❌ Désolé, je ne peux pas accepter ce prix pour le moment.`;

    handleSendMessage({ content: msg });
  };

  const handleStartVoiceRecording = () => {
    setIsRecordingVoice(true);
    setVoiceSeconds(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopVoiceRecording = (send: boolean) => {
    clearInterval(voiceTimerRef.current);
    const duration = voiceSeconds;
    setIsRecordingVoice(false);
    setVoiceSeconds(0);

    if (send && duration > 0) {
      handleSendMessage({
        content: `🎙️ Message vocal (${duration}s)`,
        isVoiceNote: true,
        audioDurationSeconds: duration,
        audioUrl: 'mock_audio_stream',
      });
    }
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    handleSendMessage({
      content: '📷 Photo partagée dans la discussion',
      imageUrl: photoDataUrl,
    });
    setShowCameraModal(false);
  };

  const handleStartEdit = (msg: DirectConversationMessage) => {
    setEditingMessageId(msg.id);
    setEditMessageText(msg.content || '');
    setDeletingMessageId(null);
  };

  const handleSaveEdit = (msgId: string) => {
    const trimmed = editMessageText.trim();
    if (!trimmed || !conversation) return;

    storageService.updateConversationMessage(conversation.id, msgId, trimmed);
    const updated = messages.map((m) => (m.id === msgId ? { ...m, content: trimmed, isEdited: true, editedAt: new Date().toISOString() } : m));
    setMessages(updated);
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleConfirmDelete = (msgId: string) => {
    if (!conversation) return;
    storageService.deleteConversationMessage(conversation.id, msgId);
    setMessages(messages.filter((m) => m.id !== msgId));
    setDeletingMessageId(null);
  };

  const quickPrompts = isMarketplace
    ? [
        'Est-ce toujours disponible ?',
        'Quel est votre dernier prix ?',
        'Où peut-on se voir à Cotonou ?',
        'Livraison possible aujourd’hui ?',
      ]
    : [
        'L’engin est-il disponible immédiatement ?',
        'Casque et antivol inclus ?',
        'Quel est le montant de la caution ?',
        'Visite technique & assurance à jour ?',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full h-[90vh] max-h-[780px] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header with Item Summary */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Item Thumbnail */}
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              <img
                src={conversation.itemImageUrl}
                alt={conversation.itemTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5 text-[8px] font-bold text-amber-300">
                {isMarketplace ? 'VENTE' : 'LOCATION'}
              </div>
            </div>

            {/* Item and Partner Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {conversation.itemTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black shrink-0">
                  {conversation.itemPrice.toLocaleString()} FCFA{conversation.itemPriceType === 'per_day' ? '/j' : ''}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <span>Avec <strong>{partnerName}</strong></span>
                {conversation.itemSecondaryInfo && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{conversation.itemSecondaryInfo}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons (Call, WhatsApp, Close) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {partnerPhone && (
              <>
                <a
                  href={`tel:${partnerPhone.replace(/\s+/g, '')}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Appeler directement"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </a>
                <a
                  href={`https://wa.me/${partnerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Bonjour ${partnerName}, je vous contacte depuis Liencolis à propos de votre annonce : "${conversation.itemTitle}"`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  title="Ouvrir sur WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors ml-1"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Conversation Action Chips */}
        <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => {
              if (isMarketplace) {
                setShowOfferModal(true);
              } else {
                setShowRentalBookingModal(true);
              }
            }}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-all"
          >
            {isMarketplace ? <DollarSign className="w-3.5 h-3.5 text-amber-400" /> : <Calendar className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isMarketplace ? 'Faire une Offre de Prix' : 'Demande de Réservation'}</span>
          </button>

          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage({ content: prompt })}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] whitespace-nowrap shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Feed Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {/* Trust Guarantee Note */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-blue-200 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Sécurité Liencolis :</strong> Toutes les transactions et numéros de téléphone sont protégés. Vérifiez toujours le matériel ou l'engin avant paiement final.
            </p>
          </div>

          {messages.map((msg) => {
            const isMe = currentUser && msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span className="font-bold text-slate-300">{msg.senderName}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.isEdited && (
                    <span className="text-amber-400 font-medium italic text-[9px] bg-amber-400/10 px-1 rounded border border-amber-400/20">
                      (modifié)
                    </span>
                  )}

                  {/* Reply Button */}
                  {editingMessageId !== msg.id && deletingMessageId !== msg.id && (
                    <button
                      type="button"
                      onClick={() => handleTriggerReply(msg)}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-0.5 opacity-75 hover:opacity-100"
                      title="Glisser vers la droite ou cliquer pour répondre"
                    >
                      <Reply className="w-2.5 h-2.5 text-amber-400" />
                      <span className="text-[9px] hidden sm:inline">Répondre</span>
                    </button>
                  )}

                  {isMe && editingMessageId !== msg.id && deletingMessageId !== msg.id && (
                    <div className="flex items-center gap-1 ml-1 opacity-70 hover:opacity-100 transition-opacity">
                      {!msg.isVoiceNote && !msg.offerAmount && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg)}
                          className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-300 transition-colors"
                          title="Modifier le message"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingMessageId(msg.id)}
                        className="p-0.5 rounded hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                        title="Supprimer ce message"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Box */}
                {deletingMessageId === msg.id && (
                  <div className="w-full max-w-xs p-2.5 rounded-xl bg-red-950/95 border border-red-500/70 shadow-lg text-xs space-y-2 animate-in fade-in">
                    <p className="font-bold text-red-100 text-[11px] flex items-center gap-1">
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>Supprimer ce message ?</span>
                    </p>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setDeletingMessageId(null)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(msg.id)}
                        className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Editing */}
                {editingMessageId === msg.id ? (
                  <div className="w-full max-w-sm rounded-xl p-2.5 bg-slate-900 border-2 border-sky-500 shadow-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[10px] text-sky-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Modifier le message
                      </span>
                    </div>
                    <textarea
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit(msg.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 resize-none min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.id)}
                        disabled={!editMessageText.trim()}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Enregistrer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="relative group max-w-[85%] sm:max-w-[75%]">
                  {/* Swipe reply behind icon */}
                  <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-start pl-1 pointer-events-none text-amber-400">
                    <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center scale-90 shadow">
                      <Reply className="w-3 h-3 text-amber-300" />
                    </div>
                  </div>

                  {/* Swipeable Bubble */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 60 }}
                    dragElastic={0.2}
                    dragSnapToOrigin
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 35 || info.velocity.x > 120) {
                        handleTriggerReply(msg);
                      }
                    }}
                    className={`rounded-2xl p-3 text-xs leading-relaxed space-y-2 shadow-md cursor-grab active:cursor-grabbing ${
                      isMe
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {/* Quoted Message */}
                    {msg.replyTo && (
                      <div className="p-2 rounded-xl bg-black/35 border-l-4 border-amber-400 text-left text-xs text-slate-200">
                        <div className="flex items-center gap-1 font-bold text-amber-300 text-[10px]">
                          <Reply className="w-2.5 h-2.5 text-amber-400 rotate-180 scale-y-[-1]" />
                          <span>{msg.replyTo.senderName}</span>
                        </div>
                        <p className="text-[10px] text-slate-300/90 truncate mt-0.5 line-clamp-2">
                          {msg.replyTo.text}
                        </p>
                      </div>
                    )}
                  {/* Image attachment if any */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10 max-h-48 bg-black/40">
                      <img
                        src={msg.imageUrl}
                        alt="Photo partagée"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Voice note simulation */}
                  {msg.isVoiceNote && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10">
                      <button
                        onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                        className="p-1.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
                      >
                        {playingAudioId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                      <div className="flex-1">
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className={`h-full bg-amber-400 ${playingAudioId === msg.id ? 'w-full animate-pulse' : 'w-1/3'}`}></div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">
                        {msg.audioDurationSeconds ? `0:0${msg.audioDurationSeconds}` : '0:03'}
                      </span>
                    </div>
                  )}

                  {/* Text content */}
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                  {/* Price Offer / Reservation Card */}
                  {msg.offerAmount && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-400/40 text-amber-300 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{msg.rentalDaysRequested ? 'Demande de Location' : 'Proposition d’Offre'}</span>
                        </span>
                        <span className="text-white text-sm">{msg.offerAmount.toLocaleString()} FCFA</span>
                      </div>

                      {msg.rentalDaysRequested && (
                        <p className="text-[10px] text-slate-300">
                          Durée demandée : <strong>{msg.rentalDaysRequested} jour(s)</strong>
                        </p>
                      )}

                      {/* Status and Action Buttons */}
                      {msg.offerStatus === 'pending' ? (
                        !isMe ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleRespondToOffer(msg.id, 'accepted')}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accepter</span>
                            </button>
                            <button
                              onClick={() => handleRespondToOffer(msg.id, 'declined')}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-slate-700 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-300/80 font-semibold italic flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>En attente de réponse du vendeur...</span>
                          </p>
                        )
                      ) : msg.offerStatus === 'accepted' ? (
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Offre acceptée par les deux parties</span>
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Offre déclinée</span>
                        </div>
                      )}
                    </div>
                  )}
                  </motion.div>
                </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Voice Recording Overlay */}
        {isRecordingVoice && (
          <div className="p-3 bg-rose-950/90 border-t border-rose-800 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
              <span>Enregistrement du message vocal : {voiceSeconds}s</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStopVoiceRecording(false)}
                className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleStopVoiceRecording(true)}
                className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}

        {/* Replying To Quote Banner */}
        {replyingToMessage && (
          <div className="p-2.5 px-3 bg-slate-900/95 border-t-2 border-amber-400 flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-bottom-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Reply className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Réponse à</span>
                  <span className="text-white font-semibold">{replyingToMessage.senderName}</span>
                </p>
                <p className="text-[11px] text-slate-300/80 truncate max-w-xs sm:max-w-md mt-0.5">
                  {replyingToMessage.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingToMessage(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0 transition-colors"
              title="Annuler la réponse"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCameraModal(true)}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
            title="Prendre / Envoyer une photo"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={isRecordingVoice ? () => handleStopVoiceRecording(true) : handleStartVoiceRecording}
            className={`p-2.5 rounded-2xl border transition-colors ${
              isRecordingVoice
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Message vocal"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Écrire à ${partnerName}...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:hover:from-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            title="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Faire une Offre de Prix</span>
              </h4>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Prix affiché : <strong className="text-amber-400">{conversation.itemPrice.toLocaleString()} FCFA</strong>. Saisissez votre proposition :
            </p>

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Montant proposé (FCFA)</label>
                <input
                  type="number"
                  required
                  value={customOfferAmount}
                  onChange={(e) => setCustomOfferAmount(e.target.value)}
                  placeholder="Ex: 5500"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg"
                >
                  Envoyer l'Offre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rental Booking Modal */}
      {showRentalBookingModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Demande de Réservation</span>
              </h4>
              <button onClick={() => setShowRentalBookingModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Tarif journalier : <strong className="text-emerald-400">{conversation.itemPrice.toLocaleString()} FCFA/j</strong>
            </p>

            <form onSubmit={handleSendRentalRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre de jours de location</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={rentalDays}
                  onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total estimé :</span>
                <span className="font-black text-emerald-400 text-sm">
                  {(rentalDays * conversation.itemPrice).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRentalBookingModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg"
                >
                  Envoyer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture for Chat */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCaptured}
        title="Partager une Photo dans la discussion"
      />
    </div>
  );
};
