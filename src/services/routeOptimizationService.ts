// Source: Google Maps Platform Code Assist
import { DeliveryStop, RouteOptimizationResult, RouteOptimizationLeg, Delivery } from '../types';

// Polyline decoder for Google Maps encoded polylines
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  if (!encoded) return [];
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// Haversine distance calculator in meters between two coordinates
export function getHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Convert active deliveries to delivery stops
export function convertDeliveriesToStops(
  deliveries: Delivery[],
  currentDriverCoords?: { lat: number; lng: number }
): { origin: DeliveryStop; intermediateStops: DeliveryStop[]; destination?: DeliveryStop } {
  // Origin is driver current position or first pickup
  const origin: DeliveryStop = {
    id: 'origin_driver',
    label: 'Position Actuelle du Livreur (Départ)',
    address: 'Point de départ / Hub',
    city: 'Cotonou',
    lat: currentDriverCoords?.lat || (deliveries[0] ? deliveries[0].driverLat : 6.3703),
    lng: currentDriverCoords?.lng || (deliveries[0] ? deliveries[0].driverLng : 2.4183),
    stopType: 'depot',
  };

  const intermediateStops: DeliveryStop[] = deliveries.map((d, index) => ({
    id: `stop_${d.id}`,
    deliveryId: d.id,
    label: `Stop #${index + 1} - ${d.clientPseudo}`,
    address: d.dropoffAddress,
    city: d.dropoffCity,
    lat: d.targetLat || 6.3622,
    lng: d.targetLng || 2.3951,
    contactName: d.clientPseudo,
    contactPhone: d.clientPhone,
    packageDescription: d.packageDescription,
    stopType: 'dropoff',
    status: d.status,
    securityPin: d.securityPin,
    fee: d.deliveryFee,
  }));

  return { origin, intermediateStops };
}

// Local Fallback Heuristic TSP (Nearest-Neighbor with 2-Opt refinement)
export function calculateLocalHeuristicOptimization(
  origin: DeliveryStop,
  intermediates: DeliveryStop[],
  destination?: DeliveryStop
): RouteOptimizationResult {
  const stopsToOrder = [...intermediates];
  const n = stopsToOrder.length;

  if (n <= 1) {
    const ordered = [origin, ...stopsToOrder];
    if (destination) ordered.push(destination);

    let totalDist = 0;
    const legs: RouteOptimizationLeg[] = [];
    for (let i = 0; i < ordered.length - 1; i++) {
      const legDist = getHaversineDistanceMeters(
        ordered[i].lat,
        ordered[i].lng,
        ordered[i + 1].lat,
        ordered[i + 1].lng
      );
      totalDist += legDist;
      legs.push({
        distanceMeters: legDist,
        durationSeconds: Math.round(legDist / 7), // ~25 km/h urban moto speed
        startAddress: ordered[i].address,
        endAddress: ordered[i + 1].address,
        startLocation: { lat: ordered[i].lat, lng: ordered[i].lng },
        endLocation: { lat: ordered[i + 1].lat, lng: ordered[i + 1].lng },
      });
    }

    const navUrl = buildGoogleMapsMultiStopUrl(origin, stopsToOrder, destination);

    return {
      totalDistanceMeters: totalDist,
      totalDurationSeconds: Math.round(totalDist / 7),
      optimizedOrder: stopsToOrder.map((_, i) => i),
      orderedStops: ordered,
      legs,
      savings: {
        distanceMetersSaved: 0,
        timeMinutesSaved: 0,
        fuelSavedFcfa: 0,
        percentageSaved: 0,
      },
      googleMapsNavigationUrl: navUrl,
      isLiveGoogleMapsApi: false,
      algorithmNote: 'Algorithme Heuristique Local Liencolis (1 seul arrêt)',
      calculatedAt: new Date().toISOString(),
    };
  }

  // Calculate unoptimized baseline distance (FIFO / original order)
  let unoptimizedDistance = 0;
  let curr = origin;
  for (let i = 0; i < n; i++) {
    unoptimizedDistance += getHaversineDistanceMeters(curr.lat, curr.lng, stopsToOrder[i].lat, stopsToOrder[i].lng);
    curr = stopsToOrder[i];
  }
  if (destination) {
    unoptimizedDistance += getHaversineDistanceMeters(curr.lat, curr.lng, destination.lat, destination.lng);
  }

  // Nearest-Neighbor construction
  const visited: boolean[] = new Array(n).fill(false);
  const optimizedIndices: number[] = [];
  let currentLat = origin.lat;
  let currentLng = origin.lng;

  for (let step = 0; step < n; step++) {
    let nearestIdx = -1;
    let minDistance = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        const d = getHaversineDistanceMeters(currentLat, currentLng, stopsToOrder[i].lat, stopsToOrder[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }
    }

    if (nearestIdx !== -1) {
      visited[nearestIdx] = true;
      optimizedIndices.push(nearestIdx);
      currentLat = stopsToOrder[nearestIdx].lat;
      currentLng = stopsToOrder[nearestIdx].lng;
    }
  }

  // 2-Opt Optimization pass
  let improved = true;
  let passes = 0;
  while (improved && passes < 10) {
    improved = false;
    passes++;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        // Evaluate swap
        const prevNode = i === 0 ? origin : stopsToOrder[optimizedIndices[i - 1]];
        const nodeA = stopsToOrder[optimizedIndices[i]];
        const nodeB = stopsToOrder[optimizedIndices[k]];
        const nextNode = k === n - 1 ? destination || nodeB : stopsToOrder[optimizedIndices[k + 1]];

        const currentDist =
          getHaversineDistanceMeters(prevNode.lat, prevNode.lng, nodeA.lat, nodeA.lng) +
          getHaversineDistanceMeters(nodeB.lat, nodeB.lng, nextNode.lat, nextNode.lng);

        const newDist =
          getHaversineDistanceMeters(prevNode.lat, prevNode.lng, nodeB.lat, nodeB.lng) +
          getHaversineDistanceMeters(nodeA.lat, nodeA.lng, nextNode.lat, nextNode.lng);

        if (newDist < currentDist - 20) {
          // Reverse segment from i to k
          let left = i;
          let right = k;
          while (left < right) {
            const temp = optimizedIndices[left];
            optimizedIndices[left] = optimizedIndices[right];
            optimizedIndices[right] = temp;
            left++;
            right--;
          }
          improved = true;
        }
      }
    }
  }

  // Build final ordered list
  const orderedStops: DeliveryStop[] = [origin];
  optimizedIndices.forEach((idx) => {
    orderedStops.push(stopsToOrder[idx]);
  });
  if (destination) {
    orderedStops.push(destination);
  }

  // Build legs and total distance
  let totalDist = 0;
  const legs: RouteOptimizationLeg[] = [];
  for (let i = 0; i < orderedStops.length - 1; i++) {
    const legDist = getHaversineDistanceMeters(
      orderedStops[i].lat,
      orderedStops[i].lng,
      orderedStops[i + 1].lat,
      orderedStops[i + 1].lng
    );
    // Multiply haversine by 1.25 to account for urban road winding
    const realisticDist = Math.round(legDist * 1.25);
    totalDist += realisticDist;
    legs.push({
      distanceMeters: realisticDist,
      durationSeconds: Math.round(realisticDist / 7),
      startAddress: orderedStops[i].address,
      endAddress: orderedStops[i + 1].address,
      startLocation: { lat: orderedStops[i].lat, lng: orderedStops[i].lng },
      endLocation: { lat: orderedStops[i + 1].lat, lng: orderedStops[i + 1].lng },
    });
  }

  const rawUnoptimized = Math.round(unoptimizedDistance * 1.25);
  const distanceSaved = Math.max(0, rawUnoptimized - totalDist);
  const timeMinutesSaved = Math.round(distanceSaved / 420); // ~25km/h
  // Bénin Moto Gas Cost: ~650 FCFA/liter, ~3.2 L / 100 km => ~20.8 FCFA per km
  const fuelSavedFcfa = Math.round((distanceSaved / 1000) * 21);
  const percentageSaved = rawUnoptimized > 0 ? Math.round((distanceSaved / rawUnoptimized) * 100) : 0;

  const navUrl = buildGoogleMapsMultiStopUrl(
    origin,
    optimizedIndices.map((i) => stopsToOrder[i]),
    destination
  );

  return {
    totalDistanceMeters: totalDist,
    totalDurationSeconds: Math.round(totalDist / 7),
    optimizedOrder: optimizedIndices,
    orderedStops,
    legs,
    savings: {
      distanceMetersSaved: distanceSaved,
      timeMinutesSaved,
      fuelSavedFcfa,
      percentageSaved,
    },
    googleMapsNavigationUrl: navUrl,
    isLiveGoogleMapsApi: false,
    algorithmNote: 'Optimisation Heuristique TSP 2-Opt (Local & Offline)',
    calculatedAt: new Date().toISOString(),
  };
}

// Builds a Google Maps deep link for multi-stop routing
export function buildGoogleMapsMultiStopUrl(
  origin: DeliveryStop,
  orderedIntermediates: DeliveryStop[],
  destination?: DeliveryStop
): string {
  const originStr = `${origin.lat},${origin.lng}`;
  const finalDest = destination || orderedIntermediates[orderedIntermediates.length - 1] || origin;
  const destStr = `${finalDest.lat},${finalDest.lng}`;

  // Intermediate waypoints
  const waypointsList = destination
    ? orderedIntermediates
    : orderedIntermediates.slice(0, orderedIntermediates.length - 1);

  const waypointsStr = waypointsList.map((s) => `${s.lat},${s.lng}`).join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    originStr
  )}&destination=${encodeURIComponent(destStr)}`;

  if (waypointsStr) {
    url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
  }

  url += '&travelmode=two-wheeler';
  return url;
}

// Call Google Maps Routes API (Compute Routes with optimizeWaypointOrder: true)
export async function optimizeDeliveryRoute(
  origin: DeliveryStop,
  intermediates: DeliveryStop[],
  destination?: DeliveryStop,
  travelMode: 'TWO_WHEELER' | 'DRIVE' = 'TWO_WHEELER'
): Promise<RouteOptimizationResult> {
  if (!intermediates || intermediates.length === 0) {
    return calculateLocalHeuristicOptimization(origin, [], destination);
  }

  try {
    const payload = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng,
          },
        },
      },
      destination: destination
        ? {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          }
        : {
            location: {
              latLng: {
                latitude: intermediates[intermediates.length - 1].lat,
                longitude: intermediates[intermediates.length - 1].lng,
              },
            },
          },
      intermediates: destination
        ? intermediates.map((s) => ({
            location: {
              latLng: {
                latitude: s.lat,
                longitude: s.lng,
              },
            },
          }))
        : intermediates.slice(0, intermediates.length - 1).map((s) => ({
            location: {
              latLng: {
                latitude: s.lat,
                longitude: s.lng,
              },
            },
          })),
      travelMode: travelMode,
      optimizeWaypointOrder: true,
    };

    const response = await fetch('/api/routes/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('Google Maps Routes API endpoint returned non-200, falling back to local TSP:', response.status);
      return calculateLocalHeuristicOptimization(origin, intermediates, destination);
    }

    const data = await response.json();

    if (data.error || !data.routes || data.routes.length === 0) {
      console.warn('Google Maps API response has error or no routes, using local optimizer:', data.error);
      return calculateLocalHeuristicOptimization(origin, intermediates, destination);
    }

    const route = data.routes[0];
    const optimizedIndexOrder: number[] = route.optimizedIntermediateWaypointIndex || [];

    // Reorder the intermediate stops based on Google Maps returned indices
    const subIntermediates = destination ? intermediates : intermediates.slice(0, intermediates.length - 1);
    const reorderedIntermediates: DeliveryStop[] = [];

    if (optimizedIndexOrder.length > 0) {
      optimizedIndexOrder.forEach((idx) => {
        if (subIntermediates[idx]) {
          reorderedIntermediates.push(subIntermediates[idx]);
        }
      });
      // Add any remaining
      subIntermediates.forEach((s, idx) => {
        if (!optimizedIndexOrder.includes(idx)) {
          reorderedIntermediates.push(s);
        }
      });
    } else {
      reorderedIntermediates.push(...subIntermediates);
    }

    if (!destination && intermediates.length > 0) {
      reorderedIntermediates.push(intermediates[intermediates.length - 1]);
    }

    const orderedStops: DeliveryStop[] = [origin, ...reorderedIntermediates];
    if (destination) {
      orderedStops.push(destination);
    }

    // Process route legs
    const legs: RouteOptimizationLeg[] = (route.legs || []).map((leg: any, index: number) => ({
      distanceMeters: leg.distanceMeters || 1000,
      durationSeconds: parseInt((leg.duration || '300s').replace('s', '')) || 300,
      startAddress: orderedStops[index]?.address,
      endAddress: orderedStops[index + 1]?.address,
      startLocation: {
        lat: leg.startLocation?.latLng?.latitude || orderedStops[index]?.lat || 0,
        lng: leg.startLocation?.latLng?.longitude || orderedStops[index]?.lng || 0,
      },
      endLocation: {
        lat: leg.endLocation?.latLng?.latitude || orderedStops[index + 1]?.lat || 0,
        lng: leg.endLocation?.latLng?.longitude || orderedStops[index + 1]?.lng || 0,
      },
    }));

    const totalDistance = route.distanceMeters || legs.reduce((acc, l) => acc + l.distanceMeters, 0);
    const durationSeconds = parseInt((route.duration || '600s').replace('s', '')) || 600;

    // Estimate unoptimized distance for comparison
    const unopt = calculateLocalHeuristicOptimization(origin, intermediates, destination);
    const distanceSaved = Math.max(0, unopt.totalDistanceMeters - totalDistance);
    const timeMinutesSaved = Math.round(distanceSaved / 400);
    const fuelSavedFcfa = Math.round((distanceSaved / 1000) * 21);
    const percentageSaved =
      unopt.totalDistanceMeters > 0 ? Math.round((distanceSaved / unopt.totalDistanceMeters) * 100) : 0;

    const navUrl = buildGoogleMapsMultiStopUrl(origin, reorderedIntermediates, destination);
    const polylineCoords = route.polyline?.encodedPolyline ? decodePolyline(route.polyline.encodedPolyline) : [];

    return {
      totalDistanceMeters: totalDistance,
      totalDurationSeconds: durationSeconds,
      optimizedOrder: optimizedIndexOrder,
      orderedStops,
      legs,
      savings: {
        distanceMetersSaved: distanceSaved,
        timeMinutesSaved,
        fuelSavedFcfa,
        percentageSaved,
      },
      encodedPolyline: route.polyline?.encodedPolyline,
      polylineCoordinates: polylineCoords,
      googleMapsNavigationUrl: navUrl,
      isLiveGoogleMapsApi: true,
      algorithmNote: 'Calculé en direct via Google Maps Routes API (Waypoint Optimization)',
      calculatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error contacting Google Maps Routes API:', err);
    return calculateLocalHeuristicOptimization(origin, intermediates, destination);
  }
}
