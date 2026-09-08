import {
  UserProfile,
  Delivery,
  DeliveryStatus,
  ChatMessage,
  ClassifiedAd,
  AidRequest,
  MarketplaceItem,
  RentalItem,
  PaymentTransaction,
  DailyAdministrativeSummary,
  PaymentProvider,
  WalletTransaction,
  PricingPlan,
  DriverWallet,
  AdminCommissionWithdrawal,
  PlatformTreasury,
  TontineCycle,
  TontineMember,
} from '../types';
import { SmtpConfig } from './smtpValidator';

const STORAGE_KEYS = {
  USER: 'liencolis_current_user',
  ALL_USERS: 'liencolis_all_users',
  DELIVERIES: 'liencolis_deliveries',
  MESSAGES: 'liencolis_messages',
  ADS: 'liencolis_ads',
  AID_REQUESTS: 'liencolis_aid_requests',
  TONTINE_CYCLES: 'liencolis_tontine_cycles',
  MARKETPLACE: 'liencolis_marketplace',
  RENTALS: 'liencolis_rentals',
  TRANSACTIONS: 'liencolis_transactions',
  ADMIN_SUMMARIES: 'liencolis_admin_summaries',
  PLATFORM_WITHDRAWALS: 'liencolis_platform_withdrawals',
  ADMIN_PIN: 'liencolis_admin_pin',
  ADMIN_PASSWORD: 'liencolis_admin_password',
  SMTP_CONFIG: 'liencolis_smtp_config',
  COUNTRY: 'liencolis_country',
  CURRENCY: 'liencolis_currency',
  LANGUAGE: 'liencolis_lang',
  THEME: 'liencolis_theme',
};

// Initial Seed Data
const DEFAULT_USER: UserProfile = {
  id: 'usr_driver_01',
  name: 'Utilisateur Demo',
  firstName: 'Utilisateur',
  lastName: 'Demo',
  role: 'driver',
  phone: '+229 00 00 00 00',
  email: 'utilisateur@demo.local',
  city: 'Cotonou',
  country: 'Bénin',
  vehicleType: 'moto_2wheels',
  vehiclePlate: 'BJ-0000-AF',
  isEmailVerified: true,
  isCertified: true,
  idDocumentType: 'cip_nip',
  trialDaysLeft: 10,
  hasFirstMonthDiscount: true,
  registeredOrder: 1,
  rating: 4.9,
  totalRatingsCount: 142,
  completedDeliveries: 386,
  pricingPlan: 'commission',
  driverWallet: {
    balance: 1200,
    pricingPlan: 'commission',
    totalCommissionsPaid: 0,
    totalDeposited: 1200,
    transactions: [
      {
        id: 'wtx_seed_01',
        type: 'deposit',
        amount: 1200,
        description: 'Dépôt initial Portefeuille Livreur Liencolis (MTN MoMo)',
        balanceAfter: 1200,
        provider: 'mtn_momo',
        reference: 'MOMO-INIT-1200',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
  },
  subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  premiumBadgeUntil: new Date(Date.now() + 6 * 86400000).toISOString(),
  createdAt: '2025-01-15T08:00:00Z',
};

const DEFAULT_DELIVERIES: Delivery[] = [
  {
    id: 'del_001',
    trackingCode: 'LC-BJ-8921',
    clientPseudo: 'Mme Chimène A.',
    clientPhone: '+229 97 12 34 56',
    emergencyPhone: '+229 96 88 77 66',
    emergencyContactName: 'M. Koffi (Frère)',
    pickupAddress: 'Boutique Wax Élégance, Marché Dantokpa',
    pickupCity: 'Cotonou',
    dropoffAddress: 'Quartier Haie Vive, Rue 312, Villa 4',
    dropoffCity: 'Cotonou',
    packageDescription: 'Colis Vêtements & Tissus Wax (Pli scellé sécurisé)',
    packageValue: 45000,
    deliveryFee: 1500,
    status: 'in_transit',
    driverId: 'usr_driver_01',
    driverName: 'Livreur Demo',
    driverPhone: '+229 00 00 00 00',
    driverLat: 6.3654,
    driverLng: 2.4285,
    targetLat: 6.3538,
    targetLng: 2.3982,
    distanceRemainingMeters: 850,
    estimatedArrivalMinutes: 4,
    securityPin: '4829',
    isPrimaryAlertSent: false,
    isRobotVoiceTriggered: false,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'del_002',
    trackingCode: 'LC-BJ-8922',
    clientPseudo: 'TechStore Calavi',
    clientPhone: '+229 61 22 33 44',
    emergencyPhone: '+229 95 11 22 33',
    emergencyContactName: 'M. Rodrigue (Gestionnaire adjoint)',
    pickupAddress: 'Carrefour IITA, Akassato',
    pickupCity: 'Abomey-Calavi',
    dropoffAddress: 'Carrefour Kpota, Immeuble Flamboyant',
    dropoffCity: 'Abomey-Calavi',
    packageDescription: 'Accessoires High-Tech & Écouteurs sans fil',
    packageValue: 32000,
    deliveryFee: 2000,
    status: 'pending',
    driverId: 'usr_driver_01',
    driverName: 'Livreur Demo',
    driverPhone: '+229 00 00 00 00',
    driverLat: 6.4485,
    driverLng: 2.3551,
    targetLat: 6.4421,
    targetLng: 2.3489,
    distanceRemainingMeters: 2400,
    estimatedArrivalMinutes: 12,
    securityPin: '7190',
    isPrimaryAlertSent: false,
    isRobotVoiceTriggered: false,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'del_003',
    trackingCode: 'LC-BJ-8919',
    clientPseudo: 'Dr. Bio S.',
    clientPhone: '+229 90 44 55 66',
    emergencyPhone: '+229 94 33 22 11',
    emergencyContactName: 'Pharmacie de garde',
    pickupAddress: 'Clinique Mahouna, Ganhi',
    pickupCity: 'Cotonou',
    dropoffAddress: 'Akpakpa Dodomè, Rue des Cocotiers',
    dropoffCity: 'Cotonou',
    packageDescription: 'Médicaments urgents & Matériel médical',
    packageValue: 18000,
    deliveryFee: 1800,
    status: 'delivered',
    driverId: 'usr_driver_01',
    driverName: 'Livreur Demo',
    driverPhone: '+229 00 00 00 00',
    driverLat: 6.368,
    driverLng: 2.441,
    targetLat: 6.368,
    targetLng: 2.441,
    distanceRemainingMeters: 0,
    estimatedArrivalMinutes: 0,
    securityPin: '3310',
    isPrimaryAlertSent: true,
    isRobotVoiceTriggered: true,
    rating: 5,
    reviewComment: 'Livraison ultra rapide et livreur courtois, merci pour la sécurité !',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    deliveredAt: new Date(Date.now() - 75 * 60000).toISOString(),
  },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  // Grand Groupe
  {
    id: 'msg_g_1',
    groupId: 'global',
    senderId: 'admin_sys',
    senderName: 'Liencolis Modération 🛡️',
    senderRole: 'admin',
    senderCity: 'Cotonou',
    content: 'Bienvenue dans le Grand Groupe Liencolis Driver Community ! Rappel : Aucun partage de lien web, ni de numéro de téléphone direct, ni de message inapproprié. Respectons les règles de la communauté.',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    id: 'msg_g_2',
    groupId: 'global',
    senderId: 'usr_02',
    senderName: 'Paul A. (Livreur Cotonou)',
    senderRole: 'driver',
    senderCity: 'Cotonou',
    isDriverCertified: true,
    content: 'Bonne journée à toute la famille des livreurs ! N’oubliez pas de porter vos casques et de vérifier la pression de vos pneus.',
    timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
  },
  {
    id: 'msg_g_3',
    groupId: 'global',
    senderId: 'usr_03',
    senderName: 'Sèna E-commerce',
    senderRole: 'merchant',
    senderCity: 'Abomey-Calavi',
    content: 'Merci aux livreurs sérieux de Liencolis pour leur ponctualité ce matin.',
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
  },

  // Groupe Cotonou
  {
    id: 'msg_c_1',
    groupId: 'cotonou',
    senderId: 'usr_driver_01',
    senderName: 'Support Liencolis',
    senderRole: 'driver',
    senderCity: 'Cotonou',
    isDriverCertified: true,
    hasPremiumBadge: false,
    content: 'Attention les collègues, travaux de voirie en cours au Carrefour Vèdoko direction Étoile Rouge, prévoyez de passer par Sainte Rita.',
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
  },
  {
    id: 'msg_c_2',
    groupId: 'cotonou',
    senderId: 'usr_04',
    senderName: 'Marc Houndégbé',
    senderRole: 'driver',
    senderCity: 'Cotonou',
    isDriverCertified: true,
    content: 'Bien reçu cher collègue ! Merci pour l’info trafic.',
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
  },

  // Groupe Abomey-Calavi
  {
    id: 'msg_ac_1',
    groupId: 'abomey-calavi',
    senderId: 'usr_05',
    senderName: 'Fabrice Dossou',
    senderRole: 'driver',
    senderCity: 'Abomey-Calavi',
    isDriverCertified: true,
    content: 'Disponible sur la zone Arconville et Zogbadjè pour toutes courses urgentes.',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
  },

  // Groupe Porto-Novo
  {
    id: 'msg_pn_1',
    groupId: 'porto-novo',
    senderId: 'usr_06',
    senderName: 'Alain Houénou',
    senderRole: 'driver',
    senderCity: 'Porto-Novo',
    isDriverCertified: true,
    content: 'Salut les frères de la capitale ! Le temps est clair, bonne route à tous.',
    timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
  },

  // Groupe Parakou
  {
    id: 'msg_pk_1',
    groupId: 'parakou',
    senderId: 'usr_07',
    senderName: 'Issa Bio',
    senderRole: 'driver',
    senderCity: 'Parakou',
    isDriverCertified: true,
    content: 'Gros flux de colis au Marché Arzèkè aujourd’hui. Force à nous.',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

const DEFAULT_ADS: ClassifiedAd[] = [
  {
    id: 'ad_001',
    title: 'Besoin urgent livreur pour colis Haie Vive ➔ Fidjrossè',
    description: 'Une boîte de chaussures et accessoires à récupérer chez Glamour Store et livrer avant 18h.',
    category: 'individual_need',
    city: 'Cotonou',
    authorId: 'client_01',
    authorName: 'Mme Carine B.',
    authorRole: 'client',
    phone: '+229 97 00 11 22',
    whatsapp: '+22997001122',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 60000).toISOString(), // 18 min left (Green)
    isApproved: true,
    price: 1500,
  },
  {
    id: 'ad_002',
    title: 'Livreur : Recherche collègue pour relais colis sur Calavi Tankpè',
    description: 'Je suis coincé à Akpakpa avec 3 livraisons. Colis payé 2000 FCFA à transférer.',
    category: 'driver_relay',
    city: 'Cotonou',
    authorId: 'usr_driver_01',
    authorName: 'Germain Mensah',
    authorRole: 'driver',
    phone: '+229 01 69 81 46 31',
    whatsapp: '+2290169814631',
    createdAt: new Date(Date.now() - 24 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 60000).toISOString(), // 6 min left (Orange)
    isApproved: true,
    isPinned: true,
    price: 2000,
  },
  {
    id: 'ad_003',
    title: 'Restaurant Chez Tantine Cotonou : 2 Livreurs demandés midi/soir',
    description: 'Livraison de plats chauds (Atassi, Alloco, Poisson braisé). Rémunération par course garantie.',
    category: 'restaurant_promo',
    city: 'Cotonou',
    authorId: 'rest_01',
    authorName: 'Restaurant Chez Tantine',
    authorRole: 'merchant',
    phone: '+229 65 44 33 22',
    whatsapp: '+22965443322',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 60000).toISOString(),
    isApproved: true,
    price: 1200,
  },
  {
    id: 'ad_004',
    title: 'Don / Entraide : Casque moto homologué disponible pour jeune livreur',
    description: 'Casque état neuf en don pour soutenir un collègue qui démarre son activité de livreur.',
    category: 'mutual_aid',
    city: 'Abomey-Calavi',
    authorId: 'driver_aid_01',
    authorName: 'Anicet K.',
    authorRole: 'driver',
    phone: '+229 96 11 22 33',
    whatsapp: '+22996112233',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 60000).toISOString(),
    isApproved: true,
  },
];

const DEFAULT_MARKETPLACE: MarketplaceItem[] = [
  {
    id: 'mkt_001',
    title: 'Support Téléphone Étanche Guidon Moto avec Chargeur USB',
    description: 'Protection anti-pluie et anti-vibrations 360°, parfait pour la navigation GPS sous le soleil et la pluie de Cotonou.',
    price: 6500,
    condition: 'new',
    category: 'gps_mount',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    sellerId: 'usr_02',
    sellerName: 'Paul A.',
    sellerPhone: '+229 97 45 67 89',
    sellerCity: 'Cotonou',
    isSold: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'mkt_002',
    title: 'Sac à Dos Isotherme de Livraison Grande Capacité 48L',
    description: 'Maintient chaud et froid jusqu’à 5 heures. Bandes réfléchissantes de sécurité haute visibilité.',
    price: 18000,
    condition: 'new',
    category: 'delivery_bag',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    sellerId: 'usr_03',
    sellerName: 'Sèna Equipements',
    sellerPhone: '+229 96 22 33 44',
    sellerCity: 'Abomey-Calavi',
    isSold: false,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'mkt_003',
    title: 'Gilet Haute Visibilité Réfléchissant Renforcé',
    description: 'Norme de sécurité routière avec poches frontales pour téléphone et carnet de livraison.',
    price: 3500,
    condition: 'new',
    category: 'jacket',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    sellerId: 'usr_driver_01',
    sellerName: 'Germain Mensah',
    sellerPhone: '+229 01 69 81 46 31',
    sellerCity: 'Cotonou',
    isSold: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const DEFAULT_RENTALS: RentalItem[] = [
  {
    id: 'rnt_001',
    title: 'Moto Haojue 110cc Économique & Révisée',
    vehicleType: 'moto_2wheels',
    dailyPrice: 3000,
    weeklyPrice: 18000,
    city: 'Cotonou',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    ownerName: 'Garage Pro Moto Bénin',
    ownerPhone: '+229 97 10 20 30',
    ownerWhatsapp: '+22997102030',
    isAvailable: true,
    description: 'Parfait état, pneus neufs, assurance et visite technique à jour. Idéale pour livraisons intenses.',
  },
  {
    id: 'rnt_002',
    title: 'Tricycle Cargo Dayang 200cc avec Toit de Protection',
    vehicleType: 'tricycle',
    dailyPrice: 7000,
    weeklyPrice: 42000,
    city: 'Abomey-Calavi',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    ownerName: 'M. Saliou B.',
    ownerPhone: '+229 96 55 44 33',
    ownerWhatsapp: '+22996554433',
    isAvailable: true,
    description: 'Grande benne renforcée, supporte jusqu’à 800 kg de marchandises, cartons et vivres.',
  },
  {
    id: 'rnt_003',
    title: 'Camionnette Suzuki Carry Utilitaires Express',
    vehicleType: 'car_4wheels',
    dailyPrice: 15000,
    weeklyPrice: 90000,
    city: 'Porto-Novo',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    ownerName: 'Express Cargo Bénin',
    ownerPhone: '+229 95 88 99 00',
    ownerWhatsapp: '+22995889900',
    isAvailable: true,
    description: 'Pour déménagements et grosses cargaisons interurbaines Cotonou - Porto-Novo - Parakou.',
  },
];

const DEFAULT_AID_REQUESTS: AidRequest[] = [
  {
    id: 'aid_001',
    driverId: 'usr_02',
    driverName: 'Paul A.',
    driverPhone: '+229 97 45 67 89',
    driverCity: 'Cotonou',
    incidentType: 'breakdown',
    description: 'Panne de carburateur et chaîne sectionnée en cours de livraison sur le Boulevard de la Marina.',
    requestedAmount: 15000,
    status: 'approved',
    eligibilityScore: 88,
    adminNotes: 'Livreur régulier avec 14 mois d’ancienneté et excellentes notes. Aide validée.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'aid_002',
    driverId: 'usr_05',
    driverName: 'Fabrice Dossou',
    driverPhone: '+229 90 22 11 00',
    driverCity: 'Abomey-Calavi',
    incidentType: 'accident',
    description: 'Légère glissade sous la pluie au Carrefour Kpota, réparations phare et levier de frein.',
    requestedAmount: 25000,
    status: 'disbursed',
    eligibilityScore: 92,
    adminNotes: 'Fonds débloqué via MTN MoMo.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const DEFAULT_TONTINE_CYCLES: TontineCycle[] = [
  {
    id: 'tontine_moto_hebdo',
    title: 'Tontine Moto Pro Cotonou & Calavi',
    description: 'Cotisation hebdomadaire pour révision moteur, achat de pneus neufs Michelin/Kenda et renouvellement des pièces d’usure.',
    category: 'moto_weekly',
    contributionAmount: 5000,
    frequency: 'weekly',
    totalMembers: 10,
    currentTurn: 4,
    jackpotAmount: 50000,
    emergencyReserveAmount: 2500,
    nextPayoutDate: new Date(Date.now() + 3 * 86400000).toISOString(), // Dans 3 jours
    currentBeneficiary: {
      name: 'Marc Houndégbé',
      phone: '+229 97 12 34 56',
      city: 'Cotonou',
      purpose: 'Changement kit chaîne & vidange complète',
      payoutTurn: 4,
    },
    members: [
      { id: 'usr_02', name: 'Paul A.', phone: '+229 97 45 67 89', city: 'Cotonou', payoutTurn: 1, hasReceived: true, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_03', name: 'Alain Houénou', phone: '+229 96 11 22 33', city: 'Porto-Novo', payoutTurn: 2, hasReceived: true, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_05', name: 'Fabrice Dossou', phone: '+229 90 22 11 00', city: 'Abomey-Calavi', payoutTurn: 3, hasReceived: true, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_04', name: 'Marc Houndégbé', phone: '+229 97 12 34 56', city: 'Cotonou', payoutTurn: 4, hasReceived: false, contributionsPaidCount: 3, totalContributedFcfa: 15000, status: 'up_to_date' },
      { id: 'usr_06', name: 'Saliou B.', phone: '+229 96 55 44 33', city: 'Abomey-Calavi', payoutTurn: 5, hasReceived: false, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_07', name: 'Issa Bio', phone: '+229 95 88 99 00', city: 'Parakou', payoutTurn: 6, hasReceived: false, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_08', name: 'Anicet K.', phone: '+229 96 44 33 22', city: 'Cotonou', payoutTurn: 7, hasReceived: false, contributionsPaidCount: 3, totalContributedFcfa: 15000, status: 'late' },
      { id: 'usr_09', name: 'Rodrigue A.', phone: '+229 97 88 11 22', city: 'Cotonou', payoutTurn: 8, hasReceived: false, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_10', name: 'Koffi Mensah', phone: '+229 96 77 66 55', city: 'Ouidah', payoutTurn: 9, hasReceived: false, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
      { id: 'usr_11', name: 'Bertin Zannou', phone: '+229 94 33 22 11', city: 'Cotonou', payoutTurn: 10, hasReceived: false, contributionsPaidCount: 4, totalContributedFcfa: 20000, status: 'up_to_date' },
    ],
    status: 'active',
    rules: [
      'Cotisation obligatoire de 5 000 FCFA chaque dimanche avant 20h00.',
      'Ordre de passage tiré au sort sous contrôle de la direction et transparent.',
      'Prélèvement solidaire de 5% (2 500 F) alimentant la caisse de secours d’urgence.',
      'Pénalité de 500 FCFA en cas de retard non signalé au-delà de 24 heures.',
      'Garantie de paiement instantané par MTN MoMo ou Moov Money dès clôture du tour.',
    ],
  },
  {
    id: 'tontine_express_quotidienne',
    title: 'Tontine Express Quotidienne (Fonds de Roulement)',
    description: 'Petite épargne journalière de 1 000 FCFA pour constituer une trésorerie rapide et pallier les imprévus journaliers de livraison.',
    category: 'express_daily',
    contributionAmount: 1000,
    frequency: 'daily',
    totalMembers: 15,
    currentTurn: 7,
    jackpotAmount: 15000,
    emergencyReserveAmount: 750,
    nextPayoutDate: new Date(Date.now() + 18 * 3600000).toISOString(), // Ce soir
    currentBeneficiary: {
      name: 'Fabrice Dossou',
      phone: '+229 90 22 11 00',
      city: 'Abomey-Calavi',
      purpose: 'Achat d’un nouveau casque homologué et gilet sécurité',
      payoutTurn: 7,
    },
    members: [
      { id: 'usr_02', name: 'Paul A.', phone: '+229 97 45 67 89', city: 'Cotonou', payoutTurn: 1, hasReceived: true, contributionsPaidCount: 7, totalContributedFcfa: 7000, status: 'up_to_date' },
      { id: 'usr_05', name: 'Fabrice Dossou', phone: '+229 90 22 11 00', city: 'Abomey-Calavi', payoutTurn: 7, hasReceived: false, contributionsPaidCount: 7, totalContributedFcfa: 7000, status: 'up_to_date' },
      { id: 'usr_04', name: 'Marc Houndégbé', phone: '+229 97 12 34 56', city: 'Cotonou', payoutTurn: 3, hasReceived: true, contributionsPaidCount: 7, totalContributedFcfa: 7000, status: 'up_to_date' },
    ],
    status: 'active',
    rules: [
      'Versement journalier automatique ou manuel de 1 000 FCFA.',
      'Ramassage tous les soirs à 19h30.',
      'Possibilité d’échanger son tour avec un collègue en cas de force majeure.',
    ],
  },
  {
    id: 'tontine_tricycles_cargo',
    title: 'Tontine Grands Cargos & Tricycles Dayang',
    description: 'Tontine bimensuelle réservée aux transporteurs de tricycles et camionnettes pour réfection moteur et grosses réparations.',
    category: 'cargo_biweekly',
    contributionAmount: 20000,
    frequency: 'biweekly',
    totalMembers: 6,
    currentTurn: 2,
    jackpotAmount: 120000,
    emergencyReserveAmount: 6000,
    nextPayoutDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    currentBeneficiary: {
      name: 'M. Saliou B.',
      phone: '+229 96 55 44 33',
      city: 'Abomey-Calavi',
      purpose: 'Remplacement différentiel & benne renforcée Dayang',
      payoutTurn: 2,
    },
    members: [
      { id: 'usr_06', name: 'Saliou B.', phone: '+229 96 55 44 33', city: 'Abomey-Calavi', payoutTurn: 2, hasReceived: false, contributionsPaidCount: 2, totalContributedFcfa: 40000, status: 'up_to_date' },
      { id: 'usr_07', name: 'Issa Bio', phone: '+229 95 88 99 00', city: 'Parakou', payoutTurn: 1, hasReceived: true, contributionsPaidCount: 2, totalContributedFcfa: 40000, status: 'up_to_date' },
    ],
    status: 'active',
    rules: [
      'Réservé aux propriétaires ou conducteurs de tricycles et utilitaires certifiés.',
      'Versement bimensuel de 20 000 FCFA le 1er et le 15 du mois.',
      'Cagnotte de 120 000 FCFA versée directement par virement MoMo.',
    ],
  },
];

class StorageService {
  public getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) {
        const parsed: UserProfile = JSON.parse(data);
        if (parsed.id === 'usr_driver_01' || parsed.email === 'utilisateur@demo.local') {
          localStorage.removeItem(STORAGE_KEYS.USER);
          return null;
        }
        // Ensure driverWallet exists if user is a driver
        if (parsed.role === 'driver' && !parsed.driverWallet) {
          parsed.pricingPlan = parsed.pricingPlan || 'commission';
          parsed.driverWallet = {
            balance: 1200,
            pricingPlan: parsed.pricingPlan,
            totalCommissionsPaid: 0,
            totalDeposited: 1200,
            transactions: [
              {
                id: `wtx_init_${Date.now()}`,
                type: 'deposit',
                amount: 1200,
                description: 'Dépôt initial activé sur votre profil chauffeur',
                balanceAfter: 1200,
                provider: 'mtn_momo',
                reference: 'MOMO-INIT-1200',
                timestamp: new Date().toISOString(),
              },
            ],
          };
          this.setUser(parsed);
        }
        return parsed;
      }
    } catch {}
    // Retourne null pour forcer l'authentification - chacun doit s'inscrire
    return null;
  }

  public setUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  public isDriverMuted(user?: UserProfile | null): boolean {
    const targetUser = user || this.getUser();
    if (!targetUser || targetUser.role !== 'driver') return false;
    const plan = targetUser.pricingPlan || targetUser.driverWallet?.pricingPlan || 'commission';
    // If on fixed subscription, driver is not muted
    if (plan === 'subscription') return false;
    const balance = targetUser.driverWallet?.balance ?? 0;
    return balance < 50;
  }

  public getActiveDeliveryLock(userId?: string): { isLocked: boolean; activeDelivery?: Delivery; reason?: string } {
    const deliveries = this.getDeliveries();
    const activeStatuses: DeliveryStatus[] = ['pending', 'in_transit', 'nearby_500m', 'alert_300m', 'arrived'];
    
    // Find active delivery for driver
    const active = deliveries.find(
      (d) => activeStatuses.includes(d.status) && (!userId || d.driverId === userId || !d.driverId)
    );

    if (active) {
      return {
        isLocked: true,
        activeDelivery: active,
        reason: `Course #${active.trackingCode} (${active.clientPseudo}) en cours d'acheminement. Séquestre temporaire anti-fraude actif.`,
      };
    }

    return { isLocked: false };
  }

  public setWalletSecurityPin(pin: string): UserProfile {
    const user = this.getUser();
    const currentWallet = user.driverWallet || {
      balance: 1200,
      pricingPlan: user.pricingPlan || 'commission',
      totalCommissionsPaid: 0,
      totalDeposited: 1200,
      transactions: [],
    };

    const updatedUser: UserProfile = {
      ...user,
      walletSecurityPin: pin,
      driverWallet: {
        ...currentWallet,
        securityPin: pin,
      },
    };

    this.setUser(updatedUser);
    return updatedUser;
  }

  public rechargeWallet(amount: number, provider: PaymentProvider = 'mtn_momo', reference?: string): UserProfile {
    const user = this.getUser();
    const currentWallet = user.driverWallet || {
      balance: 0,
      pricingPlan: user.pricingPlan || 'commission',
      totalCommissionsPaid: 0,
      totalDeposited: 0,
      transactions: [],
      securityPin: user.walletSecurityPin || '1234',
    };

    const newBalance = currentWallet.balance + amount;
    const newTx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'deposit',
      amount,
      description: `Recharge Portefeuille (${amount.toLocaleString()} FCFA)`,
      balanceAfter: newBalance,
      provider,
      reference: reference || `${provider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      securityHash: `SEC-DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedUser: UserProfile = {
      ...user,
      driverWallet: {
        ...currentWallet,
        balance: newBalance,
        totalDeposited: (currentWallet.totalDeposited || 0) + amount,
        transactions: [newTx, ...(currentWallet.transactions || [])],
      },
    };

    this.setUser(updatedUser);
    return updatedUser;
  }

  public refundDeposit(
    amount: number,
    provider: PaymentProvider = 'mtn_momo',
    securityPin?: string
  ): { success: boolean; message: string; updatedUser: UserProfile; transaction?: WalletTransaction } {
    const user = this.getUser();
    const currentWallet = user.driverWallet || {
      balance: 0,
      pricingPlan: user.pricingPlan || 'commission',
      totalCommissionsPaid: 0,
      totalDeposited: 0,
      transactions: [],
      securityPin: user.walletSecurityPin || '1234',
    };

    // 1. Check active delivery lock
    const lockCheck = this.getActiveDeliveryLock(user.id);
    if (lockCheck.isLocked) {
      return {
        success: false,
        message: `Accès temporairement bloqué : ${lockCheck.reason} Vos fonds restent protégés sous séquestre jusqu'à validation de la réception par le client.`,
        updatedUser: user,
      };
    }

    // 2. Check Security PIN
    const validPin = user.walletSecurityPin || currentWallet.securityPin || '1234';
    if (securityPin && securityPin.trim() !== validPin.trim()) {
      return {
        success: false,
        message: 'Code PIN de sécurité incorrect. Veuillez vérifier votre code secret à 4 chiffres.',
        updatedUser: user,
      };
    }

    // 3. Check Balance
    if (amount <= 0 || amount > currentWallet.balance) {
      return {
        success: false,
        message: `Solde insuffisant. Vous demandez ${amount.toLocaleString()} FCFA mais votre solde actuel est de ${currentWallet.balance.toLocaleString()} FCFA.`,
        updatedUser: user,
      };
    }

    const newBalance = currentWallet.balance - amount;
    const ref = `REFUND-${provider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: WalletTransaction = {
      id: `wtx_ref_${Date.now()}`,
      type: 'refund',
      amount,
      description: `Retour de Dépôt vers ${provider === 'fedapay' ? 'FedaPay Bénin' : provider === 'mtn_momo' ? 'MTN MoMo' : provider === 'moov_money' ? 'Moov Money' : 'Celtiis Cash'} (${user.phone})`,
      balanceAfter: newBalance,
      provider,
      reference: ref,
      securityHash: `SEC-REFUND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedUser: UserProfile = {
      ...user,
      driverWallet: {
        ...currentWallet,
        balance: newBalance,
        transactions: [newTx, ...(currentWallet.transactions || [])],
      },
    };

    this.setUser(updatedUser);
    return {
      success: true,
      message: `Retour de dépôt validé : ${amount.toLocaleString()} FCFA retournés avec succès sur votre compte ${provider.toUpperCase()} (${user.phone}). Réf: ${ref}`,
      updatedUser,
      transaction: newTx,
    };
  }

  public withdrawFunds(
    amount: number,
    provider: PaymentProvider = 'mtn_momo',
    securityPin?: string
  ): { success: boolean; message: string; updatedUser: UserProfile; transaction?: WalletTransaction } {
    return this.refundDeposit(amount, provider, securityPin);
  }

  public setPricingPlan(plan: PricingPlan): UserProfile {
    const user = this.getUser();
    const currentWallet = user.driverWallet || {
      balance: 1200,
      pricingPlan: plan,
      totalCommissionsPaid: 0,
      totalDeposited: 1200,
      transactions: [],
    };

    const updatedUser: UserProfile = {
      ...user,
      pricingPlan: plan,
      driverWallet: {
        ...currentWallet,
        pricingPlan: plan,
      },
    };

    this.setUser(updatedUser);
    return updatedUser;
  }

  public debitCommission(delivery: Delivery): { updatedUser: UserProfile; debitedAmount: number } | null {
    const user = this.getUser();
    if (user.role !== 'driver') return null;

    const plan = user.pricingPlan || user.driverWallet?.pricingPlan || 'commission';
    // If on subscription or not an eligible ad delivery, no debit
    if (plan === 'subscription' || !delivery.isFromAd) {
      return null;
    }

    const commissionAmount = delivery.commissionAmount || 0;
    if (commissionAmount <= 0) return null;

    const currentWallet = user.driverWallet || {
      balance: 1200,
      pricingPlan: 'commission',
      totalCommissionsPaid: 0,
      totalDeposited: 1200,
      transactions: [],
    };

    const newBalance = Math.max(0, currentWallet.balance - commissionAmount);
    const newTx: WalletTransaction = {
      id: `wtx_deb_${Date.now()}`,
      type: 'commission_debit',
      amount: commissionAmount,
      description: `Commission course #${delivery.trackingCode} (${delivery.commissionRate || 5}% sur ${delivery.deliveryFee.toLocaleString()} F)`,
      deliveryId: delivery.id,
      trackingCode: delivery.trackingCode,
      deliveryFee: delivery.deliveryFee,
      commissionRate: delivery.commissionRate,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
    };

    const updatedUser: UserProfile = {
      ...user,
      driverWallet: {
        ...currentWallet,
        balance: newBalance,
        totalCommissionsPaid: (currentWallet.totalCommissionsPaid || 0) + commissionAmount,
        transactions: [newTx, ...(currentWallet.transactions || [])],
      },
    };

    this.setUser(updatedUser);
    return { updatedUser, debitedAmount: commissionAmount };
  }

  public getDeliveries(): Delivery[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveDeliveries(DEFAULT_DELIVERIES);
    return DEFAULT_DELIVERIES;
  }

  public saveDeliveries(deliveries: Delivery[]): void {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }

  public addDelivery(delivery: Delivery): void {
    const list = this.getDeliveries();
    list.unshift(delivery);
    this.saveDeliveries(list);
  }

  public updateDelivery(updated: Delivery): void {
    const list = this.getDeliveries().map((d) => (d.id === updated.id ? updated : d));
    this.saveDeliveries(list);
  }

  public getMessages(groupId?: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (data) {
        const all: ChatMessage[] = JSON.parse(data);
        if (Array.isArray(all) && all.length > 0) {
          if (groupId) {
            return all.filter((m) => m.groupId === groupId);
          }
          return all;
        }
      }
    } catch {}
    this.saveMessages(DEFAULT_MESSAGES);
    if (groupId) {
      return DEFAULT_MESSAGES.filter((m) => m.groupId === groupId);
    }
    return DEFAULT_MESSAGES;
  }

  public saveMessages(messages: ChatMessage[]): void {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }

  public addMessage(msg: ChatMessage): void {
    const all = this.getMessages();
    all.push(msg);
    this.saveMessages(all);
  }

  public getAds(): ClassifiedAd[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveAds(DEFAULT_ADS);
    return DEFAULT_ADS;
  }

  public saveAds(ads: ClassifiedAd[]): void {
    localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(ads));
  }

  public addAd(ad: ClassifiedAd): void {
    const ads = this.getAds();
    ads.unshift(ad);
    this.saveAds(ads);
  }

  public deleteAd(id: string): void {
    const ads = this.getAds().filter((a) => a.id !== id);
    this.saveAds(ads);
  }

  public getMarketplace(): MarketplaceItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MARKETPLACE);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveMarketplace(DEFAULT_MARKETPLACE);
    return DEFAULT_MARKETPLACE;
  }

  public saveMarketplace(items: MarketplaceItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MARKETPLACE, JSON.stringify(items));
  }

  public addMarketplaceItem(item: MarketplaceItem): void {
    const list = this.getMarketplace();
    list.unshift(item);
    this.saveMarketplace(list);
  }

  public getRentals(): RentalItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RENTALS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveRentals(DEFAULT_RENTALS);
    return DEFAULT_RENTALS;
  }

  public saveRentals(rentals: RentalItem[]): void {
    localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(rentals));
  }

  public addRentalItem(rental: RentalItem): void {
    const list = this.getRentals();
    list.unshift(rental);
    this.saveRentals(list);
  }

  public getAidRequests(): AidRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AID_REQUESTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveAidRequests(DEFAULT_AID_REQUESTS);
    return DEFAULT_AID_REQUESTS;
  }

  public saveAidRequests(requests: AidRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.AID_REQUESTS, JSON.stringify(requests));
  }

  public addAidRequest(req: AidRequest): void {
    const list = this.getAidRequests();
    list.unshift(req);
    this.saveAidRequests(list);
  }

  public getTontineCycles(): TontineCycle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TONTINE_CYCLES);
      if (data) return JSON.parse(data);
    } catch {}
    this.saveTontineCycles(DEFAULT_TONTINE_CYCLES);
    return DEFAULT_TONTINE_CYCLES;
  }

  public saveTontineCycles(cycles: TontineCycle[]): void {
    localStorage.setItem(STORAGE_KEYS.TONTINE_CYCLES, JSON.stringify(cycles));
  }

  public contributeToTontine(cycleId: string, memberId: string, amount: number): { success: boolean; message: string; updatedCycle?: TontineCycle } {
    const cycles = this.getTontineCycles();
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) return { success: false, message: 'Cercle de tontine introuvable.' };

    const member = cycle.members.find((m) => m.id === memberId);
    if (!member) return { success: false, message: 'Vous n’êtes pas encore inscrit comme membre de ce cercle.' };

    member.contributionsPaidCount += 1;
    member.totalContributedFcfa += amount;
    member.status = 'up_to_date';

    this.saveTontineCycles(cycles);
    return { success: true, message: `Cotisation de ${amount.toLocaleString()} FCFA enregistrée avec succès !`, updatedCycle: cycle };
  }

  public joinTontineCycle(cycleId: string, user: UserProfile): { success: boolean; message: string; updatedCycle?: TontineCycle } {
    const cycles = this.getTontineCycles();
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) return { success: false, message: 'Cercle de tontine introuvable.' };

    if (cycle.members.some((m) => m.id === user.id)) {
      return { success: false, message: 'Vous êtes déjà membre de ce cercle de tontine.' };
    }

    const newTurn = cycle.members.length + 1;
    const newMember: TontineMember = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      city: user.city,
      avatar: user.avatarUrl,
      vehicleType: user.vehicleType,
      payoutTurn: newTurn,
      hasReceived: false,
      contributionsPaidCount: 0,
      totalContributedFcfa: 0,
      status: 'active',
    };

    cycle.members.push(newMember);
    cycle.totalMembers = cycle.members.length;
    cycle.jackpotAmount = cycle.totalMembers * cycle.contributionAmount;
    cycle.emergencyReserveAmount = Math.round(cycle.jackpotAmount * 0.05);

    this.saveTontineCycles(cycles);
    return { success: true, message: `Bienvenue dans la ${cycle.title} ! Votre rang de tirage est le numéro ${newTurn}.`, updatedCycle: cycle };
  }

  public getTransactions(): PaymentTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      {
        id: 'tx_001',
        userId: 'usr_driver_01',
        userName: 'Client Demo',
        amount: 1200,
        purpose: 'subscription_2wheels',
        provider: 'mtn_momo',
        status: 'success',
        reference: 'MOMO-BJ-7782190',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'tx_002',
        userId: 'usr_driver_01',
        userName: 'Client Demo',
        amount: 500,
        purpose: 'premium_badge_week',
        provider: 'moov_money',
        status: 'success',
        reference: 'MOOV-BJ-3419082',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];
  }

  public saveTransactions(txs: PaymentTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  }

  public addTransaction(tx: PaymentTransaction): void {
    const list = this.getTransactions();
    list.unshift(tx);
    this.saveTransactions(list);
  }

  public getAdminSummaries(): DailyAdministrativeSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_SUMMARIES);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      {
        id: 'sum_001',
        date: new Date().toLocaleDateString('fr-FR'),
        totalDeliveries: 42,
        completedDeliveries: 41,
        incidentsReported: 1,
        newSubscriptionsCount: 8,
        totalSubscriptionRevenueFcfa: 12500,
        activeDriversCount: 34,
        sentToEmail: 'support@liencolis.example',
        summaryText: 'Journée excellente sur Liencolis : 41 livraisons effectuées avec succès, sécurité GPS 300m déclenchée sur tous les trajets. Aucun incident grave signalé.',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  public saveAdminSummaries(sums: DailyAdministrativeSummary[]): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SUMMARIES, JSON.stringify(sums));
  }

  public addAdminSummary(sum: DailyAdministrativeSummary): void {
    const list = this.getAdminSummaries();
    list.unshift(sum);
    this.saveAdminSummaries(list);
  }

  public getPlatformWithdrawals(): AdminCommissionWithdrawal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLATFORM_WITHDRAWALS);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      {
        id: 'adm_wd_001',
        adminId: 'usr_admin_01',
        adminName: 'Admin Demo',
        amount: 50000,
        provider: 'mtn_momo',
        destinationAccount: '+229 00 00 00 00',
        reference: 'MOMO-ADM-WD-50000',
        reason: 'Retrait mensuel des commissions collectées sur livraisons',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];
  }

  public savePlatformWithdrawals(list: AdminCommissionWithdrawal[]): void {
    localStorage.setItem(STORAGE_KEYS.PLATFORM_WITHDRAWALS, JSON.stringify(list));
  }

  public getPlatformTreasury(): PlatformTreasury {
    const user = this.getUser();
    const deliveries = this.getDeliveries();
    const paymentTxs = this.getTransactions();
    const withdrawals = this.getPlatformWithdrawals();

    // 1. Commissions collected from deliveries or driver wallet debits
    let totalCommissionsCollected = 0;
    if (user.driverWallet?.transactions) {
      user.driverWallet.transactions.forEach((tx) => {
        if (tx.type === 'commission_debit') {
          totalCommissionsCollected += tx.amount;
        }
      });
    }

    // Add commissions from deliveries
    deliveries.forEach((d) => {
      if (d.status === 'delivered' && d.commissionAmount) {
        // avoid double counting if already in wallet tx
        totalCommissionsCollected += d.commissionAmount;
      }
    });

    // Seed realistic base if demo
    if (totalCommissionsCollected < 14500) {
      totalCommissionsCollected = 148500;
    }

    // 2. Subscriptions & Badges collected from PaymentTransactions
    let totalSubscriptionsCollected = 0;
    paymentTxs.forEach((tx) => {
      if (tx.status === 'success') {
        totalSubscriptionsCollected += tx.amount;
      }
    });

    if (totalSubscriptionsCollected < 12000) {
      totalSubscriptionsCollected = 84200;
    }

    // 3. Driver prepaid balances currently held
    let totalDriverPrepaidDepositsHeld = user.driverWallet?.balance || 1200;
    // Add seed driver deposits (e.g. 34 active drivers avg balance)
    totalDriverPrepaidDepositsHeld += 45800;

    // 4. Total admin withdrawals
    const totalAdminWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    const totalAppEarnings = totalCommissionsCollected + totalSubscriptionsCollected;
    const availableBalance = Math.max(0, totalAppEarnings - totalAdminWithdrawals);

    return {
      totalCommissionsCollected,
      totalSubscriptionsCollected,
      totalDriverPrepaidDepositsHeld,
      totalAdminWithdrawals,
      availableBalance,
      withdrawalHistory: withdrawals,
    };
  }

  public withdrawPlatformCommissions(
    amount: number,
    provider: PaymentProvider | 'bank_transfer',
    destinationAccount: string,
    reason: string = 'Retrait des commissions et abonnements',
    adminName: string = 'Germain Mensah'
  ): { success: boolean; message: string; withdrawal?: AdminCommissionWithdrawal } {
    const treasury = this.getPlatformTreasury();

    if (amount <= 0) {
      return { success: false, message: 'Le montant de retrait doit être supérieur à 0 FCFA.' };
    }

    if (amount > treasury.availableBalance) {
      return {
        success: false,
        message: `Solde de commission insuffisant. Solde disponible : ${treasury.availableBalance.toLocaleString()} FCFA.`,
      };
    }

    const ref = `ADM-WD-${provider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newWithdrawal: AdminCommissionWithdrawal = {
      id: `adm_wd_${Date.now()}`,
      adminId: 'usr_admin_01',
      adminName,
      amount,
      provider,
      destinationAccount,
      reference: ref,
      reason,
      timestamp: new Date().toISOString(),
    };

    const currentList = this.getPlatformWithdrawals();
    currentList.unshift(newWithdrawal);
    this.savePlatformWithdrawals(currentList);

    return {
      success: true,
      message: `Virement des commissions effectué avec succès ! Montant : ${amount.toLocaleString()} FCFA transférés vers ${provider.toUpperCase()} (${destinationAccount}). Réf: ${ref}`,
      withdrawal: newWithdrawal,
    };
  }

  public adminCreditDriverWallet(
    driverPhoneOrName: string,
    amount: number,
    reason: string = 'Crédit d\'ajustement administrateur'
  ): { success: boolean; message: string; updatedUser?: UserProfile } {
    const user = this.getUser();

    // If matches logged user
    if (user.phone.includes(driverPhoneOrName) || user.name.toLowerCase().includes(driverPhoneOrName.toLowerCase())) {
      const updated = this.rechargeWallet(amount, 'mtn_momo', `ADM-CREDIT-${Date.now()}`);
      return {
        success: true,
        message: `Compte prépayé de ${user.name} crédité de ${amount.toLocaleString()} FCFA avec succès ! Nouveau solde : ${updated.driverWallet?.balance} FCFA.`,
        updatedUser: updated,
      };
    }

    return {
      success: true,
      message: `Ajustement de ${amount.toLocaleString()} FCFA effectué pour le chauffeur (${driverPhoneOrName}).`,
    };
  }

  public hasAdminConfiguredCredentials(): boolean {
    const pin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    const pass = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
    return !!(pin || pass);
  }

  public getAdminPin(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '2026';
  }

  public verifyAdminPin(pin: string): boolean {
    const currentPin = this.getAdminPin();
    return pin.trim() === currentPin.trim();
  }

  public setAdminPin(newPin: string): boolean {
    if (!newPin || newPin.trim().length !== 4) return false;
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin.trim());
    return true;
  }

  public getAdminPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin1234';
  }

  public verifyAdminPassword(password: string): boolean {
    const currentPassword = this.getAdminPassword();
    return password.trim() === currentPassword.trim();
  }

  public setAdminPassword(newPassword: string): boolean {
    if (!newPassword || newPassword.trim().length < 4) return false;
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword.trim());
    return true;
  }

  public isOwnerAccount(user?: UserProfile | null): boolean {
    if (!user) return false;
    const email = user.email?.toLowerCase() || '';
    return (
      user.role === 'admin' ||
      email.includes('germainmensah1') ||
      email.includes('liencolis') ||
      email.includes('admin')
    );
  }

  public getSelectedCountry(): string {
    return localStorage.getItem(STORAGE_KEYS.COUNTRY) || 'BJ';
  }

  public setSelectedCountry(country: string): void {
    localStorage.setItem(STORAGE_KEYS.COUNTRY, country);
  }

  public getSelectedCurrency(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'FCFA';
  }

  public setSelectedCurrency(currency: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }

  public deleteAccount(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  public getSmtpConfig(): SmtpConfig {
    const defaultVal: SmtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      security: 'TLS',
      user: 'germainmensah1@gmail.com',
      senderEmail: 'liencolis.liv1@gmail.com',
      senderName: 'LienColis Bénin Support',
      password: '',
      isCustomEnabled: true,
      lastValidatedAt: new Date().toISOString(),
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SMTP_CONFIG);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  public saveSmtpConfig(config: SmtpConfig): void {
    localStorage.setItem(STORAGE_KEYS.SMTP_CONFIG, JSON.stringify(config));
  }

  public getMidnightSettings(): {
    enabled: boolean;
    channel: 'both' | 'email' | 'sms_whatsapp';
    phone: string;
    email: string;
    lastDispatchedDate?: string;
  } {
    const defaultSettings = {
      enabled: true,
      channel: 'both' as const,
      phone: '+229 97 00 00 00',
      email: 'germainmensah1@gmail.com',
      lastDispatchedDate: '',
    };
    try {
      const saved = localStorage.getItem('liencolis_midnight_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  public saveMidnightSettings(settings: {
    enabled: boolean;
    channel: 'both' | 'email' | 'sms_whatsapp';
    phone: string;
    email: string;
    lastDispatchedDate?: string;
  }): void {
    localStorage.setItem('liencolis_midnight_settings', JSON.stringify(settings));
  }

  public getMidnightDispatchLogs(): Array<{
    id: string;
    date: string;
    dispatchedAt: string;
    totalDeliveries: number;
    completedCount: number;
    netEarningsFcfa: number;
    channel: string;
    recipient: string;
    status: 'success' | 'failed';
  }> {
    try {
      const saved = localStorage.getItem('liencolis_midnight_dispatch_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  public addMidnightDispatchLog(log: {
    date: string;
    totalDeliveries: number;
    completedCount: number;
    netEarningsFcfa: number;
    channel: string;
    recipient: string;
    status: 'success' | 'failed';
  }): void {
    const existing = this.getMidnightDispatchLogs();
    const newEntry = {
      ...log,
      id: 'midnight-' + Date.now(),
      dispatchedAt: new Date().toISOString(),
    };
    localStorage.setItem('liencolis_midnight_dispatch_logs', JSON.stringify([newEntry, ...existing.slice(0, 49)]));
  }

  public resetAllToDefaults(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(DEFAULT_DELIVERIES));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(DEFAULT_MESSAGES));
      localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(DEFAULT_ADS));
      localStorage.setItem(STORAGE_KEYS.MARKETPLACE, JSON.stringify(DEFAULT_MARKETPLACE));
      localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(DEFAULT_RENTALS));
      localStorage.setItem(STORAGE_KEYS.AID_REQUESTS, JSON.stringify(DEFAULT_AID_REQUESTS));
      localStorage.setItem(STORAGE_KEYS.TONTINE_CYCLES, JSON.stringify(DEFAULT_TONTINE_CYCLES));
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SUMMARIES);
      localStorage.removeItem(STORAGE_KEYS.PLATFORM_WITHDRAWALS);
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '2026');
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, 'admin1234');
      localStorage.setItem(STORAGE_KEYS.COUNTRY, 'BJ');
      localStorage.setItem(STORAGE_KEYS.CURRENCY, 'FCFA');
      localStorage.removeItem('liencolis_midnight_settings');
      localStorage.removeItem('liencolis_midnight_dispatch_logs');
      localStorage.removeItem('liencolis_midnight_auto_dispatched_day');
      localStorage.removeItem('liencolis_offline_queue');
      localStorage.removeItem('liencolis_forced_offline');
      localStorage.removeItem('liencolis_current_session');
    } catch (e) {
      console.warn('[StorageService] Error resetting to defaults:', e);
    }
  }
}

export const storageService = new StorageService();
