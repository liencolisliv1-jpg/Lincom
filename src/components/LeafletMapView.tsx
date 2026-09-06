import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Delivery } from '../types';
import { resolveCoordinates } from './GoogleMapView';
import { Navigation, MapPin, Package, Phone, ExternalLink } from 'lucide-react';

interface LeafletMapViewProps {
  deliveries: Delivery[];
  selectedDeliveryId?: string;
  onSelectDelivery?: (deliveryId: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  className?: string;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  deliveries = [],
  selectedDeliveryId,
  onSelectDelivery,
  userCoords,
  className = 'w-full h-80 sm:h-96',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const selectedDelivery = safeDeliveries.find((d) => d.id === selectedDeliveryId) || safeDeliveries[0] || null;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = userCoords
      ? [userCoords.lat, userCoords.lng]
      : selectedDelivery
      ? [
          resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress).lat,
          resolveCoordinates(selectedDelivery.dropoffCity, selectedDelivery.dropoffAddress).lng,
        ]
      : [6.3703, 2.4183]; // Cotonou centre

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    });

    // OpenStreetMap high-speed tile layer (100% Free & Open Source)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Pan when deliveries, selection or GPS changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Plot Driver GPS Marker if available
    if (userCoords) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #10B981; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #022c22; font-weight: 900; font-size: 14px;">
              🛵
            </div>
            <div style="background: #022c22; color: #6ee7b7; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 6px; border: 1px solid #10b981; margin-top: 2px; white-space: nowrap;">
              Vous (Chauffeur)
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24],
      });

      const driverMarker = L.marker([userCoords.lat, userCoords.lng], { icon: driverIcon });
      driverMarker.bindPopup('<b style="color:#0f172a;">📍 Votre Position GPS Actuelle</b>');
      driverMarker.addTo(markersGroup);
      bounds.extend([userCoords.lat, userCoords.lng]);
    }

    // 2. Plot Delivery Markers
    safeDeliveries.forEach((del, idx) => {
      const coords = resolveCoordinates(del.dropoffCity, del.dropoffAddress);
      const isSelected = del.id === selectedDeliveryId;
      const displayName = del.recipientName || del.clientPseudo || 'Destinataire';

      const deliveryIcon = L.divIcon({
        className: 'custom-delivery-icon',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="width: 30px; height: 30px; border-radius: 50%; background: ${
              isSelected ? '#f59e0b' : '#2563eb'
            }; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 11px;">
              #${idx + 1}
            </div>
            <div style="background: #0f172a; color: ${
              isSelected ? '#fde68a' : '#f8fafc'
            }; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 6px; border: 1px solid ${
          isSelected ? '#f59e0b' : '#334155'
        }; margin-top: 2px; white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis;">
              ${displayName}
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: deliveryIcon });

      // Popup details
      const popupHtml = `
        <div style="padding: 4px; font-family: sans-serif; color: #0f172a; min-width: 170px;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 3px; color: #020617;">
            📦 ${displayName}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            📍 ${del.dropoffAddress}, ${del.dropoffCity}
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #059669; margin-bottom: 6px;">
            Tarif: ${del.deliveryFee || 1500} FCFA (PIN #${del.securityPin || '---'})
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

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectDelivery) onSelectDelivery(del.id);
      });

      marker.addTo(markersGroup);
      bounds.extend([coords.lat, coords.lng]);

      // Connect line between driver & selected delivery
      if (userCoords && isSelected) {
        L.polyline(
          [
            [userCoords.lat, userCoords.lng],
            [coords.lat, coords.lng],
          ],
          {
            color: '#10b981',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.85,
          }
        ).addTo(markersGroup);
      }
    });

    if (bounds.isValid() && safeDeliveries.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [safeDeliveries, selectedDeliveryId, userCoords]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 ${className}`}>
      {/* Top Banner indicating OpenStreetMap 100% Free */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white shadow-lg pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="font-black text-emerald-300">OpenStreetMap Bénin (100% Gratuit)</span>
        <span className="text-slate-400 text-[10px] hidden sm:inline">Sans Clé API</span>
      </div>

      {/* Direct Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" style={{ zIndex: 1 }} />
    </div>
  );
};
