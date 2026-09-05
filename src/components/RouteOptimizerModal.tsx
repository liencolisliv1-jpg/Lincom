// Source: Google Maps Platform Code Assist
import React, { useState, useEffect } from 'react';
import {
  Zap,
  Navigation,
  MapPin,
  Clock,
  Fuel,
  ArrowRight,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Bike,
  Car,
  ChevronRight,
  TrendingDown,
  Info,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Delivery, DeliveryStop, RouteOptimizationResult } from '../types';
import {
  convertDeliveriesToStops,
  optimizeDeliveryRoute,
} from '../services/routeOptimizationService';
import { ALL_BENIN_CITIES } from '../constants/beninCities';

interface RouteOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: Delivery[];
  currentDriverCoords?: { lat: number; lng: number };
  onApplyOptimizedOrder?: (reorderedDeliveryIds: string[]) => void;
}

const COMMON_BENIN_HUBS = [
  { name: 'Marché Dantokpa (Grand Marché Cotonou)', lat: 6.3719, lng: 2.4361, city: 'Cotonou' },
  { name: 'Place de l\'Étoile Rouge', lat: 6.3776, lng: 2.4045, city: 'Cotonou' },
  { name: 'Haie Vive (Zone Résidentielle)', lat: 6.3533, lng: 2.3995, city: 'Cotonou' },
  { name: 'Cadjehoun / Aéroport', lat: 6.3574, lng: 2.3852, city: 'Cotonou' },
  { name: 'Akpakpa / PK3', lat: 6.3768, lng: 2.4552, city: 'Cotonou' },
  { name: 'Stade de l\'Amitié (Kouhounou)', lat: 6.3881, lng: 2.3789, city: 'Cotonou' },
  { name: 'Abomey-Calavi (Carrefour IITA / Université)', lat: 6.4354, lng: 2.3489, city: 'Abomey-Calavi' },
  { name: 'Porto-Novo (Carrefour Cinquantenaire)', lat: 6.4969, lng: 2.6288, city: 'Porto-Novo' },
];

export const RouteOptimizerModal: React.FC<RouteOptimizerModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  currentDriverCoords,
  onApplyOptimizedOrder,
}) => {
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [customStops, setCustomStops] = useState<DeliveryStop[]>([]);
  const [travelMode, setTravelMode] = useState<'TWO_WHEELER' | 'DRIVE'>('TWO_WHEELER');
  const [returnToStart, setReturnToStart] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [showAddCustomStop, setShowAddCustomStop] = useState<boolean>(false);

  // New Custom Stop inputs
  const [newStopAddress, setNewStopAddress] = useState('');
  const [newStopCity, setNewStopCity] = useState('Cotonou');
  const [newStopContact, setNewStopContact] = useState('');
  const [newStopPhone, setNewStopPhone] = useState('');
  const [newStopDesc, setNewStopDesc] = useState('');

  // Initialize selected deliveries
  useEffect(() => {
    if (deliveries.length > 0) {
      // Auto select pending and in_transit deliveries
      const activeIds = deliveries
        .filter((d) => d.status !== 'delivered' && d.status !== 'cancelled')
        .map((d) => d.id);
      setSelectedDeliveryIds(activeIds.length > 0 ? activeIds : deliveries.map((d) => d.id));
    }
  }, [deliveries]);

  // Compute optimization
  const handleCalculateRoute = async () => {
    setIsCalculating(true);
    try {
      const activeDeliveries = deliveries.filter((d) => selectedDeliveryIds.includes(d.id));
      const { origin, intermediateStops } = convertDeliveriesToStops(
        activeDeliveries,
        currentDriverCoords
      );

      const allIntermediates = [...intermediateStops, ...customStops];

      const destination = returnToStart
        ? {
            ...origin,
            id: 'destination_return',
            label: 'Retour au Point de Départ (Dépôt)',
            stopType: 'depot' as const,
          }
        : undefined;

      const result = await optimizeDeliveryRoute(origin, allIntermediates, destination, travelMode);
      setOptimizationResult(result);
      setActiveStopIndex(0);
    } catch (err) {
      console.error('Error optimizing route:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Run initial calculation when opened or when selected deliveries change
  useEffect(() => {
    if (isOpen && deliveries.length > 0 && selectedDeliveryIds.length > 0) {
      handleCalculateRoute();
    }
  }, [isOpen, selectedDeliveryIds.length, customStops.length, travelMode, returnToStart]);

  if (!isOpen) return null;

  const toggleDeliverySelection = (id: string) => {
    setSelectedDeliveryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopAddress) return;

    // Find city coordinates or fallback to Cotonou
    const cityData = ALL_BENIN_CITIES.find((c) => c.name.toLowerCase() === newStopCity.toLowerCase());
    const hubData = COMMON_BENIN_HUBS.find((h) => newStopAddress.toLowerCase().includes(h.name.toLowerCase()));

    const baseLat = hubData?.lat || cityData?.lat || 6.3703 + (Math.random() - 0.5) * 0.03;
    const baseLng = hubData?.lng || cityData?.lng || 2.4183 + (Math.random() - 0.5) * 0.03;

    const stop: DeliveryStop = {
      id: `custom_${Date.now()}`,
      label: `Arrêt Personnalisé - ${newStopAddress}`,
      address: newStopAddress,
      city: newStopCity,
      lat: baseLat,
      lng: baseLng,
      contactName: newStopContact || 'Client / Magasin',
      contactPhone: newStopPhone,
      packageDescription: newStopDesc || 'Colis / Marchandise',
      stopType: 'custom',
    };

    setCustomStops((prev) => [...prev, stop]);
    setNewStopAddress('');
    setNewStopContact('');
    setNewStopPhone('');
    setNewStopDesc('');
    setShowAddCustomStop(false);
  };

  const handleRemoveCustomStop = (id: string) => {
    setCustomStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApplyOrder = () => {
    if (!optimizationResult || !onApplyOptimizedOrder) return;
    const reorderedIds = optimizationResult.orderedStops
      .filter((s) => s.deliveryId)
      .map((s) => s.deliveryId as string);

    onApplyOptimizedOrder(reorderedIds);
    onClose();
  };

  // Map projection helpers for SVG visualization
  const getMapPoints = () => {
    if (!optimizationResult || optimizationResult.orderedStops.length === 0) return [];
    const stops = optimizationResult.orderedStops;

    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = Math.max(maxLat - minLat, 0.015);
    const lngSpan = Math.max(maxLng - minLng, 0.015);

    const width = 600;
    const height = 340;
    const padding = 50;

    return stops.map((stop, idx) => {
      // Longitude maps to X, Latitude maps to Y (inverted)
      const x = padding + ((stop.lng - minLng) / lngSpan) * (width - 2 * padding);
      const y = height - padding - ((stop.lat - minLat) / latSpan) * (height - 2 * padding);
      return { ...stop, x, y, index: idx };
    });
  };

  const mapPoints = getMapPoints();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 font-black">
                <Zap className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  Optimisateur d'Itinéraire Multi-Arrêts
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                    {optimizationResult?.isLiveGoogleMapsApi ? 'Google Maps API' : 'Moteur Autonome (Sans Clé Requise)'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Calculez automatiquement l'ordre le plus rapide et le plus économe en essence pour vos livraisons au Bénin.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCalculateRoute}
              disabled={isCalculating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>Recalculer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Info Banner for No API Key needed */}
        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Fonctionne 100% sans clé API ni abonnement : </span>
            Liencolis calcule l'ordre optimal grâce à son algorithme mathématique embarqué (optimisé pour Cotonou et les villes du Bénin). La navigation s'ouvre ensuite gratuitement dans l'application Google Maps de votre téléphone !
          </div>
        </div>

        {/* Controls Bar: Mode & Return Loop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Véhicule :</span>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setTravelMode('TWO_WHEELER')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
                  travelMode === 'TWO_WHEELER'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Moto / Zém</span>
              </button>
              <button
                type="button"
                onClick={() => setTravelMode('DRIVE')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
                  travelMode === 'DRIVE'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Tricycle / Auto</span>
              </button>
            </div>
          </div>

          {/* Loop Mode */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={returnToStart}
                onChange={(e) => setReturnToStart(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
              />
              <span className="font-semibold">Boucle fermée (Retour au point de départ)</span>
            </label>
          </div>

          {/* Add Stop Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddCustomStop(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Arrêt / Relais</span>
            </button>
          </div>
        </div>

        {/* Custom Stop Creation Drawer/Card */}
        {showAddCustomStop && (
          <form
            onSubmit={handleAddCustomStop}
            className="p-4 rounded-xl bg-slate-800/90 border border-emerald-500/50 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <MapPin className="w-4 h-4" />
                <span>Ajouter un point intermédiaire à votre tournée</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomStop(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Annuler
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Adresse ou Lieu au Bénin *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marché Dantokpa, Carrefour Étoile Rouge, Haie Vive..."
                  value={newStopAddress}
                  onChange={(e) => setNewStopAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ville</label>
                <select
                  value={newStopCity}
                  onChange={(e) => setNewStopCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Cotonou">Cotonou</option>
                  <option value="Abomey-Calavi">Abomey-Calavi</option>
                  <option value="Porto-Novo">Porto-Novo</option>
                  <option value="Parakou">Parakou</option>
                  <option value="Ouidah">Ouidah</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Référent (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: M. Mensah"
                  value={newStopContact}
                  onChange={(e) => setNewStopContact(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Téléphone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+229 97 00 00 00"
                  value={newStopPhone}
                  onChange={(e) => setNewStopPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Détails Colis</label>
                <input
                  type="text"
                  placeholder="Ex: Récupération marchandise"
                  value={newStopDesc}
                  onChange={(e) => setNewStopDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
              >
                Enregistrer l'arrêt
              </button>
            </div>
          </form>
        )}

        {/* Optimization Metrics Summary */}
        {optimizationResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Distance Totale</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">
                {(optimizationResult.totalDistanceMeters / 1000).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </p>
              <p className="text-[11px] text-blue-300/80 mt-0.5">
                {optimizationResult.orderedStops.length} étapes au total
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Durée Estimée</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-400">
                {Math.round(optimizationResult.totalDurationSeconds / 60)}{' '}
                <span className="text-xs font-normal text-slate-400">min</span>
              </p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Trafic & voirie urbaine
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Distance Économisée</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-amber-400">
                {(optimizationResult.savings.distanceMetersSaved / 1000).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                ~{optimizationResult.savings.timeMinutesSaved} min de trajet gagnées
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold mb-1">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span>Économie Essence</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-amber-400">
                +{optimizationResult.savings.fuelSavedFcfa.toLocaleString()}{' '}
                <span className="text-xs font-normal text-amber-200">FCFA</span>
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Gain direct pour le conducteur
              </p>
            </div>
          </div>
        )}

        {/* Main Content Layout: Map Visualizer + Stops List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: Interactive Visual Route Map (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs">Visualisation de la Trajectoire Optimisée</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {optimizationResult?.isLiveGoogleMapsApi ? 'Connecté Google Maps Routes API' : 'Calcul Haute Précision Liencolis'}
              </span>
            </div>

            {/* SVG Visual Map Canvas */}
            <div className="w-full h-72 sm:h-80 bg-slate-900/90 rounded-xl border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
              {/* Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #38bdf8 1px, transparent 1px), radial-gradient(circle, #f59e0b 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 12px 12px',
                }}
              />

              {isCalculating ? (
                <div className="flex flex-col items-center gap-2 text-center p-6">
                  <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-amber-400">Calcul du chemin optimal via Google Maps API...</p>
                  <p className="text-[11px] text-slate-400">Optimisation de l'ordre des waypoints en cours</p>
                </div>
              ) : mapPoints.length > 0 ? (
                <svg className="w-full h-full" viewBox="0 0 600 340">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="glow" />
                      <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                  </defs>

                  {/* Draw Connecting Path Polyline */}
                  {mapPoints.length > 1 && (
                    <polyline
                      points={mapPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="url(#routeGradient)"
                      strokeWidth="4"
                      strokeDasharray="6 3"
                      filter="url(#glow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Render Stop Nodes */}
                  {mapPoints.map((pt, idx) => {
                    const isOrigin = idx === 0;
                    const isDestination = idx === mapPoints.length - 1 && mapPoints.length > 1;
                    const isSelected = activeStopIndex === idx;

                    return (
                      <g
                        key={pt.id || idx}
                        onClick={() => setActiveStopIndex(idx)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        {/* Selected halo */}
                        {isSelected && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="22"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                            className="animate-spin origin-center"
                          />
                        )}

                        {/* Outer Pin Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isOrigin ? '16' : isDestination ? '15' : '14'}
                          fill={isOrigin ? '#0284c7' : isDestination ? '#059669' : isSelected ? '#f59e0b' : '#1e293b'}
                          stroke={isSelected ? '#ffffff' : isOrigin ? '#38bdf8' : isDestination ? '#34d399' : '#64748b'}
                          strokeWidth="2.5"
                        />

                        {/* Label inside pin */}
                        <text
                          x={pt.x}
                          y={pt.y + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={isOrigin ? '9' : '11'}
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {isOrigin ? 'Dép' : isDestination && returnToStart ? 'Fin' : idx}
                        </text>

                        {/* Title text badge above node */}
                        <text
                          x={pt.x}
                          y={pt.y - 18}
                          textAnchor="middle"
                          fill={isSelected ? '#fbbf24' : '#cbd5e1'}
                          fontSize="10"
                          fontWeight="bold"
                          className="select-none"
                        >
                          {pt.contactName || pt.address.split(',')[0].slice(0, 15)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="text-center p-4 text-xs text-slate-400">
                  Sélectionnez des livraisons pour afficher l'itinéraire.
                </div>
              )}
            </div>

            {/* Active Selected Node Details Bar */}
            {optimizationResult && mapPoints[activeStopIndex] && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {activeStopIndex === 0 ? 'D' : activeStopIndex}
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {mapPoints[activeStopIndex].label}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {mapPoints[activeStopIndex].address}, {mapPoints[activeStopIndex].city}
                    </span>
                  </div>
                </div>

                {mapPoints[activeStopIndex].contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${mapPoints[activeStopIndex].contactPhone}`}
                      className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 transition-colors"
                      title="Appeler"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${mapPoints[activeStopIndex].contactPhone?.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                        `Bonjour ${mapPoints[activeStopIndex].contactName || ''}, je suis votre livreur Liencolis. Votre colis est le stop #${activeStopIndex} de ma tournée optimisée !`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Ordered Stops & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            
            {/* Stops Checklist & Sequence */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5 flex-1 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">
                  Ordre des Livraisons ({optimizationResult?.orderedStops.length || 0} étapes)
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Ordre Optimal
                </span>
              </div>

              <div className="space-y-2">
                {optimizationResult?.orderedStops.map((stop, idx) => {
                  const isOrigin = idx === 0;
                  const isDestination = idx === optimizationResult.orderedStops.length - 1 && optimizationResult.orderedStops.length > 1;
                  const isSelected = activeStopIndex === idx;

                  return (
                    <div
                      key={stop.id || idx}
                      onClick={() => setActiveStopIndex(idx)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isOrigin
                              ? 'bg-blue-600 text-white'
                              : isDestination && returnToStart
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-amber-400 border border-slate-700'
                          }`}
                        >
                          {isOrigin ? '🟢' : isDestination && returnToStart ? '🏁' : idx}
                        </div>

                        <div className="min-w-0 truncate">
                          <p className="font-bold text-slate-100 truncate">
                            {stop.contactName || stop.label}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {stop.address}, {stop.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {stop.fee && (
                          <span className="text-[11px] font-bold text-amber-400">
                            {stop.fee} F
                          </span>
                        )}
                        {stop.id.startsWith('custom_') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustomStop(stop.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Launch in Google Maps Button */}
              {optimizationResult?.googleMapsNavigationUrl && (
                <a
                  href={optimizationResult.googleMapsNavigationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Ouvrir dans Google Maps Navigation</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}

              {/* Apply order to driver app */}
              {onApplyOptimizedOrder && (
                <button
                  type="button"
                  onClick={handleApplyOrder}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Appliquer l'Ordre Optimisé à Mes Livraisons</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer & Mandatory Google Maps Platform Attribution */}
        <div className="border-t border-slate-800/80 pt-3 text-center space-y-1">
          <p className="text-[11px] text-slate-400">
            Itinéraire calculé pour le réseau routier du Bénin avec détection d'encombrement urbain.
          </p>
          <div className="text-[11px] text-slate-500 font-medium">
            Google Maps
          </div>
        </div>
      </div>
    </div>
  );
};
