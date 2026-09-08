export interface BeninCity {
  id: string;
  name: string;
  department: string;
  lat: number;
  lng: number;
  isMajor: boolean;
}

export const ALL_BENIN_CITIES: BeninCity[] = [
  // Littoral
  { id: 'cotonou', name: 'Cotonou', department: 'Littoral', lat: 6.3703, lng: 2.4183, isMajor: true },

  // Atlantique
  { id: 'abomey_calavi', name: 'Abomey-Calavi', department: 'Atlantique', lat: 6.4482, lng: 2.3557, isMajor: true },
  { id: 'ouidah', name: 'Ouidah', department: 'Atlantique', lat: 6.3631, lng: 2.0853, isMajor: true },
  { id: 'allada', name: 'Allada', department: 'Atlantique', lat: 6.6653, lng: 2.1514, isMajor: true },
  { id: 'kpomasse', name: 'Kpomassè', department: 'Atlantique', lat: 6.4021, lng: 2.0321, isMajor: false },
  { id: 'tori_bossito', name: 'Tori-Bossito', department: 'Atlantique', lat: 6.5000, lng: 2.1500, isMajor: false },
  { id: 'so_ava', name: 'Sô-Ava', department: 'Atlantique', lat: 6.4667, lng: 2.4167, isMajor: false },
  { id: 'toffo', name: 'Toffo', department: 'Atlantique', lat: 6.8400, lng: 2.0800, isMajor: false },
  { id: 'ze', name: 'Zè', department: 'Atlantique', lat: 6.6167, lng: 2.3167, isMajor: false },

  // Ouémé
  { id: 'porto_novo', name: 'Porto-Novo', department: 'Ouémé', lat: 6.4969, lng: 2.6288, isMajor: true },
  { id: 'seme_kpodji', name: 'Sèmè-Kpodji', department: 'Ouémé', lat: 6.3700, lng: 2.6200, isMajor: true },
  { id: 'adjarra', name: 'Adjarra', department: 'Ouémé', lat: 6.5333, lng: 2.6667, isMajor: false },
  { id: 'adjohoun', name: 'Adjohoun', department: 'Ouémé', lat: 6.7000, lng: 2.4833, isMajor: false },
  { id: 'akpro_misserete', name: 'Akpro-Missérété', department: 'Ouémé', lat: 6.5667, lng: 2.5833, isMajor: false },
  { id: 'avrankou', name: 'Avrankou', department: 'Ouémé', lat: 6.5500, lng: 2.6500, isMajor: false },
  { id: 'bonou', name: 'Bonou', department: 'Ouémé', lat: 6.9000, lng: 2.4667, isMajor: false },
  { id: 'dangbo', name: 'Dangbo', department: 'Ouémé', lat: 6.5833, lng: 2.5500, isMajor: false },

  // Borgou
  { id: 'parakou', name: 'Parakou', department: 'Borgou', lat: 9.3372, lng: 2.6303, isMajor: true },
  { id: 'bembereke', name: 'Bembèrèkè', department: 'Borgou', lat: 10.2283, lng: 2.6633, isMajor: true },
  { id: 'n_dali', name: "N'Dali", department: 'Borgou', lat: 9.8667, lng: 2.7167, isMajor: false },
  { id: 'nikki', name: 'Nikki', department: 'Borgou', lat: 9.9400, lng: 3.2100, isMajor: false },
  { id: 'sinende', name: 'Sinendé', department: 'Borgou', lat: 10.3333, lng: 2.3833, isMajor: false },
  { id: 'tchaourou', name: 'Tchaourou', department: 'Borgou', lat: 8.8833, lng: 2.6000, isMajor: false },
  { id: 'kalale', name: 'Kalalè', department: 'Borgou', lat: 10.3000, lng: 3.3833, isMajor: false },
  { id: 'perere', name: 'Pèrèrè', department: 'Borgou', lat: 9.6167, lng: 2.9167, isMajor: false },

  // Zou
  { id: 'bohicon', name: 'Bohicon', department: 'Zou', lat: 7.1783, lng: 2.0667, isMajor: true },
  { id: 'abomey', name: 'Abomey', department: 'Zou', lat: 7.1829, lng: 1.9912, isMajor: true },
  { id: 'cove', name: 'Covè', department: 'Zou', lat: 7.2209, lng: 2.3408, isMajor: false },
  { id: 'djidja', name: 'Djidja', department: 'Zou', lat: 7.3500, lng: 1.9333, isMajor: false },
  { id: 'za_kpota', name: 'Za-Kpota', department: 'Zou', lat: 7.2333, lng: 2.2500, isMajor: false },
  { id: 'zogbodomey', name: 'Zogbodomey', department: 'Zou', lat: 7.0833, lng: 2.1000, isMajor: false },
  { id: 'agbangnizoun', name: 'Agbangnizoun', department: 'Zou', lat: 7.0833, lng: 1.9167, isMajor: false },
  { id: 'ouuinhi', name: 'Ouinhi', department: 'Zou', lat: 7.0167, lng: 2.4833, isMajor: false },
  { id: 'zagnanado', name: 'Zagnanado', department: 'Zou', lat: 7.2667, lng: 2.3500, isMajor: false },

  // Atacora
  { id: 'natitingou', name: 'Natitingou', department: 'Atacora', lat: 10.3042, lng: 1.3796, isMajor: true },
  { id: 'tanguieta', name: 'Tanguiéta', department: 'Atacora', lat: 10.6167, lng: 1.2667, isMajor: true },
  { id: 'kouande', name: 'Kouandé', department: 'Atacora', lat: 10.3333, lng: 1.6833, isMajor: false },
  { id: 'pehunco', name: 'Péhunco', department: 'Atacora', lat: 10.2333, lng: 2.0000, isMajor: false },
  { id: 'boukoumbe', name: 'Boukoumbé', department: 'Atacora', lat: 10.1833, lng: 1.1000, isMajor: false },
  { id: 'toucountouna', name: 'Toucountouna', department: 'Atacora', lat: 10.4667, lng: 1.3333, isMajor: false },
  { id: 'materi', name: 'Matéri', department: 'Atacora', lat: 10.7000, lng: 1.0667, isMajor: false },
  { id: 'kerou', name: 'Kérou', department: 'Atacora', lat: 10.8333, lng: 2.1167, isMajor: false },
  { id: 'cobly', name: 'Cobly', department: 'Atacora', lat: 10.1667, lng: 0.8833, isMajor: false },

  // Donga
  { id: 'djougou', name: 'Djougou', department: 'Donga', lat: 9.7085, lng: 1.6660, isMajor: true },
  { id: 'bassila', name: 'Bassila', department: 'Donga', lat: 9.0167, lng: 1.6667, isMajor: true },
  { id: 'copargo', name: 'Copargo', department: 'Donga', lat: 9.8333, lng: 1.5500, isMajor: false },
  { id: 'ouake', name: 'Ouaké', department: 'Donga', lat: 9.6667, lng: 1.3833, isMajor: false },

  // Alibori
  { id: 'kandi', name: 'Kandi', department: 'Alibori', lat: 11.1342, lng: 2.9386, isMajor: true },
  { id: 'malanville', name: 'Malanville', department: 'Alibori', lat: 11.8686, lng: 3.3831, isMajor: true },
  { id: 'banikoara', name: 'Banikoara', department: 'Alibori', lat: 11.2985, lng: 2.4386, isMajor: true },
  { id: 'gogounou', name: 'Gogounou', department: 'Alibori', lat: 10.8333, lng: 2.8333, isMajor: false },
  { id: 'segbana', name: 'Segbana', department: 'Alibori', lat: 10.9333, lng: 3.6833, isMajor: false },
  { id: 'karimama', name: 'Karimama', department: 'Alibori', lat: 12.0667, lng: 3.1833, isMajor: false },

  // Collines
  { id: 'dassa_zoume', name: 'Dassa-Zoumè', department: 'Collines', lat: 7.7523, lng: 2.1831, isMajor: true },
  { id: 'savalou', name: 'Savalou', department: 'Collines', lat: 7.9281, lng: 1.9756, isMajor: true },
  { id: 'glazoue', name: 'Glazoué', department: 'Collines', lat: 7.9667, lng: 2.2333, isMajor: true },
  { id: 'bante', name: 'Bantè', department: 'Collines', lat: 8.4167, lng: 1.8833, isMajor: false },
  { id: 'saveni', name: 'Savè', department: 'Collines', lat: 8.0333, lng: 2.4833, isMajor: false },
  { id: 'ouesse', name: 'Ouèssè', department: 'Collines', lat: 8.4833, lng: 2.4333, isMajor: false },

  // Mono
  { id: 'lokossa', name: 'Lokossa', department: 'Mono', lat: 6.6381, lng: 1.7167, isMajor: true },
  { id: 'come', name: 'Comè', department: 'Mono', lat: 6.4000, lng: 1.8833, isMajor: true },
  { id: 'grand_popo', name: 'Grand-Popo', department: 'Mono', lat: 6.2833, lng: 1.8333, isMajor: true },
  { id: 'athieme', name: 'Athiémé', department: 'Mono', lat: 6.5833, lng: 1.6667, isMajor: false },
  { id: 'bopa', name: 'Bopa', department: 'Mono', lat: 6.5833, lng: 1.9500, isMajor: false },
  { id: 'houeyogbe', name: 'Houéyogbé', department: 'Mono', lat: 6.4500, lng: 1.8000, isMajor: false },

  // Couffo
  { id: 'aplahoue', name: 'Aplahoué', department: 'Couffo', lat: 6.9333, lng: 1.6833, isMajor: true },
  { id: 'dogbo', name: 'Dogbo', department: 'Couffo', lat: 6.8000, lng: 1.7833, isMajor: true },
  { id: 'djakotomey', name: 'Djakotomey', department: 'Couffo', lat: 6.9000, lng: 1.7167, isMajor: false },
  { id: 'klouekanme', name: 'Klouékanmè', department: 'Couffo', lat: 6.9833, lng: 1.8500, isMajor: false },
  { id: 'lalo', name: 'Lalo', department: 'Couffo', lat: 6.9167, lng: 1.8833, isMajor: false },
  { id: 'toviklin', name: 'Toviklin', department: 'Couffo', lat: 6.9500, lng: 1.8000, isMajor: false },

  // Plateau
  { id: 'ketou', name: 'Kétou', department: 'Plateau', lat: 7.3633, lng: 2.5997, isMajor: true },
  { id: 'pobe', name: 'Pobè', department: 'Plateau', lat: 6.9801, lng: 2.6649, isMajor: true },
  { id: 'sakete', name: 'Sakété', department: 'Plateau', lat: 6.7361, lng: 2.6586, isMajor: true },
  { id: 'ifangni', name: 'Ifangni', department: 'Plateau', lat: 6.6667, lng: 2.7167, isMajor: false },
  { id: 'adja_ouere', name: 'Adja-Ouèrè', department: 'Plateau', lat: 7.0000, lng: 2.5833, isMajor: false },
];

export const BENIN_CITY_NAMES: string[] = ALL_BENIN_CITIES.map((c) => c.name);

// International Major City coordinates for Global routing
const GLOBAL_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Togo
  'lomé': { lat: 6.1375, lng: 1.2123 },
  'lome': { lat: 6.1375, lng: 1.2123 },
  'kara': { lat: 9.5511, lng: 1.1861 },
  // Côte d'Ivoire
  'abidjan': { lat: 5.3600, lng: -4.0083 },
  'bouaké': { lat: 7.6900, lng: -5.0300 },
  'bouake': { lat: 7.6900, lng: -5.0300 },
  'yamoussoukro': { lat: 6.8276, lng: -5.2893 },
  'san-pédro': { lat: 4.7485, lng: -6.6363 },
  // Sénégal
  'dakar': { lat: 14.7167, lng: -17.4677 },
  'thiès': { lat: 14.7833, lng: -16.9333 },
  'thies': { lat: 14.7833, lng: -16.9333 },
  // Burkina Faso
  'ouagadougou': { lat: 12.3714, lng: -1.5197 },
  'bobo-dioulasso': { lat: 11.1772, lng: -4.2979 },
  // Mali
  'bamako': { lat: 12.6392, lng: -8.0029 },
  // Niger
  'niamey': { lat: 13.5127, lng: 2.1126 },
  // Cameroun
  'douala': { lat: 4.0511, lng: 9.7679 },
  'yaoundé': { lat: 3.8480, lng: 11.5021 },
  'yaounde': { lat: 3.8480, lng: 11.5021 },
  // Nigeria
  'lagos': { lat: 6.5244, lng: 3.3792 },
  'abuja': { lat: 9.0765, lng: 7.3986 },
  // Ghana
  'accra': { lat: 5.6037, lng: -0.1870 },
  'kumasi': { lat: 6.6885, lng: -1.6244 },
  // RDC & Congo
  'kinshasa': { lat: -4.4419, lng: 15.2663 },
  'brazzaville': { lat: -4.2634, lng: 15.2429 },
  // Gabon
  'libreville': { lat: 0.4162, lng: 9.4673 },
  // Maghreb
  'casablanca': { lat: 33.5731, lng: -7.5898 },
  'rabat': { lat: 34.0209, lng: -6.8416 },
  'alger': { lat: 36.7538, lng: 3.0588 },
  'tunis': { lat: 36.8065, lng: 10.1815 },
  // Europe & Amériques
  'paris': { lat: 48.8566, lng: 2.3522 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'bruxelles': { lat: 50.8503, lng: 4.3517 },
  'genève': { lat: 46.2044, lng: 6.1432 },
  'geneve': { lat: 46.2044, lng: 6.1432 },
  'montréal': { lat: 45.5017, lng: -73.5673 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'dubaï': { lat: 25.2048, lng: 55.2708 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'guangzhou': { lat: 23.1291, lng: 113.2644 },
};

export function getBeninCityCoords(cityName: string): { lat: number; lng: number } {
  const norm = cityName ? cityName.trim().toLowerCase() : '';
  const found = ALL_BENIN_CITIES.find(
    (c) => c.name.toLowerCase() === norm || c.id.toLowerCase() === norm
  );
  if (found) {
    return { lat: found.lat, lng: found.lng };
  }
  if (GLOBAL_CITY_COORDS[norm]) {
    return GLOBAL_CITY_COORDS[norm];
  }
  return { lat: 6.3703, lng: 2.4183 }; // Default Cotonou
}

export function generateGpsShareLink(lat: number, lng: number, label?: string): string {
  const query = label ? `${encodeURIComponent(label)}@${lat},${lng}` : `${lat},${lng}`;
  return `https://www.google.com/maps?q=${query}`;
}

export function generateGpsWhatsAppMessage(
  driverName: string,
  cityName: string,
  lat: number,
  lng: number,
  trackingCode?: string,
  countryName?: string
): string {
  const mapLink = generateGpsShareLink(lat, lng, `Position Livreur ${driverName}`);
  const locationLabel = countryName ? `${cityName} (${countryName})` : cityName;
  const trackingSection = trackingCode
    ? `📦 Colis Suivi : #${trackingCode}\n🔗 Suivi en direct : https://lincom-1ecc6.web.app/?track=${encodeURIComponent(trackingCode)}\n`
    : '';

  return `📍 *LIENCOLIS GPS - POSITION EN DIRECT*\n\n` +
    `👤 Livreur : ${driverName}\n` +
    `🏙️ Localisation : ${locationLabel}\n` +
    trackingSection +
    `🌐 Coordonnées : ${lat.toFixed(5)}°, ${lng.toFixed(5)}°\n\n` +
    `👉 Suivre ma position GPS en direct sur Google Maps :\n${mapLink}`;
}

export * from './countries';
