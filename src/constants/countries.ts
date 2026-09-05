export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  currency: string;
  currencySymbol: string;
  rateToFcfa: number; // 1 Currency Unit = X FCFA
  region: 'Afrique de l\'Ouest' | 'Afrique Centrale' | 'Afrique du Nord & Est' | 'Europe' | 'Amériques' | 'Moyen-Orient & Asie' | 'International';
  majorCities: string[];
  cities?: string[];
  defaultCity: string;
  defaultLat: number;
  defaultLng: number;
}

export const ALL_COUNTRIES: CountryInfo[] = [
  // Afrique de l'Ouest
  {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    dialCode: '+229',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: [
      'Cotonou',
      'Abomey-Calavi',
      'Porto-Novo',
      'Parakou',
      'Bohicon',
      'Ouidah',
      'Djougou',
      'Natitingou',
      'Kandi',
      'Malanville',
      'Lokossa',
      'Savalou',
      'Dassa-Zoumè',
      'Allada',
      'Pobè',
    ],
    defaultCity: 'Cotonou',
    defaultLat: 6.3703,
    defaultLng: 2.4183,
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    dialCode: '+228',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Lomé', 'Kara', 'Sokodé', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Aného'],
    defaultCity: 'Lomé',
    defaultLat: 6.1375,
    defaultLng: 1.2123,
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    dialCode: '+225',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: [
      'Abidjan',
      'Bouaké',
      'Yamoussoukro',
      'San-Pédro',
      'Korhogo',
      'Daloa',
      'Man',
      'Gagnoa',
      'Bassam',
    ],
    defaultCity: 'Abidjan',
    defaultLat: 5.3600,
    defaultLng: -4.0083,
  },
  {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    dialCode: '+221',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Dakar', 'Thiès', 'Touba', 'Saint-Louis', 'Ziguinchor', 'Mbour', 'Kaolack', 'Rufisque'],
    defaultCity: 'Dakar',
    defaultLat: 14.7167,
    defaultLng: -17.4677,
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    dialCode: '+226',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
    defaultCity: 'Ouagadougou',
    defaultLat: 12.3714,
    defaultLng: -1.5197,
  },
  {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    dialCode: '+223',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Bamako', 'Sikasso', 'Mopti', 'Ségou', 'Kayes', 'Gao', 'Koulikoro'],
    defaultCity: 'Bamako',
    defaultLat: 12.6392,
    defaultLng: -8.0029,
  },
  {
    code: 'NE',
    name: 'Niger',
    flag: '🇳🇪',
    dialCode: '+227',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Niamey', 'Maradi', 'Zinder', 'Tahoua', 'Agadez', 'Dosso', 'Diffa'],
    defaultCity: 'Niamey',
    defaultLat: 13.5127,
    defaultLng: 2.1126,
  },
  {
    code: 'GN',
    name: 'Guinée',
    flag: '🇬🇳',
    dialCode: '+224',
    currency: 'GNF',
    currencySymbol: 'GNF',
    rateToFcfa: 0.07,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Conakry', 'Kankan', 'Kindia', 'Nzérékoré', 'Labé', 'Mamou'],
    defaultCity: 'Conakry',
    defaultLat: 9.6412,
    defaultLng: -13.5784,
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    dialCode: '+234',
    currency: 'NGN',
    currencySymbol: '₦',
    rateToFcfa: 0.45,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Lagos', 'Abuja', 'Ibadan', 'Kano', 'Port Harcourt', 'Enugu', 'Abeokuta', 'Calabar'],
    defaultCity: 'Lagos',
    defaultLat: 6.5244,
    defaultLng: 3.3792,
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    dialCode: '+233',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    rateToFcfa: 42,
    region: 'Afrique de l\'Ouest',
    majorCities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Sunyani'],
    defaultCity: 'Accra',
    defaultLat: 5.6037,
    defaultLng: -0.1870,
  },

  // Afrique Centrale
  {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    dialCode: '+237',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique Centrale',
    majorCities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Maroua', 'Kribi'],
    defaultCity: 'Douala',
    defaultLat: 4.0511,
    defaultLng: 9.7679,
  },
  {
    code: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    dialCode: '+241',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique Centrale',
    majorCities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
    defaultCity: 'Libreville',
    defaultLat: 0.4162,
    defaultLng: 9.4673,
  },
  {
    code: 'CG',
    name: 'Congo-Brazzaville',
    flag: '🇨🇬',
    dialCode: '+242',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique Centrale',
    majorCities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouésso'],
    defaultCity: 'Brazzaville',
    defaultLat: -4.2634,
    defaultLng: 15.2429,
  },
  {
    code: 'CD',
    name: 'RD Congo (Kinshasa)',
    flag: '🇨🇩',
    dialCode: '+243',
    currency: 'USD',
    currencySymbol: '$',
    rateToFcfa: 600,
    region: 'Afrique Centrale',
    majorCities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu', 'Kananga', 'Matadi'],
    defaultCity: 'Kinshasa',
    defaultLat: -4.4419,
    defaultLng: 15.2663,
  },
  {
    code: 'TD',
    name: 'Tchad',
    flag: '🇹🇩',
    dialCode: '+235',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    rateToFcfa: 1,
    region: 'Afrique Centrale',
    majorCities: ['N\'Djaména', 'Moundou', 'Sarh', 'Abéché', 'Kélo'],
    defaultCity: 'N\'Djaména',
    defaultLat: 12.1348,
    defaultLng: 15.0557,
  },

  // Afrique du Nord & Est
  {
    code: 'MA',
    name: 'Maroc',
    flag: '🇲🇦',
    dialCode: '+212',
    currency: 'MAD',
    currencySymbol: 'DH',
    rateToFcfa: 60,
    region: 'Afrique du Nord & Est',
    majorCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Oujda'],
    defaultCity: 'Casablanca',
    defaultLat: 33.5731,
    defaultLng: -7.5898,
  },
  {
    code: 'DZ',
    name: 'Algérie',
    flag: '🇩🇿',
    dialCode: '+213',
    currency: 'DZD',
    currencySymbol: 'DA',
    rateToFcfa: 4.5,
    region: 'Afrique du Nord & Est',
    majorCities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif'],
    defaultCity: 'Alger',
    defaultLat: 36.7538,
    defaultLng: 3.0588,
  },
  {
    code: 'TN',
    name: 'Tunisie',
    flag: '🇹🇳',
    dialCode: '+216',
    currency: 'TND',
    currencySymbol: 'DT',
    rateToFcfa: 195,
    region: 'Afrique du Nord & Est',
    majorCities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Nabeul', 'Kairouan'],
    defaultCity: 'Tunis',
    defaultLat: 36.8065,
    defaultLng: 10.1815,
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    dialCode: '+250',
    currency: 'RWF',
    currencySymbol: 'FRw',
    rateToFcfa: 0.46,
    region: 'Afrique du Nord & Est',
    majorCities: ['Kigali', 'Butare', 'Gisenyi', 'Musanze', 'Rwamagana'],
    defaultCity: 'Kigali',
    defaultLat: -1.9441,
    defaultLng: 30.0619,
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    dialCode: '+254',
    currency: 'KES',
    currencySymbol: 'KSh',
    rateToFcfa: 4.6,
    region: 'Afrique du Nord & Est',
    majorCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    defaultCity: 'Nairobi',
    defaultLat: -1.2921,
    defaultLng: 36.8219,
  },
  {
    code: 'ZA',
    name: 'Afrique du Sud',
    flag: '🇿🇦',
    dialCode: '+27',
    currency: 'ZAR',
    currencySymbol: 'R',
    rateToFcfa: 33,
    region: 'Afrique du Nord & Est',
    majorCities: ['Johannesburg', 'Le Cap', 'Durban', 'Pretoria', 'Gqeberha'],
    defaultCity: 'Johannesburg',
    defaultLat: -26.2041,
    defaultLng: 28.0473,
  },

  // Europe
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    currency: 'EUR',
    currencySymbol: '€',
    rateToFcfa: 655.957,
    region: 'Europe',
    majorCities: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Toulouse', 'Nantes', 'Nice', 'Strasbourg'],
    defaultCity: 'Paris',
    defaultLat: 48.8566,
    defaultLng: 2.3522,
  },
  {
    code: 'BE',
    name: 'Belgique',
    flag: '🇧🇪',
    dialCode: '+32',
    currency: 'EUR',
    currencySymbol: '€',
    rateToFcfa: 655.957,
    region: 'Europe',
    majorCities: ['Bruxelles', 'Liège', 'Anvers', 'Charleroi', 'Gand', 'Namur'],
    defaultCity: 'Bruxelles',
    defaultLat: 50.8503,
    defaultLng: 4.3517,
  },
  {
    code: 'CH',
    name: 'Suisse',
    flag: '🇨🇭',
    dialCode: '+41',
    currency: 'CHF',
    currencySymbol: 'CHF',
    rateToFcfa: 690,
    region: 'Europe',
    majorCities: ['Genève', 'Zurich', 'Lausanne', 'Bâle', 'Berne'],
    defaultCity: 'Genève',
    defaultLat: 46.2044,
    defaultLng: 6.1432,
  },
  {
    code: 'GB',
    name: 'Royaume-Uni',
    flag: '🇬🇧',
    dialCode: '+44',
    currency: 'GBP',
    currencySymbol: '£',
    rateToFcfa: 780,
    region: 'Europe',
    majorCities: ['Londres', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow'],
    defaultCity: 'Londres',
    defaultLat: 51.5074,
    defaultLng: -0.1278,
  },

  // Amériques
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    currency: 'CAD',
    currencySymbol: '$',
    rateToFcfa: 440,
    region: 'Amériques',
    majorCities: ['Montréal', 'Québec', 'Toronto', 'Ottawa', 'Vancouver', 'Gatineau'],
    defaultCity: 'Montréal',
    defaultLat: 45.5017,
    defaultLng: -73.5673,
  },
  {
    code: 'US',
    name: 'États-Unis',
    flag: '🇺🇸',
    dialCode: '+1',
    currency: 'USD',
    currencySymbol: '$',
    rateToFcfa: 600,
    region: 'Amériques',
    majorCities: ['New York', 'Atlanta', 'Miami', 'Chicago', 'Los Angeles', 'Washington DC', 'Houston'],
    defaultCity: 'New York',
    defaultLat: 40.7128,
    defaultLng: -74.0060,
  },

  // Moyen-Orient & Asie
  {
    code: 'AE',
    name: 'Émirats Arabes Unis',
    flag: '🇦🇪',
    dialCode: '+971',
    currency: 'AED',
    currencySymbol: 'AED',
    rateToFcfa: 163,
    region: 'Moyen-Orient & Asie',
    majorCities: ['Dubaï', 'Abou Dhabi', 'Sharjah', 'Ajman'],
    defaultCity: 'Dubaï',
    defaultLat: 25.2048,
    defaultLng: 55.2708,
  },
  {
    code: 'CN',
    name: 'Chine',
    flag: '🇨🇳',
    dialCode: '+86',
    currency: 'CNY',
    currencySymbol: '¥',
    rateToFcfa: 83,
    region: 'Moyen-Orient & Asie',
    majorCities: ['Guangzhou', 'Yiwu', 'Pékin', 'Shanghai', 'Shenzhen'],
    defaultCity: 'Guangzhou',
    defaultLat: 23.1291,
    defaultLng: 113.2644,
  },

  // Monde / International
  {
    code: 'WORLD',
    name: 'Autre Pays / International',
    flag: '🌍',
    dialCode: '+',
    currency: 'USD',
    currencySymbol: '$',
    rateToFcfa: 600,
    region: 'International',
    majorCities: ['International Express', 'Transit International', 'Autre Ville'],
    defaultCity: 'International',
    defaultLat: 0,
    defaultLng: 0,
  },
];

export const SUPPORTED_CURRENCIES = [
  { code: 'FCFA', label: 'Franc CFA (XOF / XAF)', symbol: 'FCFA', flag: '🌍', rateToFcfa: 1 },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', flag: '🇪🇺', rateToFcfa: 655.957 },
  { code: 'USD', label: 'Dollar US ($)', symbol: '$', flag: '🇺🇸', rateToFcfa: 600 },
  { code: 'NGN', label: 'Naira Nigérian (₦)', symbol: '₦', flag: '🇳🇬', rateToFcfa: 0.45 },
  { code: 'GHS', label: 'Cedi Ghanéen (GH₵)', symbol: 'GH₵', flag: '🇬🇭', rateToFcfa: 42 },
  { code: 'CAD', label: 'Dollar Canadien ($)', symbol: '$', flag: '🇨🇦', rateToFcfa: 440 },
  { code: 'GBP', label: 'Livre Sterling (£)', symbol: '£', flag: '🇬🇧', rateToFcfa: 780 },
];

export function getCountryByCode(code?: string): CountryInfo {
  if (!code) {
    const c = ALL_COUNTRIES[0];
    if (!c.cities) c.cities = c.majorCities;
    return c;
  }
  const found = ALL_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  const res = found || ALL_COUNTRIES[0];
  if (!res.cities) res.cities = res.majorCities;
  return res;
}

export function detectCountryFromPhone(phone?: string): CountryInfo {
  if (!phone) return ALL_COUNTRIES[0];
  const cleaned = phone.replace(/[\s\(\)\-]/g, '');
  // Sort countries by dialCode length descending to match +229 before +22 etc.
  const sorted = [...ALL_COUNTRIES].filter(c => c.dialCode !== '+').sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (cleaned.startsWith(c.dialCode) || cleaned.startsWith(c.dialCode.replace('+', '00'))) {
      return c;
    }
  }
  return ALL_COUNTRIES[0];
}

export function cleanWhatsAppNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let num = phone.replace(/[\s\(\)\-\.]/g, '');
  if (num.startsWith('+')) {
    num = num.substring(1);
  } else if (num.startsWith('00')) {
    num = num.substring(2);
  } else if (num.length <= 10 && !num.startsWith('229') && !num.startsWith('225') && !num.startsWith('228') && !num.startsWith('221') && !num.startsWith('237') && !num.startsWith('33')) {
    // Default fallback to Benin if no dial code present
    num = '229' + num;
  }
  return num;
}

export function formatCurrencyPrice(amount: number, currency: string = 'FCFA'): string {
  if (isNaN(amount) || amount === undefined || amount === null) return `0 ${currency}`;
  const rounded = Math.round(amount);
  if (currency === 'EUR') return `${amount < 1 ? amount.toFixed(2) : rounded.toLocaleString('fr-FR')} €`;
  if (currency === 'USD') return `$ ${amount < 1 ? amount.toFixed(2) : rounded.toLocaleString('fr-FR')}`;
  if (currency === 'CAD') return `$ ${amount < 1 ? amount.toFixed(2) : rounded.toLocaleString('fr-FR')} CAD`;
  if (currency === 'GBP') return `£ ${amount < 1 ? amount.toFixed(2) : rounded.toLocaleString('fr-FR')}`;
  if (currency === 'NGN') return `₦ ${rounded.toLocaleString('fr-FR')}`;
  if (currency === 'GHS') return `GH₵ ${amount.toFixed(1)}`;
  return `${rounded.toLocaleString('fr-FR')} ${currency}`;
}

export function formatPriceInCurrency(amountFcfa: number, targetCurrency: string = 'FCFA'): string {
  if (isNaN(amountFcfa)) return '0 FCFA';
  
  if (targetCurrency === 'EUR') {
    const val = amountFcfa / 655.957;
    return `${val < 1 ? val.toFixed(2) : Math.round(val * 100) / 100} €`;
  }
  if (targetCurrency === 'USD') {
    const val = amountFcfa / 600;
    return `$ ${val < 1 ? val.toFixed(2) : Math.round(val * 100) / 100}`;
  }
  if (targetCurrency === 'CAD') {
    const val = amountFcfa / 440;
    return `$ ${val < 1 ? val.toFixed(2) : Math.round(val * 100) / 100} CAD`;
  }
  if (targetCurrency === 'GBP') {
    const val = amountFcfa / 780;
    return `£ ${val < 1 ? val.toFixed(2) : Math.round(val * 100) / 100}`;
  }
  if (targetCurrency === 'NGN') {
    const val = Math.round(amountFcfa / 0.45);
    return `₦ ${val.toLocaleString('fr-FR')}`;
  }
  if (targetCurrency === 'GHS') {
    const val = (amountFcfa / 42).toFixed(1);
    return `GH₵ ${val}`;
  }
  
  // Default FCFA
  return `${Math.round(amountFcfa).toLocaleString('fr-FR')} FCFA`;
}

export function convertFcfaToCurrency(amountFcfa: number, targetCurrency: string = 'FCFA'): number {
  const curr = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency);
  if (!curr || curr.code === 'FCFA') return amountFcfa;
  return Math.round((amountFcfa / curr.rateToFcfa) * 100) / 100;
}

export function convertCurrencyToFcfa(amount: number, sourceCurrency: string = 'FCFA'): number {
  const curr = SUPPORTED_CURRENCIES.find(c => c.code === sourceCurrency);
  if (!curr || curr.code === 'FCFA') return amount;
  return Math.round(amount * curr.rateToFcfa);
}
