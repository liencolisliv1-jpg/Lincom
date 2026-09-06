import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Delivery } from '../types';
import { resolveCoordinates } from './GoogleMapView';
import { MapPin, Navigation, Compass, Layers, Phone } from 'lucide-react';

interface MapLibreViewProps {
  deliveries: Delivery[];
  selectedDeliveryId?: string;
  onSelectDelivery?: (deliveryId: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  className?: string;
}

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  deliveries = [],
  selectedDeliveryId,
  onSelectDelivery,
  userCoords,
  className = 'w-full h-80 sm:h-96',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const selectedDelivery = safeDeliveries.find((d) => d.id === selectedDeliveryId) || safeDeliveries[0] || null;

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = userCoords
      ? [userCoords.lng, userCoords.lat]
      : selectedDelivery
      ? [
          resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress).lng,
          resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress).lat,
        ]
      : [2.4183, 6.3703]; // Cotonou centre [lng, lat]

    // High performance vector raster style with zero API key requirement (CARTO / OSM Free Vector Tiles)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: initialCenter,
      zoom: 13,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls (Zoom +/- & Pitch/Bearing Compass)
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      mapInstanceRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Routes when state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();

    // 1. Driver Real GPS Marker
    if (userCoords) {
      const driverEl = document.createElement('div');
      driverEl.className = 'driver-marker-pin';
      driverEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #10B981; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 18px;">
            🛵
          </div>
          <div style="background: #022c22; color: #6ee7b7; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 6px; border: 1px solid #10b981; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            Chauffeur (Vous)
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
        '<div style="color: #0f172a; font-weight: bold; font-size: 12px; font-family: sans-serif;">📍 Votre Position GPS Satellite en Direct</div>'
      );

      const driverMarker = new maplibregl.Marker({ element: driverEl })
        .setLngLat([userCoords.lng, userCoords.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(driverMarker);
      bounds.extend([userCoords.lng, userCoords.lat]);
    }

    // 2. Delivery Destination Markers
    safeDeliveries.forEach((del, idx) => {
      const coords = resolveCoordinates(del.dropoffCity, del.dropoffAddress);
      const isSelected = del.id === selectedDeliveryId;
      const displayName = del.recipientName || del.clientPseudo || 'Destinataire';

      const el = document.createElement('div');
      el.className = 'delivery-marker-pin';
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${
            isSelected ? '#f59e0b' : '#2563eb'
          }; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 12px; transition: transform 0.2s;">
            #${idx + 1}
          </div>
          <div style="background: #0f172a; color: ${
            isSelected ? '#fde68a' : '#f8fafc'
          }; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 6px; border: 1px solid ${
        isSelected ? '#f59e0b' : '#334155'
      }; margin-top: 2px; white-space: nowrap; max-width: 95px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            ${displayName}
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        if (onSelectDelivery) onSelectDelivery(del.id);
      });

      const popupHtml = `
        <div style="padding: 4px; font-family: sans-serif; color: #0f172a; min-width: 170px;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 3px; color: #020617;">
            📦 ${displayName}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            📍 ${del.dropoffAddress}, ${del.dropoffCity}
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #059669; margin-bottom: 6px;">
            Tarif: ${(del.deliveryFee || 1500).toLocaleString()} FCFA (PIN #${del.securityPin || '---'})
          </div>
          <div style="display: flex; gap: 4px;">
            ${
              del.recipientPhone || del.clientPhone
                ? `<a href="tel:${del.recipientPhone || del.clientPhone}" style="padding: 4px 8px; background: #10B981; color: white; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold;">📞 Appeler</a>`
                : ''
            }
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${del.dropoffAddress}, ${del.dropoffCity}, Bénin`
            )}" target="_blank" rel="noreferrer" style="padding: 4px 8px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold;">🗺️ Naviguer</a>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([coords.lng, coords.lat]);
    });

    // 3. Dynamic Route Polyline Layer using GeoJSON
    if (selectedDelivery) {
      const dropCoords = resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress);
      const startLng = userCoords ? userCoords.lng : dropCoords.lng - 0.015;
      const startLat = userCoords ? userCoords.lat : dropCoords.lat - 0.015;

      const routeGeoJSON: any = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [startLng, startLat],
            [dropCoords.lng, dropCoords.lat],
          ],
        },
      };

      if (map.getSource('route-line')) {
        (map.getSource('route-line') as maplibregl.GeoJSONSource).setData(routeGeoJSON);
      } else {
        map.addSource('route-line', {
          type: 'geojson',
          data: routeGeoJSON,
        });

        map.addLayer({
          id: 'route-line-casing',
          type: 'line',
          source: 'route-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#022c22',
            'line-width': 6,
          },
        });

        map.addLayer({
          id: 'route-line-core',
          type: 'line',
          source: 'route-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 4,
            'line-dasharray': [2, 2],
          },
        });
      }
    }

    // Auto-fit bounds if we have points
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    }
  }, [safeDeliveries, selectedDeliveryId, userCoords, mapLoaded]);

  // Toggle 3D Perspective Pitch
  const toggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!is3DMode) {
      map.easeTo({ pitch: 55, bearing: -20, duration: 1200 });
      setIs3DMode(true);
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1200 });
      setIs3DMode(false);
    }
  };

  // Center on user GPS
  const centerOnUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !userCoords) return;
    map.flyTo({ center: [userCoords.lng, userCoords.lat], zoom: 15, duration: 1200 });
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 ${className}`}>
      {/* Top Badge: MapLibre GL WebGL */}
      <div className="absolute top-3 left-3 z-[10] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white shadow-lg pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="font-black text-emerald-300">MapLibre GL Bénin</span>
        <span className="text-slate-400 text-[10px] hidden sm:inline">Rendu WebGL Rapide & Gratuit</span>
      </div>

      {/* Quick Action Controls (3D Mode & GPS Center) */}
      <div className="absolute bottom-4 right-3 z-[10] flex flex-col gap-2">
        <button
          type="button"
          onClick={toggle3D}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition flex items-center gap-1 text-xs font-black ${
            is3DMode
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Bascule Vue 3D / 2D"
        >
          <Compass className={`w-4 h-4 ${is3DMode ? 'animate-spin' : ''}`} />
          <span className="text-[11px] font-bold">{is3DMode ? 'Mode 3D Actif' : 'Vue 3D'}</span>
        </button>

        {userCoords && (
          <button
            type="button"
            onClick={centerOnUser}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold shadow-xl backdrop-blur-md transition flex items-center gap-1 text-xs"
            title="Centrer sur ma position GPS"
          >
            <Navigation className="w-4 h-4" />
            <span className="text-[11px]">Ma Position</span>
          </button>
        )}
      </div>

      {/* Canvas container for WebGL Map */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};
