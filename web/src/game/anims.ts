import type { FighterAnimName } from "../data/catalog";
import { FIGHTER_ANIM_NAMES } from "../data/catalog";

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

/** Public URL for a Pixel drop-in frame: `assets/fighters/<id>/<anim>_00.png`. */
export function fighterAnimUrl(fighterId: string, anim: FighterAnimName, file: string): string {
  return `assets/fighters/${fighterId}/${file}`;
}

export function parseAnimIndex(raw: unknown): FighterAnimIndex | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<FighterAnimIndex>;
  if (!data.fighters || typeof data.fighters !== "object") return null;
  return {
    convention: data.convention ?? "assets/fighters/<id>/<anim>_00.png",
    anims: (data.anims?.length ? data.anims : FIGHTER_ANIM_NAMES) as FighterAnimName[],
    fighters: data.fighters,
  };
}

export { FIGHTER_ANIM_NAMES };
export type { FighterAnimName };
