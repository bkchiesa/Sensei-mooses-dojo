import { STAGES, type StageDef } from "./catalog";

/**
 * Real-ish WGS84 points for the locked landmark set.
 * Used only to place PLAYER SELECT dots on the Lower Peninsula map.
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
  latMax: 37.30,
};

export const STAGE_GEO: StageGeo[] = [
  { id: "colonial", short: "Williamsburg", lon: -76.7, lat: 37.271, labelDy: -10 },
  { id: "busch", short: "Busch", lon: -76.646, lat: 37.234, labelDx: 10 },
  { id: "nnpark", short: "NN Park", lon: -76.556, lat: 37.187, labelDy: -10 },
  { id: "phmall", short: "PH Mall", lon: -76.508, lat: 37.11, labelDx: -16 },
  { id: "oysterpoint", short: "Oyster Pt", lon: -76.492, lat: 37.088, labelDx: 14 },
  { id: "stadium", short: "Stadium", lon: -76.501, lat: 37.082, labelDy: 11 },
  { id: "axsomDojo", short: "Dojo", lon: -76.495, lat: 37.075, labelDx: -14 },
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

/** Stylized Lower Peninsula shoreline in the same 0–1 UV as `geoToUv`. */
export const PENINSULA_LAND: Array<[number, number]> = [
  [0.1, 0.12],
  [0.2, 0.05],
  [0.3, 0.14],
  [0.38, 0.24],
  [0.5, 0.3],
  [0.64, 0.36],
  [0.84, 0.41],
  [0.96, 0.44],
  [0.91, 0.54],
  [0.86, 0.62],
  [0.95, 0.7],
  [0.88, 0.8],
  [0.76, 0.85],
  [0.68, 0.95],
  [0.56, 0.92],
  [0.5, 0.8],
  [0.54, 0.72],
  [0.48, 0.62],
  [0.42, 0.5],
  [0.36, 0.4],
  [0.28, 0.28],
  [0.16, 0.2],
];

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
