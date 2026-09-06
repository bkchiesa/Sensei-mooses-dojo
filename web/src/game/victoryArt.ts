import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config";
import { textureReady } from "./titleArt";

/**
 * Arcade victory plate (Pixel stub 2026-09-06).
 *
 *   dojo-art/finals/ui/victory/victory_bg_dojo.png  →  victory_bg_dojo
 *
 * `victory_layout_guide.png` is artist-only — never exported or loaded.
 * Export writes `assets/ui/victory/victory.json` listing the bg when present.
 * Boot only queues that URL. Scene composites the winner + defeated over the plate.
 */
export const VICTORY_ART = {
  interior: "victory_bg_dojo",
} as const;

export const VICTORY_MANIFEST_KEY = "ui-victory-manifest";
export const VICTORY_MANIFEST_URL = "assets/ui/victory/victory.json";

const VICTORY_DIR = "assets/ui/victory";

/** Pixel guide canvas (1280×800). Map slots into DESIGN 1334×750. */
export const VICTORY_GUIDE = { w: 1280, h: 800 } as const;
export const VICTORY_HERO = { y0: 120, y1: 520, w: 280, h: 400 } as const;
export const VICTORY_ARC = { y0: 580, y1: 700, max: 8 } as const;

/** Guide-space centers for D1–D8 (1280×800 layout_guide). */
export const VICTORY_DEFEATED_SLOTS: { x: number; y: number }[] = [
  { x: 118, y: 620 },
  { x: 248, y: 648 },
  { x: 400, y: 668 },
  { x: 545, y: 682 },
  { x: 735, y: 682 },
  { x: 880, y: 668 },
  { x: 1032, y: 648 },
  { x: 1162, y: 620 },
];

export interface VictoryManifest {
  bg?: string | null;
  files?: string[];
}

function listedVictoryFiles(raw: unknown): Set<string> {
  const files = new Set<string>();
  if (!raw || typeof raw !== "object") return files;
  const m = raw as VictoryManifest;
  if (Array.isArray(m.files)) {
    for (const file of m.files) {
      if (typeof file === "string" && !/guide|readme|contact/i.test(file)) files.add(file);
    }
  }
  if (typeof m.bg === "string") files.add(m.bg);
  return files;
}

export function victoryQueueFromManifest(raw: unknown): { key: string; url: string }[] {
  const files = listedVictoryFiles(raw);
  if (files.has("victory_bg_dojo.png")) {
    return [{ key: VICTORY_ART.interior, url: `${VICTORY_DIR}/victory_bg_dojo.png` }];
  }
  return [];
}

export function optionalVictoryKeys(): string[] {
  return [VICTORY_MANIFEST_KEY, VICTORY_ART.interior];
}

export function hasVictoryInterior(scene: Phaser.Scene): boolean {
  return textureReady(scene, VICTORY_ART.interior);
}

/** Full-bleed victory dojo plate. Returns false when the stub bg is missing. */
export function drawVictoryInterior(scene: Phaser.Scene): boolean {
  if (!hasVictoryInterior(scene)) return false;
  const plate = scene.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, VICTORY_ART.interior).setDepth(-20);
  const scale = Math.max(DESIGN_WIDTH / plate.width, DESIGN_HEIGHT / plate.height);
  plate.setScale(scale);
  return true;
}

export function guideX(x: number): number {
  return (x / VICTORY_GUIDE.w) * DESIGN_WIDTH;
}

export function guideY(y: number): number {
  return (y / VICTORY_GUIDE.h) * DESIGN_HEIGHT;
}
