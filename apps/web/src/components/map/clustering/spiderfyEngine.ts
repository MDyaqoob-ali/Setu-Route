/**
 * Spiderfy / Radial Expansion Engine for MapLibre GL
 * Calculates radial offsets for overlapping or co-located map incidents
 * without modifying their underlying geographic ground coordinates.
 */

import maplibregl from "maplibre-gl";

export interface SpiderfyPoint {
  id: string;
  lng: number;
  lat: number;
  data: any;
}

export interface SpiderfiedNode {
  point: SpiderfyPoint;
  anchorLngLat: [number, number];
  displayLngLat: [number, number];
  screenOffset: { x: number; y: number };
  angleRad: number;
}

export interface SpiderfyClusterResult {
  anchorLngLat: [number, number];
  nodes: SpiderfiedNode[];
}

/**
 * Calculates radial spiderfy expansion for a set of co-located or dense points.
 * For N <= 8, arranges in a single equidistant circle.
 * For N > 8, arranges in two concentric spiral rings.
 *
 * @param map MapLibre GL map instance
 * @param points List of points sharing the cluster anchor
 * @param baseRadiusPx Radius in screen pixels for single-ring expansion (default: 65px)
 */
export function generateSpiderfyLayout(
  map: maplibregl.Map,
  points: SpiderfyPoint[],
  baseRadiusPx = 65
): SpiderfyClusterResult | null {
  if (!points || points.length === 0) return null;

  // Compute central anchor (centroid)
  let sumLng = 0;
  let sumLat = 0;
  points.forEach((p) => {
    sumLng += p.lng;
    sumLat += p.lat;
  });
  const anchorLngLat: [number, number] = [
    sumLng / points.length,
    sumLat / points.length,
  ];

  const centerPixel = map.project(anchorLngLat);
  const count = points.length;
  const nodes: SpiderfiedNode[] = [];

  if (count === 1) {
    // Single point: no offset needed
    nodes.push({
      point: points[0],
      anchorLngLat,
      displayLngLat: [points[0].lng, points[0].lat],
      screenOffset: { x: 0, y: 0 },
      angleRad: 0,
    });
    return { anchorLngLat, nodes };
  }

  const isTwoRings = count > 8;
  const innerCount = isTwoRings ? Math.ceil(count * 0.4) : count;
  const outerCount = isTwoRings ? count - innerCount : 0;

  points.forEach((p, idx) => {
    let radius = baseRadiusPx;
    let angle = 0;

    if (!isTwoRings) {
      // Single ring equidistant spacing, starting at top (-PI / 2)
      angle = -Math.PI / 2 + (2 * Math.PI * idx) / count;
      radius = count >= 6 ? baseRadiusPx + 15 : baseRadiusPx;
    } else {
      if (idx < innerCount) {
        // Inner ring
        radius = baseRadiusPx - 10;
        angle = -Math.PI / 2 + (2 * Math.PI * idx) / innerCount;
      } else {
        // Outer ring (staggered angle)
        const outerIdx = idx - innerCount;
        radius = baseRadiusPx + 38;
        angle = -Math.PI / 2 + (2 * Math.PI * (outerIdx + 0.5)) / outerCount;
      }
    }

    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    const projectedPos = new maplibregl.Point(
      centerPixel.x + offsetX,
      centerPixel.y + offsetY
    );
    const displayLngLatObj = map.unproject(projectedPos);
    const displayLngLat: [number, number] = [
      displayLngLatObj.lng,
      displayLngLatObj.lat,
    ];

    nodes.push({
      point: p,
      anchorLngLat,
      displayLngLat,
      screenOffset: { x: offsetX, y: offsetY },
      angleRad: angle,
    });
  });

  return { anchorLngLat, nodes };
}

/**
 * Calculates haversine ground distance between two coordinates in meters.
 */
export function getDistanceMeters(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Groups nearby incidents into clusters based on screen pixel distance or ground meters.
 */
export function groupNearbyIncidents(
  map: maplibregl.Map,
  incidents: any[],
  pixelThreshold = 42
): Array<{
  isCluster: boolean;
  centerLngLat: [number, number];
  items: any[];
  maxSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}> {
  const clusters: Array<{
    isCluster: boolean;
    centerLngLat: [number, number];
    items: any[];
    maxSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  }> = [];

  const visited = new Set<string>();

  const severityWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const getWeight = (sev?: string) => severityWeight[(sev || "LOW").toUpperCase()] || 1;

  for (let i = 0; i < incidents.length; i++) {
    const incA = incidents[i];
    const idA = incA.id || `inc-${i}`;
    if (visited.has(idA)) continue;

    const coordsA: [number, number] = [
      incA.longitude ?? incA.lng ?? 92.0,
      incA.latitude ?? incA.lat ?? 26.0,
    ];
    if (isNaN(coordsA[0]) || isNaN(coordsA[1])) continue;

    const pA = map.project(coordsA);
    const clusterItems = [incA];
    visited.add(idA);

    for (let j = i + 1; j < incidents.length; j++) {
      const incB = incidents[j];
      const idB = incB.id || `inc-${j}`;
      if (visited.has(idB)) continue;

      const coordsB: [number, number] = [
        incB.longitude ?? incB.lng ?? 92.0,
        incB.latitude ?? incB.lat ?? 26.0,
      ];
      if (isNaN(coordsB[0]) || isNaN(coordsB[1])) continue;

      const pB = map.project(coordsB);
      const dx = pA.x - pB.x;
      const dy = pA.y - pB.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      // Check pixel overlap threshold OR ground proximity (< 250m)
      const distM = getDistanceMeters(coordsA[0], coordsA[1], coordsB[0], coordsB[1]);

      if (distPx <= pixelThreshold || distM <= 250) {
        clusterItems.push(incB);
        visited.add(idB);
      }
    }

    // Determine max severity in group
    let maxSev: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
    let maxW = 0;
    clusterItems.forEach((item) => {
      const sev = (item.severity || "LOW").toUpperCase();
      const w = getWeight(sev);
      if (w > maxW) {
        maxW = w;
        maxSev = sev as any;
      }
    });

    // Compute cluster center
    let cLng = 0;
    let cLat = 0;
    clusterItems.forEach((item) => {
      cLng += item.longitude ?? item.lng ?? 92.0;
      cLat += item.latitude ?? item.lat ?? 26.0;
    });
    cLng /= clusterItems.length;
    cLat /= clusterItems.length;

    clusters.push({
      isCluster: clusterItems.length > 1,
      centerLngLat: [cLng, cLat],
      items: clusterItems,
      maxSeverity: maxSev,
    });
  }

  return clusters;
}
