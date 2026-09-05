import { STAGES, type StageDef } from "./catalog";

/**
 * PLAYER SELECT map contract (Pixel + code).
 *
 * Locked Brandon plate C (`select-map-plate-C.png`) is a framed 1920×1080
 * oval (PLAYER SELECT chrome + Lower Peninsula). Landmark dots stay in code
 * from WGS84 so Free Play can highlight / pick stages.
 *
 *   lon −76.76 … −76.28
 *   lat  36.955 … 37.30
 *
 * Raw / SVG placeholder plates are a full-bleed north-up rectangle:
 *   u = (lon − lonMin) / (lonMax − lonMin)     // 0 = west
 *   v = 1 − (lat − latMin) / (latMax − latMin) // 0 = north
 *
 * Framed plate C maps that same UV into `PLATE_C_MAP_RECT` (fitted to the
 * painted landmarks). Plot aspect uses a 37.13°N standard parallel so 1° of
 * longitude is not stretched to the same pixel length as 1° of latitude.
 *
 * `export-assets` writes `plate.json` so SelectScene loads screen C + plate C
 * instead of the SVG placeholder alone.
 */
export interface StageGeo {
  id: string;
  short: string;
  lon: number;
  lat: number;
  /** Nudge labels so neighbors (Lions / Mariners, Hilton pair) do not stack. */
  labelDx?: number;
  labelDy?: number;
}

/** West / south / east / north crop around Williamsburg → Poquoson / JR Bridge. */
export const PENINSULA_BOUNDS = {
  lonMin: -76.76,
  lonMax: -76.28,
  latMin: 36.955,
  latMax: 37.3,
} as const;

/** SF2 oval chrome for the raw / SVG geo plate (letterboxed plot inside). */
export const SELECT_MAP_CHROME = { w: 500, h: 360 } as const;

/** 16:9 chrome that shows framed plate C without squashing the oval. */
export const SELECT_MAP_CHROME_C = { w: 620, h: 349 } as const;

/** Raw geo-rectangle placeholder (SVG / future full-bleed PNG). */
export const PIXEL_PLATE_PX = { width: 1111, height: 1000 } as const;

/** Locked framed map plate C. */
export const PLATE_C_PX = { width: 1920, height: 1080 } as const;

/**
 * Lon/lat box inside framed plate C, in plate pixels.
 * Least-squares fit to painted COLONIAL…SHIPYARD landmarks (~27px RMSE).
 */
export const PLATE_C_MAP_RECT = { x: 476.65, y: 152.15, w: 976.62, h: 864.18 } as const;

export const STAGE_GEO: StageGeo[] = [
  { id: "colonial", short: "Colonial", lon: -76.7, lat: 37.271, labelDy: -10 },
  { id: "busch", short: "Busch", lon: -76.646, lat: 37.234, labelDx: 10 },
  { id: "nnpark", short: "NN Park", lon: -76.556, lat: 37.187, labelDy: -10 },
  { id: "phmall", short: "PH Mall", lon: -76.508, lat: 37.11, labelDx: -16 },
  { id: "oysterpoint", short: "Oyster Pt", lon: -76.492, lat: 37.088, labelDx: 14 },
  { id: "stadium", short: "Todd Stad", lon: -76.501, lat: 37.082, labelDy: 11 },
  { id: "axsomDojo", short: "Axsom", lon: -76.495, lat: 37.075, labelDx: -14 },
  { id: "subwaywarwick", short: "Warwick", lon: -76.518, lat: 37.072, labelDx: -18, labelDy: 8 },
  { id: "lionsBridge", short: "Lions Br.", lon: -76.489, lat: 37.055, labelDx: -16 },
  { id: "mariners", short: "Mariners", lon: -76.487, lat: 37.05, labelDx: 16, labelDy: 8 },
  { id: "hiltonElementary", short: "Hilton", lon: -76.455, lat: 37.028, labelDy: -10 },
  { id: "hiltonvillage", short: "Hilton Vlg", lon: -76.462, lat: 37.02, labelDy: 10 },
  { id: "hampton", short: "Hampton", lon: -76.345, lat: 37.025, labelDx: 12 },
  { id: "poquoson", short: "Poquoson", lon: -76.346, lat: 37.122, labelDx: 14 },
  { id: "shipyard", short: "Shipyard", lon: -76.438, lat: 36.978, labelDy: 10 },
  { id: "jrbridge", short: "JR Bridge", lon: -76.478, lat: 36.993, labelDx: -16 },
];

/**
 * Lower Peninsula shoreline in WGS84 (same projection as the dots).
 * Clockwise from the James River west crop: James → Hampton Roads →
 * Chesapeake → York → west close. Placeholder only — Pixel plate replaces it.
 */
export const PENINSULA_SHORE: ReadonlyArray<{ lon: number; lat: number }> = [
  { lon: -76.758, lat: 37.208 },
  { lon: -76.7, lat: 37.21 },
  { lon: -76.648, lat: 37.205 },
  { lon: -76.6, lat: 37.175 },
  { lon: -76.586, lat: 37.16 },
  { lon: -76.575, lat: 37.132 },
  { lon: -76.562, lat: 37.105 },
  { lon: -76.548, lat: 37.088 },
  { lon: -76.52, lat: 37.062 },
  { lon: -76.49, lat: 37.038 },
  { lon: -76.468, lat: 37.022 },
  { lon: -76.488, lat: 37.002 },
  { lon: -76.478, lat: 36.988 },
  { lon: -76.45, lat: 36.972 },
  { lon: -76.428, lat: 36.96 },
  { lon: -76.405, lat: 36.968 },
  { lon: -76.378, lat: 36.982 },
  { lon: -76.355, lat: 36.996 },
  { lon: -76.345, lat: 37.006 },
  { lon: -76.33, lat: 37.002 },
  { lon: -76.308, lat: 36.999 },
  { lon: -76.298, lat: 37.012 },
  { lon: -76.292, lat: 37.038 },
  { lon: -76.282, lat: 37.062 },
  { lon: -76.28, lat: 37.085 },
  { lon: -76.288, lat: 37.108 },
  { lon: -76.308, lat: 37.122 },
  { lon: -76.322, lat: 37.138 },
  { lon: -76.348, lat: 37.152 },
  { lon: -76.372, lat: 37.168 },
  { lon: -76.398, lat: 37.192 },
  { lon: -76.42, lat: 37.215 },
  { lon: -76.455, lat: 37.228 },
  { lon: -76.508, lat: 37.238 },
  { lon: -76.545, lat: 37.25 },
  { lon: -76.585, lat: 37.258 },
  { lon: -76.63, lat: 37.268 },
  { lon: -76.68, lat: 37.282 },
  { lon: -76.705, lat: 37.292 },
  { lon: -76.735, lat: 37.285 },
  { lon: -76.755, lat: 37.26 },
  { lon: -76.758, lat: 37.232 },
];

export const PENINSULA_WATER_LABELS: ReadonlyArray<{ lon: number; lat: number; text: string }> = [
  { lon: -76.6, lat: 36.978, text: "JAMES RIVER" },
  { lon: -76.54, lat: 37.288, text: "YORK RIVER" },
  { lon: -76.3, lat: 37.175, text: "CHESAPEAKE BAY" },
];

export function geoMeanLat(): number {
  return (PENINSULA_BOUNDS.latMin + PENINSULA_BOUNDS.latMax) / 2;
}

/** Width / height of the plot rectangle (equirectangular + mid-lat cosine). */
export function geoPlotAspect(): number {
  const lonSpan = PENINSULA_BOUNDS.lonMax - PENINSULA_BOUNDS.lonMin;
  const latSpan = PENINSULA_BOUNDS.latMax - PENINSULA_BOUNDS.latMin;
  return (lonSpan * Math.cos((geoMeanLat() * Math.PI) / 180)) / latSpan;
}

/** Largest geo-aspect rectangle that fits inside the SF2 chrome. */
export function fitGeoPlot(chromeW: number, chromeH: number): { w: number; h: number } {
  const aspect = geoPlotAspect();
  const chromeAspect = chromeW / chromeH;
  if (chromeAspect > aspect) return { w: chromeH * aspect, h: chromeH };
  return { w: chromeW, h: chromeW / aspect };
}

export function geoToUv(lon: number, lat: number): { u: number; v: number } {
  const { lonMin, lonMax, latMin, latMax } = PENINSULA_BOUNDS;
  return {
    u: (lon - lonMin) / (lonMax - lonMin),
    v: 1 - (lat - latMin) / (latMax - latMin),
  };
}

export function geoForStage(id: string): StageGeo | undefined {
  return STAGE_GEO.find((g) => g.id === id);
}

export function stageForGeo(id: string): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}

/** True when the loaded map texture is the framed 16:9 plate C (not the 1111×1000 SVG). */
export function isFramedSelectPlate(width?: number, height?: number): boolean {
  if (!width || !height || width < 8 || height < 8) return false;
  return width >= 1600 && height >= 900 && width / height > 1.5;
}

export function selectMapChrome(framed: boolean): { w: number; h: number } {
  return framed ? SELECT_MAP_CHROME_C : SELECT_MAP_CHROME;
}
