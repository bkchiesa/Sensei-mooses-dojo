import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FIGHTER_HEIGHT } from "../config";

/**
 * Locked ultimate splash (Brandon / Pixel QA 2026-09-05).
 *
 *   dojo-art/finals/ultimates/<id>/ult_<id>_00…11.png   →  12f splash @~512h
 *   dojo-art/finals/ultimates/<id>/fx/ult_<id>_fx_00…    →  Austin / Moose fullscreen FX
 *
 * Export writes `assets/ultimates/index.json` listing files that exist.
 * Boot preloads each fighter’s `_00`. FightScene queues the rest (plus FX)
 * for the two combatants so iPad Safari does not fetch the full roster.
 */

export const ULT_MANIFEST_KEY = "ultimates-index";
export const ULT_MANIFEST_URL = "assets/ultimates/index.json";
export const ULT_SPLASH_FPS = 12;
export const ULT_FX_FPS = 10;
export const ULT_FALLBACK_DURATION = 0.95;

export interface UltFighterEntry {
  frames: string[];
  fx: string[];
}

export interface UltManifest {
  fighters: Record<string, UltFighterEntry>;
}

export interface UltPack {
  id: string;
  frames: string[];
  fx: string[];
}

const packs = new Map<string, UltPack>();

export function ultTextureKey(file: string): string {
  return file.replace(/\.png$/i, "");
}

export function registerUltPack(pack: UltPack): void {
  packs.set(pack.id, pack);
}

export function ultPackFor(id: string): UltPack {
  return packs.get(id) ?? (id === "senseiMoose" ? packs.get("moose") : undefined) ?? { id, frames: [], fx: [] };
}

export function parseUltManifest(raw: unknown): UltManifest {
  const fighters: Record<string, UltFighterEntry> = {};
  if (!raw || typeof raw !== "object") return { fighters };
  const data = raw as Partial<UltManifest>;
  if (!data.fighters || typeof data.fighters !== "object") return { fighters };
  for (const [id, entry] of Object.entries(data.fighters)) {
    if (!entry || typeof entry !== "object") continue;
    const frames = Array.isArray(entry.frames) ? entry.frames.filter((f): f is string => typeof f === "string") : [];
    const fx = Array.isArray(entry.fx) ? entry.fx.filter((f): f is string => typeof f === "string") : [];
    fighters[id] = { frames, fx };
  }
  return { fighters };
}

export function registerUltPacksFromManifest(raw: unknown): void {
  const manifest = parseUltManifest(raw);
  for (const [id, entry] of Object.entries(manifest.fighters)) {
    registerUltPack({
      id,
      frames: entry.frames.map(ultTextureKey),
      fx: entry.fx.map(ultTextureKey),
    });
  }
}

export function optionalUltKeys(): string[] {
  return [ULT_MANIFEST_KEY];
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

export function readyUltFrames(scene: Phaser.Scene, id: string): string[] {
  return ultPackFor(id).frames.filter((key) => textureReady(scene, key));
}

export function readyUltFx(scene: Phaser.Scene, id: string): string[] {
  return ultPackFor(id).fx.filter((key) => textureReady(scene, key));
}

export function splashDisplayHeight(bodyHeight: number): number {
  return Math.round(512 * (bodyHeight / FIGHTER_HEIGHT));
}

export function ultDurationFor(frameCount: number): number {
  return frameCount > 1 ? frameCount / ULT_SPLASH_FPS : ULT_FALLBACK_DURATION;
}

/** Remaining splash + FX for these ids (skip textures already in the cache). */
export function ultLoadQueue(scene: Phaser.Scene, ids: string[]): { key: string; url: string }[] {
  const seen = new Set<string>();
  const queue: { key: string; url: string }[] = [];
  for (const id of ids) {
    const pack = ultPackFor(id);
    const unique = pack.frames.filter((key, i) => pack.frames.indexOf(key) === i);
    for (const key of unique) {
      if (seen.has(key) || textureReady(scene, key)) continue;
      seen.add(key);
      queue.push({ key, url: `assets/ultimates/${id}/${key}.png` });
    }
    const fxUnique = pack.fx.filter((key, i) => pack.fx.indexOf(key) === i);
    for (const key of fxUnique) {
      if (seen.has(key) || textureReady(scene, key)) continue;
      seen.add(key);
      queue.push({ key, url: `assets/ultimates/${id}/fx/${key}.png` });
    }
  }
  return queue;
}

/**
 * Fullscreen Austin / Moose FX overlay. Plays once, then destroys itself.
 * Depth sits above fighters and below the health-bar HUD.
 */
export function playUltFxOverlay(scene: Phaser.Scene, id: string): Phaser.GameObjects.Sprite | null {
  const keys = readyUltFx(scene, id);
  if (!keys.length) return null;
  const animKey = `ultfx-${id}`;
  if (keys.length > 1 && !scene.anims.exists(animKey)) {
    scene.anims.create({
      key: animKey,
      frames: keys.map((key) => ({ key })),
      frameRate: ULT_FX_FPS,
      repeat: 0,
    });
  }
  const sprite = scene.add.sprite(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, keys[0]).setDepth(55);
  sprite.setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT);
  if (keys.length > 1 && scene.anims.exists(animKey)) {
    sprite.play(animKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.destroy();
    });
  } else {
    scene.time.delayedCall(ULT_FALLBACK_DURATION * 1000, () => sprite.destroy());
  }
  return sprite;
}
