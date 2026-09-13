/**
 * Professional GIS Vector SVG Icons and Visual Hierarchy System for Map Incidents
 * Implements strict semantic colors, sizing hierarchy, and vector iconography.
 */

export interface IncidentVisualConfig {
  typeLabel: string;
  category: string;
  sizePx: number;
  iconSvg: string;
  colorHex: string;
  bgGradientClass: string;
  pulseColor: string;
  severityBadgeClass: string;
  zIndex: number;
}

// Crisp Vector SVGs for every hazard and transportation incident category
export const INCIDENT_SVG_ICONS = {
  landslide: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
      <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.18"/>
      <circle cx="17" cy="6" r="1.5" fill="currentColor"/>
    </svg>
  `,
  flood: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  `,
  road_closure: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="m9 9 6 6"/>
      <path d="m15 9-6 6"/>
    </svg>
  `,
  accident: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
      <path d="m11 2 2 4"/>
      <path d="m15 3-1 3"/>
    </svg>
  `,
  traffic: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <rect width="14" height="18" x="5" y="3" rx="2"/>
      <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
    </svg>
  `,
  weather: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
      <path d="m13 14-2 4h3l-2 4"/>
    </svg>
  `,
  bridge: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M4 19V5M20 19V5M2 8h20M2 14h20M7 8v6M12 8v6M17 8v6"/>
    </svg>
  `,
  earthquake: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="m2 12 5-5 4 8 4-6 7 3"/>
      <path d="M6 19h12"/>
      <path d="M9 22h6"/>
    </svg>
  `,
  construction: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="M2 22h20"/>
      <path d="M17 2v20"/>
      <path d="M7 2v20"/>
      <path d="M2 7h20"/>
      <path d="M2 17h20"/>
    </svg>
  `,
  default_hazard: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
};

/**
 * Resolves visual appearance, dimensions, and styling according to the strict Incident Hierarchy.
 */
export function getIncidentVisualConfig(
  typeRaw?: string,
  severityRaw?: string,
  isSpiderfied = false
): IncidentVisualConfig {
  const type = (typeRaw || "hazard").toLowerCase();
  const severity = (severityRaw || "MEDIUM").toUpperCase();

  // 1. Resolve Category & SVG
  let category = "default_hazard";
  let typeLabel = "Operational Hazard";
  let iconSvg = INCIDENT_SVG_ICONS.default_hazard;

  if (type.includes("landslide") || type.includes("rockfall") || type.includes("debris") || type.includes("slip") || type.includes("mudslide")) {
    category = "landslide";
    typeLabel = "Landslide / Slip";
    iconSvg = INCIDENT_SVG_ICONS.landslide;
  } else if (type.includes("flood") || type.includes("inundat") || type.includes("waterlog") || type.includes("river")) {
    category = "flood";
    typeLabel = "Flash Flood";
    iconSvg = INCIDENT_SVG_ICONS.flood;
  } else if (type.includes("closure") || type.includes("blocked") || type.includes("cut off") || type.includes("barrier")) {
    category = "road_closure";
    typeLabel = "Road Blockage";
    iconSvg = INCIDENT_SVG_ICONS.road_closure;
  } else if (type.includes("accident") || type.includes("collision") || type.includes("crash") || type.includes("overturn")) {
    category = "accident";
    typeLabel = "Traffic Accident";
    iconSvg = INCIDENT_SVG_ICONS.accident;
  } else if (type.includes("traffic") || type.includes("congestion") || type.includes("convoy_slowdown")) {
    category = "traffic";
    typeLabel = "Heavy Congestion";
    iconSvg = INCIDENT_SVG_ICONS.traffic;
  } else if (type.includes("weather") || type.includes("rain") || type.includes("cloudburst") || type.includes("storm") || type.includes("cyclone")) {
    category = "weather";
    typeLabel = "Severe Weather";
    iconSvg = INCIDENT_SVG_ICONS.weather;
  } else if (type.includes("bridge") || type.includes("culvert") || type.includes("structural")) {
    category = "bridge";
    typeLabel = "Bridge Damage";
    iconSvg = INCIDENT_SVG_ICONS.bridge;
  } else if (type.includes("earthquake") || type.includes("seismic") || type.includes("tremor")) {
    category = "earthquake";
    typeLabel = "Seismic Activity";
    iconSvg = INCIDENT_SVG_ICONS.earthquake;
  } else if (type.includes("construction") || type.includes("roadwork") || type.includes("repair")) {
    category = "construction";
    typeLabel = "Road Repair";
    iconSvg = INCIDENT_SVG_ICONS.construction;
  }

  // 2. Resolve Size Hierarchy & Semantic Colors
  let sizePx = 26;
  let colorHex = "#ca8a04";
  let bgGradientClass = "bg-gradient-to-tr from-amber-500 to-yellow-500 shadow-amber-500/40 border-amber-200";
  let pulseColor = "bg-amber-400";
  let severityBadgeClass = "bg-amber-50 border-amber-200 text-amber-700";
  let zIndex = 20;

  if (severity === "CRITICAL") {
    sizePx = isSpiderfied ? 30 : 34;
    colorHex = "#dc2626";
    bgGradientClass = "bg-gradient-to-tr from-rose-700 via-red-600 to-rose-500 shadow-rose-600/50 border-rose-200";
    pulseColor = "bg-rose-500";
    severityBadgeClass = "bg-rose-50 border-rose-200 text-rose-700";
    zIndex = 40;
  } else if (severity === "HIGH") {
    sizePx = isSpiderfied ? 26 : 28;
    colorHex = "#ea580c";
    bgGradientClass = "bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-500 shadow-orange-500/50 border-orange-200";
    pulseColor = "bg-orange-500";
    severityBadgeClass = "bg-orange-50 border-orange-200 text-orange-700";
    zIndex = 30;
  } else if (severity === "MEDIUM") {
    sizePx = isSpiderfied ? 22 : 24;
    colorHex = "#d97706";
    bgGradientClass = "bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 shadow-amber-500/40 border-amber-200";
    pulseColor = "bg-amber-400";
    severityBadgeClass = "bg-amber-50 border-amber-200 text-amber-700";
    zIndex = 20;
  } else if (severity === "LOW") {
    sizePx = isSpiderfied ? 18 : 20;
    colorHex = "#0284c7";
    bgGradientClass = "bg-gradient-to-tr from-sky-500 to-blue-600 shadow-blue-500/40 border-blue-200";
    pulseColor = "bg-sky-400";
    severityBadgeClass = "bg-blue-50 border-blue-200 text-blue-700";
    zIndex = 10;
  }

  return {
    typeLabel,
    category,
    sizePx,
    iconSvg,
    colorHex,
    bgGradientClass,
    pulseColor,
    severityBadgeClass,
    zIndex,
  };
}

/**
 * Creates an interactive cluster badge element for grouped incidents.
 */
export function createClusterBadgeMarkup(
  count: number,
  maxSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
): string {
  let bgGradient = "from-amber-500 to-yellow-500 border-amber-200 text-white shadow-amber-500/50";
  let pulseRing = "bg-amber-400/40";
  let ringBorder = "border-amber-300";

  if (maxSeverity === "CRITICAL") {
    bgGradient = "from-rose-600 via-red-600 to-rose-700 border-rose-200 text-white shadow-rose-600/60";
    pulseRing = "bg-rose-500/40";
    ringBorder = "border-rose-400";
  } else if (maxSeverity === "HIGH") {
    bgGradient = "from-orange-600 via-amber-600 to-orange-500 border-orange-200 text-white shadow-orange-500/50";
    pulseRing = "bg-orange-500/40";
    ringBorder = "border-orange-300";
  } else if (maxSeverity === "LOW") {
    bgGradient = "from-sky-500 to-blue-600 border-blue-200 text-white shadow-blue-500/50";
    pulseRing = "bg-sky-400/40";
    ringBorder = "border-sky-300";
  }

  const badgeSize = count > 99 ? 44 : count > 9 ? 38 : 34;

  return `
    <div class="relative flex items-center justify-center cursor-pointer group select-none transition-transform hover:scale-110 active:scale-95" style="width: ${badgeSize}px; height: ${badgeSize}px;">
      <!-- Outer Soft Pulse Ring -->
      <span class="absolute -inset-2 rounded-full ${pulseRing} animate-ping opacity-60"></span>
      <span class="absolute -inset-1 rounded-full ${pulseRing} animate-pulse opacity-80"></span>

      <!-- Core Cluster Circle -->
      <div class="relative w-full h-full rounded-full bg-gradient-to-tr ${bgGradient} border-2 border-white shadow-floating flex items-center justify-center font-black font-mono text-xs tracking-tight">
        <span>${count}</span>
      </div>

      <!-- Severity Dot Indicator -->
      <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full ${
        maxSeverity === "CRITICAL" ? "bg-red-500" : maxSeverity === "HIGH" ? "bg-amber-500" : "bg-sky-400"
      } border-2 border-white"></div>
    </div>
  `;
}
