import type { FighterAnimName } from "../data/catalog";
import { DEFEAT_ANIM_ALIASES, FIGHTER_ANIM_NAMES, OPTIONAL_FIGHTER_ANIM_NAMES } from "../data/catalog";

/** Pose-bar FINALS: 4 / 4 / 4 / 4 / 2 / 2 / 4. Hit + defeat are single overlay frames when present. */
export const FIGHTER_ANIM_FRAME_COUNTS: Record<FighterAnimName, number> = {
  idle: 4,
  punch: 4,
  kick: 4,
  jump: 4,
  block: 2,
  crouch: 2,
  // Pixel sweep −30% (2026-09-06): same ~512h canvas, smaller figure in-frame.
  // Phaser keeps FIGHTER_HEIGHT fit so the shrink is visible (do not upscale).
  sweep: 4,
  // Pixel Batch1–2 landed `hit_00` / `defeat_00`. Soft open-gi B2 defeats + Batch3 hits later.
  hit: 1,
  defeat: 1,
};

export const OPTIONAL_ANIM_SET = new Set<string>(OPTIONAL_FIGHTER_ANIM_NAMES);

export function isOptionalFighterAnim(anim: string): boolean {
  return OPTIONAL_ANIM_SET.has(anim) || anim === "defeated";
}

export function defaultAnimFiles(anim: FighterAnimName): string[] {
  const n = FIGHTER_ANIM_FRAME_COUNTS[anim];
  return Array.from({ length: n }, (_, i) => `${anim}_${String(i).padStart(2, "0")}.png`);
}

/** Texture key written by the loader for a drop-in frame. */
export function fighterAnimKey(fighterId: string, anim: FighterAnimName, frame = 0): string {
  return `fanim-${fighterId}-${anim}-${String(frame).padStart(2, "0")}`;
}

export interface FighterAnimPack {
  id: string;
  /** Texture keys per anim. Empty means “stretch the idle placeholder”. */
  frames: Partial<Record<FighterAnimName, string[]>>;
}

export interface FighterAnimIndex {
  convention: string;
  anims: FighterAnimName[];
  fighters: Record<string, Partial<Record<FighterAnimName, string[]>>>;
}

const packs = new Map<string, FighterAnimPack>();

export function registerAnimPack(pack: FighterAnimPack): void {
  packs.set(pack.id, pack);
}

export function animPackFor(id: string): FighterAnimPack {
  return packs.get(id) ?? { id, frames: {} };
}

export function hasDedicatedFrames(id: string, anim: FighterAnimName): boolean {
  return (packs.get(id)?.frames[anim]?.length ?? 0) > 0;
}

/** Canonical `defeat` pack, accepting Pixel `defeated` folder/files as an alias. */
export function defeatFramesFor(id: string): string[] {
  const pack = packs.get(id);
  if (!pack) return [];
  const defeat = pack.frames.defeat;
  if (defeat?.length) return defeat;
  return [];
}

export function hasDefeatFrames(id: string): boolean {
  return defeatFramesFor(id).length > 0;
}

export function hasHitFrames(id: string): boolean {
  return hasDedicatedFrames(id, "hit");
}

/** First loaded texture for an anim, or null if Pixel has not dropped frames. */
export function firstAnimTexture(id: string, anim: FighterAnimName): string | null {
  const frames = anim === "defeat" ? defeatFramesFor(id) : (packs.get(id)?.frames[anim] ?? []);
  return frames[0] ?? null;
}

/** Public URL for a Pixel drop-in frame: `assets/fighters/<id>/<anim>_00.png`. */
export function fighterAnimUrl(fighterId: string, anim: FighterAnimName, file: string): string {
  return `assets/fighters/${fighterId}/${file}`;
}

export function parseAnimIndex(raw: unknown): FighterAnimIndex | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<FighterAnimIndex> & {
    fighters?: Record<string, Partial<Record<string, string[]>>>;
  };
  if (!data.fighters || typeof data.fighters !== "object") return null;
  const fighters: FighterAnimIndex["fighters"] = {};
  for (const [id, listed] of Object.entries(data.fighters)) {
    const frames: Partial<Record<FighterAnimName, string[]>> = { ...(listed as Partial<Record<FighterAnimName, string[]>>) };
    if (!frames.defeat?.length) {
      const alias = (listed as Record<string, string[] | undefined>).defeated;
      if (alias?.length) frames.defeat = alias;
    }
    fighters[id] = frames;
  }
  return {
    convention: data.convention ?? "assets/fighters/<id>/<anim>_00.png",
    anims: (data.anims?.length ? data.anims : FIGHTER_ANIM_NAMES) as FighterAnimName[],
    fighters,
  };
}

export { DEFEAT_ANIM_ALIASES, FIGHTER_ANIM_NAMES };
export type { FighterAnimName };
