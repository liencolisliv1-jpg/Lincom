// Source: Google Maps Platform Code Assist
import React, { useEffect, useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import {
  Navigation,
  MapPin,
  Package,
  Clock,
  ExternalLink,
  LocateFixed,
  AlertTriangle,
  Key,
  CheckCircle2,
  Layers,
  Sparkles,
  Compass,
  Phone,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Info,
  ChevronRight,
  ListFilter,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Delivery } from '../types';
import { ALL_BENIN_CITIES } from '../constants/beninCities';

interface GoogleMapViewProps {
  deliveries: Delivery[];
  selectedDeliveryId?: string;
  onSelectDelivery?: (deliveryId: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  className?: string;
}

// Coordinate lookup for Benin destinations
export function resolveCoordinates(cityName: string, address?: string): { lat: number; lng: number } {
  if (!cityName && !address) return { lat: 6.3703, lng: 2.4183 }; // Cotonou centre par défaut

  // Address-level precise geolocation for Cotonou, Calavi, Porto-Novo, Parakou
  if (address) {
    const addr = address.toLowerCase();
    // Cotonou quartiers & landmarks
    if (addr.includes('fidjrosse') || addr.includes('fidjrossè') || addr.includes('plage')) return { lat: 6.3625, lng: 2.3789 };
    if (addr.includes('cadjehoun') || addr.includes('cadjèhoun') || addr.includes('aeroport') || addr.includes('aéroport')) return { lat: 6.3685, lng: 2.4048 };
    if (addr.includes('haie vive') || addr.includes('cocotiers')) return { lat: 6.3601, lng: 2.4189 };
    if (addr.includes('akpakpa') || addr.includes('dodome') || addr.includes('dodomè') || addr.includes('segbeya')) return { lat: 6.3758, lng: 2.4589 };
    if (addr.includes('etoile') || addr.includes('étoile') || addr.includes('maro militaire')) return { lat: 6.3752, lng: 2.4162 };
    if (addr.includes('dantokpa') || addr.includes('marche') || addr.includes('marché') || addr.includes('st michel')) return { lat: 6.3775, lng: 2.4358 };
    if (addr.includes('menontin') || addr.includes('mènontin')) return { lat: 6.3889, lng: 2.3856 };
    if (addr.includes('kouhounou') || addr.includes('stade de l\'amitie') || addr.includes('stade')) return { lat: 6.3881, lng: 2.3789 };
    if (addr.includes('ganhi') || addr.includes('port autonome') || addr.includes('marina')) return { lat: 6.3582, lng: 2.4331 };
    if (addr.includes('gbedjromede') || addr.includes('gbédjromèdé') || addr.includes('16eme')) return { lat: 6.3812, lng: 2.4095 };
    if (addr.includes('agla') || addr.includes('hlassocomè') || addr.includes('sainte rita')) return { lat: 6.3792, lng: 2.3812 };
    if (addr.includes('zogbo') || addr.includes('zogbohouè')) return { lat: 6.3854, lng: 2.3912 };
    if (addr.includes('vodje') || addr.includes('vodjè')) return { lat: 6.3712, lng: 2.3985 };
    if (addr.includes('hindagbe') || addr.includes('missessin')) return { lat: 6.3788, lng: 2.4215 };

    // Abomey-Calavi quartiers
    if (addr.includes('godomey') || addr.includes('togoudo') || addr.includes('dénou')) return { lat: 6.4025, lng: 2.3421 };
    if (addr.includes('kpota') || addr.includes('carrefour kpota')) return { lat: 6.4489, lng: 2.3512 };
    if (addr.includes('akassato') || addr.includes('iita') || addr.includes('zinvié')) return { lat: 6.5122, lng: 2.3598 };
    if (addr.includes('zogbadje') || addr.includes('zogbadjè') || addr.includes('uac') || addr.includes('campus')) return { lat: 6.4255, lng: 2.3412 };
    if (addr.includes('arconville') || addr.includes('tankpè') || addr.includes('tankpe')) return { lat: 6.4412, lng: 2.3385 };
    if (addr.includes('ouedo') || addr.includes('ouédo') || addr.includes('glo-djigbe') || addr.includes('gdiz')) return { lat: 6.5512, lng: 2.2985 };

    // Sèmè & Porto-Novo
    if (addr.includes('seme') || addr.includes('sèmè') || addr.includes('kraké') || addr.includes('djeregbé')) return { lat: 6.3788, lng: 2.6288 };
    if (addr.includes('ouando') || addr.includes('avakpa') || addr.includes('djassin') || addr.includes('catchi')) return { lat: 6.5012, lng: 2.6189 };
  }

  if (cityName) {
    const clean = cityName.trim().toLowerCase();
    const match = ALL_BENIN_CITIES.find(
      (c) => c.name.toLowerCase() === clean || clean.includes(c.name.toLowerCase()) || c.id === clean
    );
    if (match) return { lat: match.lat, lng: match.lng };
  }

  return { lat: 6.3703, lng: 2.4183 };
}

// Check if a given string is a plausible, real Google Maps API key (not a dummy placeholder or invalid format)
export function isLikelyRealGoogleMapsKey(key?: string | null): boolean {
  if (!key) return false;
  const k = key.trim();
  // Standard Google Cloud / Google Maps API keys start with AIzaSy and are 39 characters
  if (!/^AIzaSy[A-Za-z0-9_-]{33}$/.test(k)) {
    return false;
  }
  // Check for common mock or dummy values (e.g., 'AIzaSyVotreCleApiIci')
  const lower = k.toLowerCase();
  const mockKeywords = [
    'votre',
    'cle',
    'ici',
    'example',
    'placeholder',
    'dummy',
    'yourkey',
    'sample',
    'fake',
    'test',
  ];
  if (mockKeywords.some((mock) => lower.includes(mock))) {
    return false;
  }
  return true;
}

// Subcomponent to smoothly pan and fit bounds
const MapBoundsAdjuster: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);

  return null;
};

// Local Error Boundary to catch any @vis.gl or Google Maps JS runtime crashes
interface LocalMapBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onErrorTriggered?: () => void;
}

interface LocalMapBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LocalMapBoundary extends Component<LocalMapBoundaryProps, LocalMapBoundaryState> {
  override state: LocalMapBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): LocalMapBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('GoogleMapView: Caught map rendering error in local boundary:', error, info);
    if (this.props.onErrorTriggered) {
      this.props.onErrorTriggered();
    }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  deliveries = [],
  selectedDeliveryId,
  onSelectDelivery,
  userCoords,
  className = 'w-full h-80 sm:h-96',
}) => {
  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

  // Check for API key from env or user storage
  const [customKeyInput, setCustomKeyInput] = useState<string>('');
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [mapApiFailed, setMapApiFailed] = useState<boolean>(false);
  const [keyErrorMsg, setKeyErrorMsg] = useState<string>('');

  const envKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any).GOOGLE_MAPS_API_KEY : '') ||
    '';

  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('liencolis_google_maps_api_key') || '' : '';
  const effectiveApiKey = (storedKey || envKey || '').trim();
  const hasValidApiKey = isLikelyRealGoogleMapsKey(effectiveApiKey) && !mapApiFailed;

  // Clean up any stale/invalid key previously set in localStorage
  useEffect(() => {
    if (storedKey && !isLikelyRealGoogleMapsKey(storedKey)) {
      localStorage.removeItem('liencolis_google_maps_api_key');
    }
  }, [storedKey]);

  // Listen for Google Maps auth failures
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('Google Maps API authentication failure detected, switching to Bénin GPS map vector fallback.');
      setMapApiFailed(true);
    };

    window.addEventListener('google-maps-auth-failure', handleAuthFailure);
    return () => {
      window.removeEventListener('google-maps-auth-failure', handleAuthFailure);
    };
  }, []);

  const [activeMarkerDelivery, setActiveMarkerDelivery] = useState<Delivery | null>(null);

  // Selected delivery
  const selectedDelivery = useMemo(
    () => safeDeliveries.find((d) => d.id === selectedDeliveryId) || safeDeliveries[0] || null,
    [safeDeliveries, selectedDeliveryId]
  );

  // Center target
  const mapCenter = useMemo(() => {
    if (userCoords) return userCoords;
    if (selectedDelivery) {
      return resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress);
    }
    return { lat: 6.3703, lng: 2.4183 }; // Cotonou centre
  }, [userCoords, selectedDelivery]);

  const handleSaveCustomKey = () => {
    const cleaned = customKeyInput.trim();
    if (!cleaned) return;
    if (!isLikelyRealGoogleMapsKey(cleaned)) {
      setKeyErrorMsg('Format de clé invalide. Une clé Google Cloud commence par AIzaSy et contient 39 caractères.');
      return;
    }
    setKeyErrorMsg('');
    localStorage.setItem('liencolis_google_maps_api_key', cleaned);
    setMapApiFailed(false);
    setShowKeyConfig(false);
    window.location.reload();
  };

  const handleClearCustomKey = () => {
    localStorage.removeItem('liencolis_google_maps_api_key');
    setCustomKeyInput('');
    setKeyErrorMsg('');
    setMapApiFailed(false);
    setShowKeyConfig(false);
  };

  const [fallbackZoom, setFallbackZoom] = useState<'regional' | 'national' | 'coastal'>('coastal');
  const [showAllDeliveriesList, setShowAllDeliveriesList] = useState<boolean>(false);
  const [activePinPopup, setActivePinPopup] = useState<Delivery | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // High-performance interactive Benin delivery map with full visibility of all entities
  const renderFallbackMap = () => {
    // Determine coordinate bounding and coordinate-to-screen projection
    // Benin covers latitudes ~6.2°N to ~12.4°N and longitudes ~0.8°E to ~3.8°E
    // In coastal focus (Cotonou, Calavi, Porto-Novo, Ouidah): Lat 6.25 - 6.75, Lng 2.05 - 2.75
    const isCoastal = fallbackZoom === 'coastal';
    const isNational = fallbackZoom === 'national';

    // Projection bounds
    const minLat = isNational ? 6.1 : isCoastal ? 6.28 : 6.2;
    const maxLat = isNational ? 12.3 : isCoastal ? 6.72 : 7.4;
    const minLng = isNational ? 0.8 : isCoastal ? 2.05 : 1.8;
    const maxLng = isNational ? 3.9 : isCoastal ? 2.75 : 2.9;

    const project = (lat: number, lng: number) => {
      // SVG viewBox is 800 x 500
      const x = Math.max(40, Math.min(760, ((lng - minLng) / (maxLng - minLng)) * 720 + 40));
      // Invert Y because latitude increases northward while SVG Y increases downward
      const y = Math.max(50, Math.min(450, 450 - ((lat - minLat) / (maxLat - minLat)) * 390));
      return { x, y };
    };

    const driverScreen = userCoords ? project(userCoords.lat, userCoords.lng) : null;
    const currentTargetDelivery = activePinPopup || selectedDelivery;

    // Filter cities based on zoom
    const displayedCities = ALL_BENIN_CITIES.filter((c) => {
      if (isNational) return c.isMajor;
      if (isCoastal) {
        return (
          c.lat >= minLat &&
          c.lat <= maxLat &&
          c.lng >= minLng &&
          c.lng <= maxLng
        );
      }
      return c.lat <= maxLat;
    }).slice(0, 10);

    return (
      <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
        {/* Main SVG Benin Interactive Cartography Canvas */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 800 500" className="w-full h-full object-cover">
            <defs>
              <pattern id="benin-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.4" />
              </pattern>
              <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#082f49" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
              </linearGradient>
              <filter id="pinGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width="800" height="500" fill="#060c18" />
            <rect width="800" height="500" fill="url(#benin-grid)" />

            {/* Gulf of Guinea / Atlantic Ocean Coastline */}
            <path
              d="M 0 410 Q 200 375 400 420 T 800 400 L 800 500 L 0 500 Z"
              fill="url(#oceanGrad)"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text x="50" y="475" fill="#38bdf8" fontSize="13" fontWeight="bold" opacity="0.7" letterSpacing="2">
              🌊 OCÉAN ATLANTIQUE (CÔTE DU BÉNIN)
            </text>

            {/* Lac Nokoué & Laguna Water Bodies (Crucial for Cotonou / Calavi geography) */}
            <g opacity="0.55">
              <ellipse cx="480" cy="270" rx="90" ry="40" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              <text x="480" y="274" fill="#7dd3fc" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.8">
                🏞️ LAC NOKOUÉ / GANVIÉ
              </text>

              {/* Chenal de Cotonou & Lagune de Porto-Novo */}
              <path d="M 450 310 Q 480 340 470 380" fill="none" stroke="#0284c7" strokeWidth="4" />
              <ellipse cx="680" cy="300" rx="60" ry="25" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
              <text x="680" y="304" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle" opacity="0.7">
                Lagune Porto-Novo
              </text>
            </g>

            {/* Major Road Arteries & Arterial Expressways (RNIE 1, RNIE 2, Boulevard de la Marina) */}
            <g stroke="#334155" strokeWidth="4" strokeLinecap="round" opacity="0.75">
              {/* Littoral axis: Ouidah - Calavi - Cotonou - Sèmè - Porto-Novo */}
              <path d="M 60 380 Q 300 340 500 365 T 760 345" fill="none" stroke="#64748b" strokeWidth="7" />
              <path d="M 60 380 Q 300 340 500 365 T 760 345" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" />
              {/* North-South RNIE 2 Backbone to Calavi / Parakou */}
              <path d="M 430 365 L 430 80" fill="none" stroke="#64748b" strokeWidth="6" />
              <path d="M 430 365 L 430 80" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="8 4" />
              {/* Boulevard de la Marina / Route des Pêches */}
              <path d="M 220 395 Q 380 385 530 390" fill="none" stroke="#3b82f6" strokeWidth="4" />
              {/* Inter-connections & Ring roads */}
              <path d="M 280 370 L 320 220 L 430 180" fill="none" stroke="#475569" strokeWidth="3" />
              <path d="M 400 350 L 520 340" fill="none" stroke="#475569" strokeWidth="4" />
            </g>

            {/* Strategic Landmarks & Key Crossings */}
            <g fontSize="8" fontWeight="bold" fill="#cbd5e1" opacity="0.85">
              <text x="390" y="340" fill="#fde047">📍 Carrefour Vèdoko</text>
              <text x="445" y="348" fill="#fde047">📍 Étoile Rouge</text>
              <text x="475" y="360" fill="#38bdf8">🏪 Marché Dantokpa</text>
              <text x="360" y="385" fill="#a7f3d0">✈️ Aéroport Cadjèhoun</text>
              <text x="500" y="380" fill="#a7f3d0">🚢 Port Autonome Cotonou</text>
              <text x="350" y="240" fill="#cbd5e1">🎓 Campus UAC Calavi</text>
            </g>

            {/* Cities & Hubs on the Map */}
            {displayedCities.map((city) => {
              const pt = project(city.lat, city.lng);
              return (
                <g key={city.id} transform={`translate(${pt.x}, ${pt.y})`} className="pointer-events-none">
                  <circle r="4" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
                  <circle r="1.5" fill="#f8fafc" />
                  <text
                    x="8"
                    y="4"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="600"
                    className="select-none"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}

            {/* Route Line connecting Driver to Selected Delivery */}
            {driverScreen && selectedDelivery && (
              (() => {
                const targetCoords = resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress);
                const targetScreen = project(targetCoords.lat, targetCoords.lng);
                return (
                  <g>
                    <line
                      x1={driverScreen.x}
                      y1={driverScreen.y}
                      x2={targetScreen.x}
                      y2={targetScreen.y}
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                    <circle
                      cx={(driverScreen.x + targetScreen.x) / 2}
                      cy={(driverScreen.y + targetScreen.y) / 2}
                      r="12"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <text
                      x={(driverScreen.x + targetScreen.x) / 2}
                      y={(driverScreen.y + targetScreen.y) / 2 + 3}
                      fill="#34d399"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ~{selectedDelivery.estimatedArrivalMinutes || 5}m
                    </text>
                  </g>
                );
              })()
            )}

            {/* Delivery Destination Markers plotted accurately */}
            {safeDeliveries.map((del, idx) => {
              const coords = resolveCoordinates(del.dropoffCity, del.dropoffAddress);
              const pt = project(coords.lat, coords.lng);
              const isSelected = del.id === selectedDelivery?.id;
              const isPopup = del.id === activePinPopup?.id;
              const displayName = del.recipientName || del.clientPseudo || 'Destinataire';

              return (
                <g
                  key={del.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => {
                    setActivePinPopup(del);
                    if (onSelectDelivery) onSelectDelivery(del.id);
                  }}
                  className="cursor-pointer group"
                  filter={isSelected ? 'url(#pinGlow)' : undefined}
                >
                  {/* Outer pulse ring for selected */}
                  {isSelected && (
                    <circle r="18" fill="#f59e0b" fillOpacity="0.25" className="animate-ping" />
                  )}

                  {/* Pin stem & icon */}
                  <path
                    d="M 0 0 L -8 -16 A 11 11 0 1 1 8 -16 Z"
                    fill={isSelected ? '#f59e0b' : '#2563eb'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />

                  {/* Pin label number */}
                  <text
                    x="0"
                    y="-12"
                    textAnchor="middle"
                    fill={isSelected ? '#020617' : '#ffffff'}
                    fontSize="10"
                    fontWeight="900"
                  >
                    {idx + 1}
                  </text>

                  {/* Floating city & recipient tag */}
                  <g transform="translate(0, 14)">
                    <rect
                      x="-45"
                      y="0"
                      width="90"
                      height="17"
                      rx="8"
                      fill="#090f1d"
                      fillOpacity="0.9"
                      stroke={isSelected ? '#f59e0b' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      fill={isSelected ? '#fde68a' : '#e2e8f0'}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {displayName.length > 11 ? displayName.slice(0, 10) + '…' : displayName}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Driver Live GPS Marker */}
            {driverScreen && (
              <g transform={`translate(${driverScreen.x}, ${driverScreen.y})`}>
                <circle r="22" fill="#10b981" fillOpacity="0.25" className="animate-ping" />
                <circle r="13" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                <circle r="4" fill="#022c22" />
                <g transform="translate(0, -18)">
                  <rect x="-35" y="-14" width="70" height="15" rx="7" fill="#022c22" stroke="#10b981" strokeWidth="1" />
                  <text x="0" y="-3" textAnchor="middle" fill="#6ee7b7" fontSize="8.5" fontWeight="bold">
                    VOUS (CHAUFFEUR)
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Top Floating Control Bar */}
        <div className="relative z-20 p-3 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white shadow-lg">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="font-extrabold text-white">Cartographie Bénin GPS</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
              {safeDeliveries.length} Colis Affichés
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Zoom / Scope Controls */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-0.5 rounded-xl flex items-center shadow-lg text-[10px]">
              <button
                onClick={() => setFallbackZoom('coastal')}
                className={`px-2 py-1 rounded-lg font-bold transition ${
                  fallbackZoom === 'coastal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Zone Côtière (Cotonou, Calavi, Porto-Novo)"
              >
                Littoral
              </button>
              <button
                onClick={() => setFallbackZoom('regional')}
                className={`px-2 py-1 rounded-lg font-bold transition ${
                  fallbackZoom === 'regional' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Zone Sud & Centre (Zou, Ouémé, Atlantique)"
              >
                Sud-Bénin
              </button>
              <button
                onClick={() => setFallbackZoom('national')}
                className={`px-2 py-1 rounded-lg font-bold transition ${
                  fallbackZoom === 'national' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Bénin National Complet (Cotonou à Parakou / Malanville)"
              >
                National
              </button>
            </div>

            {/* Toggle Full Deliveries List */}
            <button
              onClick={() => setShowAllDeliveriesList(!showAllDeliveriesList)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                showAllDeliveriesList
                  ? 'bg-blue-600 text-white border-blue-400 shadow'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Afficher la liste de tous les arrêts et repères"
            >
              <ListFilter className="w-3.5 h-3.5 text-blue-300" />
              <span>Arrêts ({safeDeliveries.length})</span>
            </button>

            {/* Key Config Button */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition"
              title="Configurer la clé Google Maps Platform"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Clé API</span>
            </button>

            {/* External Google Maps Route */}
            {selectedDelivery && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${selectedDelivery.dropoffAddress}, ${selectedDelivery.dropoffCity}, Bénin`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <span>GPS Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Expand / Maximize Map Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              title={isExpanded ? 'Réduire la vue' : 'Agrandir la carte pour voir tous les détails'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Réduire</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Agrandir</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* API Key Modal / Dropdown */}
        {showKeyConfig && (
          <div className="relative z-30 mx-4 p-3.5 bg-slate-900/95 border border-amber-500/40 rounded-2xl text-xs text-slate-200 shadow-2xl space-y-2.5 backdrop-blur-md animate-in fade-in">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Activer Google Maps Platform (Satellite & Vectoriel)</span>
              </span>
              <button onClick={() => setShowKeyConfig(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pour afficher les tuiles Google Maps officielles, insérez votre clé Google Cloud ou une{' '}
              <a
                href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 underline font-bold"
              >
                clé Démo Google gratuite
              </a>{' '}
              sans carte bancaire :
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="AIzaSy..."
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={handleSaveCustomKey}
                disabled={!customKeyInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                Appliquer
              </button>
              {storedKey && (
                <button
                  onClick={handleClearCustomKey}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 text-xs"
                >
                  Effacer
                </button>
              )}
            </div>
            {keyErrorMsg && (
              <div className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/60 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{keyErrorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Deliveries Slide-Over Panel (When user clicks "Arrêts") */}
        {showAllDeliveriesList && (
          <div className="relative z-25 mx-3 max-h-48 overflow-y-auto p-2.5 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-md scrollbar-thin">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Tous les points et destinations sur la carte ({safeDeliveries.length})</span>
              </span>
              <button onClick={() => setShowAllDeliveriesList(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {safeDeliveries.map((del, i) => {
                const isSelected = del.id === selectedDelivery?.id;
                const recipientLabel = del.recipientName || del.clientPseudo || 'Destinataire';
                return (
                  <button
                    key={del.id}
                    onClick={() => {
                      setActivePinPopup(del);
                      if (onSelectDelivery) onSelectDelivery(del.id);
                    }}
                    className={`p-2 rounded-xl text-left text-xs transition flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                      }`}
                    >
                      #{i + 1}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-bold text-white truncate">{recipientLabel}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {del.dropoffCity} • {del.dropoffAddress}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Pin Detailed Info Card (Bottom) */}
        {currentTargetDelivery && (
          <div className="relative z-20 m-3 p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/90 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-extrabold text-white flex items-center gap-2">
                  <span className="text-sm">
                    {currentTargetDelivery.recipientName || currentTargetDelivery.clientPseudo || 'Destinataire'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700">
                    #{currentTargetDelivery.trackingCode || 'LC'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                    {currentTargetDelivery.deliveryFee || 1500} FCFA
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="font-semibold text-white">{currentTargetDelivery.dropoffCity}</span>
                  <span className="text-slate-400">({currentTargetDelivery.dropoffAddress})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
              <div className="text-right text-xs">
                <span className="text-[10px] text-slate-400 block">Arrivée estimée</span>
                <span className="font-black text-emerald-400 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{currentTargetDelivery.estimatedArrivalMinutes || 5} min</span>
                  <span className="text-[10px] text-slate-400 font-normal">({currentTargetDelivery.distanceRemainingMeters || 0}m)</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {(currentTargetDelivery.recipientPhone || currentTargetDelivery.clientPhone) && (
                  <a
                    href={`tel:${currentTargetDelivery.recipientPhone || currentTargetDelivery.clientPhone}`}
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center justify-center"
                    title={`Appeler ${currentTargetDelivery.recipientName || currentTargetDelivery.clientPseudo}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${currentTargetDelivery.dropoffAddress}, ${currentTargetDelivery.dropoffCity}, Bénin`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <span>Ouvrir GPS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={
        isExpanded
          ? 'fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-2 sm:p-4 backdrop-blur-md'
          : `relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 transition-all ${className}`
      }
    >
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-700/60 flex flex-col">
        {!hasValidApiKey ? (
          renderFallbackMap()
        ) : (
          <LocalMapBoundary
            onErrorTriggered={() => setMapApiFailed(true)}
            fallback={renderFallbackMap()}
          >
            <APIProvider
              apiKey={effectiveApiKey}
              onError={(err) => {
                console.warn('Google Maps APIProvider error:', err);
                setMapApiFailed(true);
              }}
            >
              {/* Top overlay badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white shadow-lg pointer-events-none">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-bold">Google Maps Platform</span>
                <span className="text-slate-400 text-[10px]">Bénin Nav</span>
              </div>

              {/* Expand / Minimize toggle button in Google Maps mode */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Réduire</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Agrandir</span>
                    </>
                  )}
                </button>
              </div>

            {/* Explicit 100% height container to prevent CF2 Map Height Collapse */}
            <div style={{ width: '100%', height: '100%' }}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                gestureHandling="greedy"
                disableDefaultUI={false}
                className="w-full h-full"
              >
                <MapBoundsAdjuster center={mapCenter} zoom={userCoords ? 14 : 13} />

                {/* Chauffeur / User Position Marker using resilient Custom HTML */}
                {userCoords && (
                  <AdvancedMarker position={userCoords} title="Votre Position GPS (Chauffeur)">
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 animate-pulse">
                        <LocateFixed className="w-4 h-4" />
                      </div>
                      <span className="absolute -bottom-4 px-1.5 py-0.2 rounded bg-slate-950/90 text-emerald-300 text-[9px] font-bold border border-slate-800 whitespace-nowrap">
                        Vous
                      </span>
                    </div>
                  </AdvancedMarker>
                )}

                {/* Delivery Destinations Markers using resilient Custom HTML instead of <Pin> */}
                {safeDeliveries.map((delivery, idx) => {
                  const coords = resolveCoordinates(delivery.dropoffCity, delivery.dropoffAddress);
                  const isSelected = delivery.id === selectedDeliveryId;
                  const displayName = delivery.recipientName || delivery.clientPseudo || 'Destinataire';

                  return (
                    <AdvancedMarker
                      key={delivery.id}
                      position={coords}
                      title={`${displayName} - ${delivery.dropoffAddress || ''}`}
                      onClick={() => {
                        setActiveMarkerDelivery(delivery);
                        if (onSelectDelivery) onSelectDelivery(delivery.id);
                      }}
                    >
                      <div className="relative flex flex-col items-center cursor-pointer group">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xl border-2 transition-transform transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-amber-500 border-white text-slate-950 scale-125 ring-2 ring-amber-400'
                              : 'bg-blue-600 border-white text-white'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div className="mt-0.5 px-1.5 py-0.5 rounded bg-slate-950/90 text-white text-[9px] font-bold border border-slate-700 shadow-sm whitespace-nowrap max-w-[80px] truncate">
                          {displayName}
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* InfoWindow for active clicked delivery */}
                {activeMarkerDelivery && (
                  <InfoWindow
                    position={resolveCoordinates(
                      activeMarkerDelivery.dropoffCity,
                      activeMarkerDelivery.dropoffAddress
                    )}
                    onCloseClick={() => setActiveMarkerDelivery(null)}
                  >
                    <div className="p-2 text-slate-900 max-w-xs space-y-1.5 text-xs font-sans">
                      <div className="font-bold text-sm text-slate-950 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span>{activeMarkerDelivery.recipientName || activeMarkerDelivery.clientPseudo || 'Destinataire'}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>
                          {activeMarkerDelivery.dropoffAddress}, {activeMarkerDelivery.dropoffCity}
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>
                          Livraison : ~{activeMarkerDelivery.estimatedArrivalMinutes || 5} min (
                          {activeMarkerDelivery.distanceRemainingMeters || 0}m)
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-emerald-700">{activeMarkerDelivery.deliveryFee || 1500} FCFA</span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            `${activeMarkerDelivery.dropoffAddress}, ${activeMarkerDelivery.dropoffCity}, Bénin`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 text-[11px]"
                        >
                          <span>Itinéraire</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          </APIProvider>
        </LocalMapBoundary>
      )}
      </div>
    </div>
  );
};
