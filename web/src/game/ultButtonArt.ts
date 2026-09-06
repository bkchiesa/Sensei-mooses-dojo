import Phaser from "phaser";

/**
 * Locked ★ ULT HUD VFX (Brandon / Pixel QA 2026-09-05).
 *
 *   dojo-art/finals/ui/ult-button/ult_btn_idle.png       → calm gold bolt
 *   dojo-art/finals/ui/ult-button/ult_btn_ready_00–07    → overcharged loop
 *   dojo-art/finals/ui/ult-button/ult_btn_bolt_00–01     → activate flash
 *
 * Export writes `assets/ui/ult-button/ult-button.json` listing files that
 * actually exist. Boot only queues those URLs so iPad Safari does not 404.
 * Fight HUD falls back to the purple ★ ULT circle if nothing loaded.
 */
export const ULT_BTN_IDLE = "ult_btn_idle";
export const ULT_BTN_READY_COUNT = 8;
export const ULT_BTN_BOLT_COUNT = 2;
export const ULT_BTN_READY_KEYS = Array.from(
  { length: ULT_BTN_READY_COUNT },
  (_, i) => `ult_btn_ready_${String(i).padStart(2, "0")}`,
);
export const ULT_BTN_BOLT_KEYS = Array.from(
  { length: ULT_BTN_BOLT_COUNT },
  (_, i) => `ult_btn_bolt_${String(i).padStart(2, "0")}`,
);
export const ULT_BTN_READY_ANIM = "ult-btn-ready";
export const ULT_BTN_BOLT_ANIM = "ult-btn-bolt";
export const ULT_BTN_READY_FRAME_RATE = 12;
export const ULT_BTN_BOLT_FRAME_RATE = 16;

export const ULT_BTN_MANIFEST_KEY = "ui-ult-button-manifest";
export const ULT_BTN_MANIFEST_URL = "assets/ui/ult-button/ult-button.json";

const ULT_BTN_DIR = "assets/ui/ult-button";

/** Display size for the 256×256 plate so the coin matches the 80px pad. */
export const ULT_BTN_DISPLAY = 108;

export interface UltButtonManifest {
  idle?: string | null;
  ready?: string[];
  bolt?: string[];
  files?: string[];
}

function textureReady(scene: Phaser.Scene, key: string): boolean {
  try {
    if (!scene.textures.exists(key)) return false;
    const src = scene.textures.get(key).getSourceImage() as { width?: number };
    return Boolean(src?.width && src.width > 1);
  } catch {
    return false;
  }
}

function listedUltFiles(raw: unknown): Set<string> {
  const files = new Set<string>();
  if (!raw || typeof raw !== "object") return files;
  const m = raw as UltButtonManifest;
  if (Array.isArray(m.files)) {
    for (const file of m.files) if (typeof file === "string") files.add(file);
  }
  if (typeof m.idle === "string") files.add(m.idle);
  if (Array.isArray(m.ready)) {
    for (const file of m.ready) if (typeof file === "string") files.add(file);
  }
  if (Array.isArray(m.bolt)) {
    for (const file of m.bolt) if (typeof file === "string") files.add(file);
  }
  return files;
}

/** Only queue ult-button PNGs the export manifest says are on disk — no speculative 404s. */
export function ultButtonQueueFromManifest(raw: unknown): { key: string; url: string }[] {
  const files = listedUltFiles(raw);
  const queue: { key: string; url: string }[] = [];
  const add = (key: string, file: string) => {
    if (files.has(file)) queue.push({ key, url: `${ULT_BTN_DIR}/${file}` });
  };
  add(ULT_BTN_IDLE, "ult_btn_idle.png");
  for (const key of ULT_BTN_READY_KEYS) add(key, `${key}.png`);
  for (const key of ULT_BTN_BOLT_KEYS) add(key, `${key}.png`);
  return queue;
}

export function optionalUltButtonKeys(): string[] {
  return [ULT_BTN_MANIFEST_KEY, ULT_BTN_IDLE, ...ULT_BTN_READY_KEYS, ...ULT_BTN_BOLT_KEYS];
}

export function readyUltReadyKeys(scene: Phaser.Scene): string[] {
  return ULT_BTN_READY_KEYS.filter((key) => textureReady(scene, key));
}

export function readyUltBoltKeys(scene: Phaser.Scene): string[] {
  return ULT_BTN_BOLT_KEYS.filter((key) => textureReady(scene, key));
}

export function hasUltButtonArt(scene: Phaser.Scene): boolean {
  return textureReady(scene, ULT_BTN_IDLE) || readyUltReadyKeys(scene).length > 0;
}

export function idleUltKey(scene: Phaser.Scene): string | null {
  if (textureReady(scene, ULT_BTN_IDLE)) return ULT_BTN_IDLE;
  const ready = readyUltReadyKeys(scene);
  return ready[0] ?? null;
}

export function ensureUltButtonAnims(scene: Phaser.Scene): { ready: string[]; bolt: string[] } {
  const ready = readyUltReadyKeys(scene);
  if (ready.length > 1 && !scene.anims.exists(ULT_BTN_READY_ANIM)) {
    scene.anims.create({
      key: ULT_BTN_READY_ANIM,
      frames: ready.map((key) => ({ key })),
      frameRate: ULT_BTN_READY_FRAME_RATE,
      repeat: -1,
    });
  }
  const bolt = readyUltBoltKeys(scene);
  if (bolt.length > 0 && !scene.anims.exists(ULT_BTN_BOLT_ANIM)) {
    scene.anims.create({
      key: ULT_BTN_BOLT_ANIM,
      frames: bolt.map((key) => ({ key })),
      frameRate: ULT_BTN_BOLT_FRAME_RATE,
      repeat: 0,
    });
  }
  return { ready, bolt };
}
