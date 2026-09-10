export type UserRole = 'driver' | 'client' | 'merchant' | 'admin';
export type VehicleType = 'moto_2wheels' | 'tricycle' | 'car_4wheels';
export type PricingPlan = 'subscription' | 'commission';

export interface AdminCommissionWithdrawal {
  id: string;
  adminId: string;
  adminName: string;
  amount: number;
  provider: PaymentProvider | 'bank_transfer';
  destinationAccount: string; // Mobile Money phone or bank account number
  reference: string;
  reason: string;
  timestamp: string;
}

export interface PlatformTreasury {
  totalCommissionsCollected: number;
  totalSubscriptionsCollected: number;
  totalDriverPrepaidDepositsHeld: number;
  totalAdminWithdrawals: number;
  availableBalance: number;
  withdrawalHistory: AdminCommissionWithdrawal[];
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'commission_debit' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  deliveryId?: string;
  trackingCode?: string;
  deliveryFee?: number;
  commissionRate?: number;
  balanceAfter: number;
  provider?: PaymentProvider;
  reference?: string;
  securityHash?: string;
  timestamp: string;
}

export interface DriverWallet {
  balance: number;
  pricingPlan: PricingPlan;
  totalCommissionsPaid: number;
  totalDeposited: number;
  transactions: WalletTransaction[];
  securityPin?: string; // 4-digit code for fund protection
  isEscrowLocked?: boolean;
  escrowLockedReason?: string;
  activeDeliveryId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  role: UserRole;
  phone: string;
  email: string;
  city: string;
  country?: string;
  countryCode?: string;
  currencyPreference?: string;
  vehicleType?: VehicleType;
  vehiclePlate?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isCertified: boolean;
  idDocumentType?: 'cip_nip' | 'cni' | 'permis' | 'passport';
  idDocumentUrl?: string;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  kycSubmittedAt?: string;
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  trialDaysLeft: number;
  hasFirstMonthDiscount: boolean;
  registeredOrder: number;
  premiumBadgeUntil?: string; // ISO date
  subscriptionExpiresAt?: string; // ISO date
  pricingPlan?: PricingPlan; // 'subscription' or 'commission'
  driverWallet?: DriverWallet; // Account balance for progressive commission debits
  walletSecurityPin?: string; // 4-digit security PIN for driver funds
  rating: number;
  totalRatingsCount: number;
  completedDeliveries: number;
  createdAt: string;
}

export type DeliveryStatus = 
  | 'pending'
  | 'in_transit'
  | 'nearby_500m'
  | 'alert_300m'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

export interface Delivery {
  id: string;
  trackingCode: string;
  clientPseudo: string;
  clientPhone: string;
  recipientName?: string;
  recipientPhone?: string;
  emergencyPhone?: string; // Numéro de secours facultatif
  emergencyContactName?: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry?: string;
  dropoffAddress: string;
  dropoffCity: string;
  dropoffCountry?: string;
  isInternational?: boolean;
  currency?: string;
  packageDescription: string;
  packageValue?: number;
  deliveryFee: number;
  isFromAd?: boolean; // If accepted via classified ad announcement
  adId?: string; // ID of the classified ad
  commissionRate?: number; // Progressive commission percentage (e.g. 5%, 7%, 9%, ...)
  commissionAmount?: number; // FCFA amount debited from driver wallet
  netDriverFee?: number; // Net amount earned by driver
  netDriverPayout?: number; // Net payout amount for driver
  isCommissionDebited?: boolean; // Flag when PIN verified
  status: DeliveryStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLat: number;
  driverLng: number;
  targetLat: number;
  targetLng: number;
  distanceRemainingMeters: number;
  estimatedArrivalMinutes: number;
  securityPin: string; // Anti-theft code
  isPrimaryAlertSent: boolean; // 500m alert
  isRobotVoiceTriggered: boolean; // 300m voice alert
  rating?: number;
  reviewComment?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface LiveLocationData {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
  isLive?: boolean;
  durationMinutes?: number;
  expiresAt?: string;
  accuracyMeters?: number;
}

export interface ChatMessage {
  id: string;
  groupId: string; // 'global' or city name e.g. 'cotonou'
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  senderCity?: string;
  isDriverCertified?: boolean;
  hasPremiumBadge?: boolean;
  content: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  isWalkieTalkie?: boolean;
  location?: LiveLocationData;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  stickerId?: string;
  stickerEmoji?: string;
  stickerTitle?: string;
  stickerGradient?: string;
  timestamp: string;
  translatedText?: Record<string, string>; // langCode -> translation
  reactions?: Record<string, number>;
}

export type CustomGroupCategory = 'drivers_team' | 'neighborhood' | 'logistics' | 'commercial' | 'social';

export interface CustomChatGroup {
  id: string;
  name: string;
  description: string;
  iconEmoji?: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  category: CustomGroupCategory;
  creatorId: string;
  creatorName: string;
  creatorPhone?: string;
  creatorAvatar?: string;
  isPrivate?: boolean;
  passcode?: string;
  memberCount: number;
  memberIds?: string[];
  createdAt: string;
  pinnedNotice?: string;
}

export type AdCategory = 
  | 'individual_need'
  | 'driver_relay'
  | 'merchant_call'
  | 'restaurant_promo'
  | 'recruitment'
  | 'mutual_aid';

export interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  category: AdCategory;
  country?: string;
  countryCode?: string;
  city: string;
  currency?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl?: string;
  phone: string;
  whatsapp: string;
  createdAt: string;
  expiresAt: string; // ISO date
  isApproved: boolean;
  isPinned?: boolean;
  imageUrl?: string;
  price?: number;
}

export interface AidRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverCity: string;
  incidentType: 'accident' | 'breakdown' | 'theft' | 'health' | 'health_emergency' | 'tontine_advance' | 'spare_parts' | 'other';
  description: string;
  requestedAmount: number;
  proofDocumentUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  eligibilityScore: number;
  adminNotes?: string;
  isTontineAdvance?: boolean;
  repaymentStatus?: 'none' | 'in_progress' | 'repaid';
  tontineCycleId?: string;
  createdAt: string;
}

export interface TontineMember {
  id: string;
  name: string;
  phone: string;
  city: string;
  avatar?: string;
  vehicleType?: string;
  payoutTurn: number; // e.g. 1st, 2nd, 3rd ...
  hasReceived: boolean;
  contributionsPaidCount: number;
  totalContributedFcfa: number;
  status: 'active' | 'up_to_date' | 'late' | 'paid_out';
}

export interface TontineCycle {
  id: string;
  title: string;
  description: string;
  category: 'moto_weekly' | 'express_daily' | 'cargo_biweekly' | 'emergency_aid';
  contributionAmount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  totalMembers: number;
  currentTurn: number;
  jackpotAmount: number; // contributionAmount * totalMembers
  emergencyReserveAmount: number; // 5% emergency caisse
  nextPayoutDate: string;
  currentBeneficiary: {
    name: string;
    phone: string;
    avatar?: string;
    city: string;
    purpose?: string;
    payoutTurn?: number;
  };
  members: TontineMember[];
  status: 'active' | 'enrolling' | 'completed';
  rules: string[];
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'used';
  category: 'helmet' | 'gps_mount' | 'delivery_bag' | 'jacket' | 'spare_parts' | 'other';
  imageUrl: string;
  images?: string[]; // Multiple photos under different angles (up to 5 photos)
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerCity: string;
  sellerCountry?: string;
  sellerCountryCode?: string;
  sellerAvatar?: string;
  currency?: string;
  isSold: boolean;
  createdAt: string;
}

export interface RentalItemSpecs {
  payloadCapacityKg?: number; // e.g. 800 kg for cargo tricycle
  fuelType?: 'essence' | 'diesel' | 'electrique';
  mileageKm?: number;
  hasHelmetIncluded?: boolean;
  hasInsurance?: boolean;
  hasLockIncluded?: boolean;
}

export interface RentalItem {
  id: string;
  title: string;
  vehicleType: VehicleType;
  dailyPrice: number;
  weeklyPrice?: number;
  city: string;
  country?: string;
  countryCode?: string;
  currency?: string;
  imageUrl: string;
  images?: string[]; // Multiple photos under different angles (up to 5 photos)
  ownerId?: string;
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  ownerAvatar?: string;
  isAvailable: boolean;
  description: string;
  specs?: RentalItemSpecs;
  depositAmount?: number; // Caution en FCFA
  createdAt?: string;
}

export interface DirectConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  senderAvatar?: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  isVoiceNote?: boolean;
  offerAmount?: number;
  rentalDaysRequested?: number;
  offerStatus?: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface DirectConversation {
  id: string;
  targetType: 'marketplace' | 'rental';
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  itemPriceType?: 'fixed' | 'per_day';
  itemImageUrl: string;
  itemSecondaryInfo?: string;
  sellerOrOwnerId: string;
  sellerOrOwnerName: string;
  sellerOrOwnerPhone: string;
  sellerOrOwnerAvatar?: string;
  buyerOrRenterId: string;
  buyerOrRenterName: string;
  buyerOrRenterPhone: string;
  buyerOrRenterAvatar?: string;
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCountForBuyer: number;
  unreadCountForSeller: number;
  status: 'active' | 'archived' | 'deal_closed';
  createdAt: string;
}

export type PaymentPurpose = 
  | 'subscription_2wheels'
  | 'subscription_tricycle'
  | 'subscription_4wheels'
  | 'premium_badge_week'
  | 'ad_highlight'
  | 'aid_fund_donation'
  | 'tontine_contribution_1000'
  | 'tontine_contribution_2500'
  | 'tontine_contribution_5000'
  | 'wallet_deposit_250'
  | 'wallet_deposit_500'
  | 'wallet_deposit_1000'
  | 'wallet_deposit_1200'
  | 'wallet_deposit_1500'
  | 'wallet_deposit_2000'
  | 'wallet_deposit_2500'
  | 'wallet_deposit_custom';

export type PaymentProvider = 
  | 'fedapay'
  | 'mtn_momo'
  | 'moov_money'
  | 'celtiis_cash'
  | 'kkiapay'
  | 'bank_card'
  | 'paypal'
  | 'credit_card';

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  purpose: PaymentPurpose;
  provider: PaymentProvider;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  createdAt: string;
}

export interface DailyAdministrativeSummary {
  id: string;
  date: string;
  totalDeliveries: number;
  completedDeliveries: number;
  incidentsReported: number;
  newSubscriptionsCount: number;
  totalSubscriptionRevenueFcfa: number;
  activeDriversCount: number;
  sentToEmail: string;
  summaryText: string;
  createdAt: string;
}

export type NotificationType = 
  | 'recruitment'
  | 'badge_expiration'
  | 'urgent_delivery'
  | 'aid_fund'
  | 'aid_approved'
  | 'payment_confirmed'
  | 'kyc_approved'
  | 'route_optimized'
  | 'subscription_expiry'
  | 'system_alert'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  city?: string;
  actionUrl?: string;
  targetTab?: 'classifieds' | 'deliveries' | 'community' | 'mutual_aid' | 'marketplace' | 'admin_support';
  actionPurpose?: PaymentPurpose;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  recruitmentAlerts: boolean;
  badgeExpirationAlerts: boolean;
  urgentDeliveryAlerts: boolean;
  aidFundAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  driverCirculationSound: boolean; // Signal sonore percutant spécial circulation moto
  driverVoiceAnnounce: boolean; // Synthèse vocale de la course ou alerte
}

export type OfflineActionType =
  | 'delivery_status_update'
  | 'delivery_pin_verified'
  | 'new_classified_ad'
  | 'chat_message_sent'
  | 'aid_request_created'
  | 'payment_offline_logged'
  | 'driver_gps_ping';

export interface QueuedOfflineAction {
  id: string;
  type: OfflineActionType;
  title: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface OfflineSyncState {
  isOnline: boolean;
  isForcedOffline: boolean;
  lastOnlineAt: string | null;
  lastSyncAt: string | null;
  pendingActionsCount: number;
  queuedActions: QueuedOfflineAction[];
}

export interface DeliveryStop {
  id: string;
  deliveryId?: string;
  label: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  contactName?: string;
  contactPhone?: string;
  packageDescription?: string;
  stopType: 'pickup' | 'dropoff' | 'depot' | 'custom';
  status?: DeliveryStatus;
  securityPin?: string;
  fee?: number;
  estimatedArrivalMinutes?: number;
}

export interface RouteOptimizationLeg {
  distanceMeters: number;
  durationSeconds: number;
  startAddress?: string;
  endAddress?: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export interface RouteOptimizationResult {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  optimizedOrder: number[]; // e.g. [2, 0, 1, 3] indicating reordering of intermediate stops
  orderedStops: DeliveryStop[];
  legs: RouteOptimizationLeg[];
  savings: {
    distanceMetersSaved: number;
    timeMinutesSaved: number;
    fuelSavedFcfa: number;
    percentageSaved: number;
  };
  encodedPolyline?: string;
  polylineCoordinates?: Array<{ lat: number; lng: number }>;
  googleMapsNavigationUrl: string;
  isLiveGoogleMapsApi: boolean;
  algorithmNote?: string;
  calculatedAt: string;
}

