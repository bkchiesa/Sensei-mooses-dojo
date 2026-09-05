import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config";

/**
 * Locked Title splash (Brandon / Pixel QA 2026-09-05).
 *
 *   dojo-art/finals/ui/title/title_bg_dojo.png     →  title_bg_dojo
 *   dojo-art/finals/ui/title/title_logo_hero.png   →  title_logo_hero
 *   dojo-art/finals/ui/title/title_logo_00–07.png  →  title_logo_00…07 glow loop
 *
 * Export writes `assets/ui/title/title.json` listing files that actually exist.
 * Boot only queues those URLs (legacy `dojo-interior.png` / `logo.png` only if
 * present). Title falls back to moose + text if nothing loaded.
 */
export const TITLE_ART = {
  interior: "title_bg_dojo",
  logo: "title_logo_hero",
  moose: "moose_title_idle",
} as const;

export const TITLE_LOGO_FRAME_COUNT = 8;
export const TITLE_LOGO_FRAME_KEYS = Array.from(
  { length: TITLE_LOGO_FRAME_COUNT },
  (_, i) => `title_logo_${String(i).padStart(2, "0")}`,
);
export const TITLE_LOGO_ANIM = "title-logo-glow";
export const TITLE_LOGO_FRAME_RATE = 8;

export const TITLE_MANIFEST_KEY = "ui-title-manifest";
export const TITLE_MANIFEST_URL = "assets/ui/title/title.json";

const TITLE_DIR = "assets/ui/title";

export const TITLE_ART_URLS = {
  interior: `${TITLE_DIR}/title_bg_dojo.png`,
  logo: `${TITLE_DIR}/title_logo_hero.png`,
  moose: "assets/moose_title_idle.png",
} as const;

export const TITLE_ART_LEGACY_URLS = {
  interior: `${TITLE_DIR}/dojo-interior.png`,
  logo: `${TITLE_DIR}/logo.png`,
} as const;

export interface TitleManifest {
  bg?: string | null;
  hero?: string | null;
  frames?: string[];
  files?: string[];
}

export function textureReady(scene: Phaser.Scene, key: string): boolean {
  try {
    if (!scene.textures.exists(key)) return false;
    const src = scene.textures.get(key).getSourceImage() as { width?: number };
    return Boolean(src?.width && src.width > 1);
  } catch {
    return false;
  }
}

function listedTitleFiles(raw: unknown): Set<string> {
  const files = new Set<string>();
  if (!raw || typeof raw !== "object") return files;
  const m = raw as TitleManifest;
  if (Array.isArray(m.files)) {
    for (const file of m.files) if (typeof file === "string") files.add(file);
  }
  if (typeof m.bg === "string") files.add(m.bg);
  if (typeof m.hero === "string") files.add(m.hero);
  if (Array.isArray(m.frames)) {
    for (const file of m.frames) if (typeof file === "string") files.add(file);
  }
  return files;
}

/** Only queue title PNGs the export manifest says are on disk — no speculative 404s. */
export function titleQueueFromManifest(raw: unknown): { key: string; url: string }[] {
  const files = listedTitleFiles(raw);
  const queue: { key: string; url: string }[] = [];
  const add = (key: string, file: string) => {
    if (files.has(file)) queue.push({ key, url: `${TITLE_DIR}/${file}` });
  };
  add(TITLE_ART.interior, "title_bg_dojo.png");
  add(TITLE_ART.logo, "title_logo_hero.png");
  for (const key of TITLE_LOGO_FRAME_KEYS) add(key, `${key}.png`);
  if (!queue.some((item) => item.key === TITLE_ART.interior)) add(TITLE_ART.interior, "dojo-interior.png");
  if (!queue.some((item) => item.key === TITLE_ART.logo)) add(TITLE_ART.logo, "logo.png");
  return queue;
}

export function optionalTitleKeys(): string[] {
  return [TITLE_MANIFEST_KEY, TITLE_ART.interior, TITLE_ART.logo, ...TITLE_LOGO_FRAME_KEYS];
}

export function readyLogoFrameKeys(scene: Phaser.Scene): string[] {
  return TITLE_LOGO_FRAME_KEYS.filter((key) => textureReady(scene, key));
}

export function hasTitleLogo(scene: Phaser.Scene): boolean {
  return textureReady(scene, TITLE_ART.logo) || readyLogoFrameKeys(scene).length > 0;
}

export function ensureTitleLogoAnim(scene: Phaser.Scene): string[] {
  const keys = readyLogoFrameKeys(scene);
  if (keys.length > 1 && !scene.anims.exists(TITLE_LOGO_ANIM)) {
    scene.anims.create({
      key: TITLE_LOGO_ANIM,
      frames: keys.map((key) => ({ key })),
      frameRate: TITLE_LOGO_FRAME_RATE,
      repeat: -1,
    });
  }
  return keys;
}

function fitTitleLogo(image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
  const maxW = DESIGN_WIDTH * 0.92;
  const maxH = DESIGN_HEIGHT * 0.58;
  const s = Math.min(maxW / image.width, maxH / image.height);
  image.setScale(s);
}

/** Full-bleed interior plate (cover-scale) when the locked dojo shot is present. */
export function drawTitleInterior(scene: Phaser.Scene): boolean {
  if (!textureReady(scene, TITLE_ART.interior)) return false;
  const plate = scene.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, TITLE_ART.interior).setDepth(-20);
  const scale = Math.max(DESIGN_WIDTH / plate.width, DESIGN_HEIGHT / plate.height);
  plate.setScale(scale);
  return true;
}

/**
 * Glow loop from `title_logo_00–07` when at least two frames loaded.
 * Hero (or a single leftover frame) is the static fallback.
 */
export function drawTitleLogo(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite | null {
  const frames = ensureTitleLogoAnim(scene);
  const key = frames[0] ?? (textureReady(scene, TITLE_ART.logo) ? TITLE_ART.logo : null);
  if (!key) return null;
  const logo = scene.add.sprite(x, y, key).setDepth(8);
  fitTitleLogo(logo);
  if (frames.length > 1 && scene.anims.exists(TITLE_LOGO_ANIM)) {
    logo.play(TITLE_LOGO_ANIM);
  }
  return logo;
}
