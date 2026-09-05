#!/usr/bin/env node
/**
 * Writes the geo-faithful SVG placeholder to dojo-art/finals/ui/select/.
 * Shore / bounds must stay in sync with web/src/data/peninsula.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const bounds = { lonMin: -76.76, lonMax: -76.28, latMin: 36.955, latMax: 37.3 };
const plate = { width: 1111, height: 1000 };

const shore = [
  [-76.758, 37.208],
  [-76.7, 37.21],
  [-76.648, 37.205],
  [-76.6, 37.175],
  [-76.586, 37.16],
  [-76.575, 37.132],
  [-76.562, 37.105],
  [-76.548, 37.088],
  [-76.52, 37.062],
  [-76.49, 37.038],
  [-76.468, 37.022],
  [-76.488, 37.002],
  [-76.478, 36.988],
  [-76.45, 36.972],
  [-76.428, 36.96],
  [-76.405, 36.968],
  [-76.378, 36.982],
  [-76.355, 36.996],
  [-76.345, 37.006],
  [-76.33, 37.002],
  [-76.308, 36.999],
  [-76.298, 37.012],
  [-76.292, 37.038],
  [-76.282, 37.062],
  [-76.28, 37.085],
  [-76.288, 37.108],
  [-76.308, 37.122],
  [-76.322, 37.138],
  [-76.348, 37.152],
  [-76.372, 37.168],
  [-76.398, 37.192],
  [-76.42, 37.215],
  [-76.455, 37.228],
  [-76.508, 37.238],
  [-76.545, 37.25],
  [-76.585, 37.258],
  [-76.63, 37.268],
  [-76.68, 37.282],
  [-76.705, 37.292],
  [-76.735, 37.285],
  [-76.755, 37.26],
  [-76.758, 37.232],
];

const landmarks = [
  ["colonial", -76.7, 37.271],
  ["busch", -76.646, 37.234],
  ["nnpark", -76.556, 37.187],
  ["phmall", -76.508, 37.11],
  ["oysterpoint", -76.492, 37.088],
  ["stadium", -76.501, 37.082],
  ["axsomDojo", -76.495, 37.075],
  ["subwaywarwick", -76.518, 37.072],
  ["lionsBridge", -76.489, 37.055],
  ["mariners", -76.487, 37.05],
  ["hiltonElementary", -76.455, 37.028],
  ["hiltonvillage", -76.462, 37.02],
  ["hampton", -76.345, 37.025],
  ["poquoson", -76.346, 37.122],
  ["shipyard", -76.438, 36.978],
  ["jrbridge", -76.478, 36.993],
];

function uv(lon, lat) {
  return {
    u: (lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin),
    v: 1 - (lat - bounds.latMin) / (bounds.latMax - bounds.latMin),
  };
}

function xy(lon, lat) {
  const { u, v } = uv(lon, lat);
  return [+(u * plate.width).toFixed(1), +(v * plate.height).toFixed(1)];
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const hit = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

const missing = landmarks.filter(([, lon, lat]) => !pointInRing(lon, lat, shore));
if (missing.length) {
  console.error(
    "Landmarks outside placeholder shoreline:",
    missing.map(([id]) => id).join(", "),
  );
  process.exit(1);
}

const d = shore.map((pt, i) => `${i === 0 ? "M" : "L"}${xy(...pt).join(",")}`).join(" ") + " Z";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${plate.width} ${plate.height}" width="${plate.width}" height="${plate.height}">
  <!-- Placeholder plate. UV 0,0 = NW of lon -76.76..-76.28 / lat 36.955..37.30. Swap for Pixel PNG. -->
  <rect width="${plate.width}" height="${plate.height}" fill="#16365c"/>
  <path fill="#c9b48a" stroke="#8a7048" stroke-width="3" d="${d}"/>
</svg>
`;

const dest = path.join(root, "dojo-art/finals/ui/select/hampton-roads-map.svg");
fs.writeFileSync(dest, svg);
console.log("Wrote", dest);
