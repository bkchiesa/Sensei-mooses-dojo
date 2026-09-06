import {
  BOSSES,
  dummyOpponent,
  fighterById,
  opponentHomeStageId,
  tryFighterById,
  type FighterDef,
} from "../data/catalog";

/** Playable Arcade length. Stages 11–12 are always Austin then Sensei Moose. */
export const ARCADE_STAGE_COUNT = 12;
export const ARCADE_AUSTIN_STAGE = 11;
export const ARCADE_MOOSE_STAGE = 12;
export const ARCADE_FINALE_IDS = ["austin", "senseiMoose"] as const;

export interface ArcadeProgress {
  playerId: string;
  /** 0-based index into `opponentIds`. */
  step: number;
  /** 12 opponent ids for this run (no self in 1–10 when the pool allows). */
  opponentIds: string[];
  /** Opponents already beaten in this arcade run, in fight order. */
  defeatedIds: string[];
}

function canonId(id: string): string {
  return id === "moose" ? "senseiMoose" : id;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function takeUnique(pool: string[], count: number, rng: () => number): string[] {
  const mix = shuffled(pool, rng);
  if (mix.length >= count) return mix.slice(0, count);
  const out = [...mix];
  let i = 0;
  while (out.length < count && mix.length) {
    out.push(mix[i % mix.length]!);
    i += 1;
  }
  return out;
}

/**
 * Build the 12-fight Arcade ladder.
 *
 * Stages 1–10: shuffled staff minus the player and the two finales (no repeats
 * when the pool is large enough). Stage 11 is always Austin. Stage 12 is always
 * Sensei Moose — including a mirror match if that is who you picked.
 */
export function buildArcadeLadder(playerId: string, rng: () => number = Math.random): string[] {
  const self = canonId(playerId);
  const pool = BOSSES.map((b) => b.id).filter(
    (id) => id !== self && !(ARCADE_FINALE_IDS as readonly string[]).includes(id),
  );
  const early = takeUnique(pool, 10, rng);
  return [...early, "austin", "senseiMoose"];
}

export function normalizeArcade(progress: ArcadeProgress): ArcadeProgress {
  const playerId = canonId(progress.playerId);
  const ids =
    Array.isArray(progress.opponentIds) && progress.opponentIds.length === ARCADE_STAGE_COUNT
      ? progress.opponentIds.map(canonId)
      : buildArcadeLadder(playerId);
  const step = Number.isFinite(progress.step)
    ? Math.max(0, Math.min(ids.length - 1, Math.floor(progress.step)))
    : 0;
  return {
    playerId,
    step,
    opponentIds: ids,
    defeatedIds: [...(progress.defeatedIds ?? [])],
  };
}

export function arcadeStart(player: FighterDef, rng: () => number = Math.random): ArcadeProgress {
  const playerId = canonId(player.id);
  return { playerId, step: 0, opponentIds: buildArcadeLadder(playerId, rng), defeatedIds: [] };
}

export function arcadePlayer(progress: ArcadeProgress): FighterDef {
  return tryFighterById(normalizeArcade(progress).playerId) ?? fighterById("misty");
}

export function arcadeOpponent(progress: ArcadeProgress): FighterDef {
  const run = normalizeArcade(progress);
  const id = run.opponentIds[run.step];
  return tryFighterById(id) ?? dummyOpponent(arcadePlayer(run));
}

export function arcadeStageId(progress: ArcadeProgress): string {
  return opponentHomeStageId(arcadeOpponent(progress), false);
}

export function arcadeCurrentBoss(progress: ArcadeProgress): FighterDef | null {
  return arcadeOpponent(progress);
}

export function arcadeStageIndex(progress: ArcadeProgress): number {
  return normalizeArcade(progress).step;
}

/** 1-based stage number for HUD copy. */
export function arcadeStageNumber(progress: ArcadeProgress): number {
  return arcadeStageIndex(progress) + 1;
}

export function arcadeStageHud(progress: ArcadeProgress): string {
  return `STAGE ${arcadeStageNumber(progress)}/${ARCADE_STAGE_COUNT}`;
}

/** Record the current opponent as beaten. Used before advancing or opening victory. */
export function arcadeRecordWin(progress: ArcadeProgress): ArcadeProgress {
  const run = normalizeArcade(progress);
  const boss = arcadeOpponent(run);
  const beaten = [...run.defeatedIds];
  if (beaten.includes(boss.id)) return { ...run, defeatedIds: beaten };
  return { ...run, defeatedIds: [...beaten, boss.id] };
}

export function arcadeNext(progress: ArcadeProgress): ArcadeProgress | null {
  const run = normalizeArcade(progress);
  const step = run.step + 1;
  if (step >= run.opponentIds.length) return null;
  return { ...run, step };
}

/** Jump to a 1-based stage (clamped). Prior opponents are marked beaten. */
export function arcadeAtStage(player: FighterDef, stage1Based: number, rng: () => number = Math.random): ArcadeProgress {
  const start = arcadeStart(player, rng);
  const step = Math.max(0, Math.min(ARCADE_STAGE_COUNT - 1, Math.floor(stage1Based) - 1));
  return { ...start, step, defeatedIds: start.opponentIds.slice(0, step) };
}

/** Full cleared-ladder cast for the victory collage. */
export function arcadeClearedDefeatedIds(playerId: string): string[] {
  return buildArcadeLadder(playerId, () => 0.15);
}

export function arcadeCompleteProgress(player: FighterDef): ArcadeProgress {
  const ids = arcadeClearedDefeatedIds(player.id);
  return {
    playerId: canonId(player.id),
    step: Math.max(0, ids.length - 1),
    opponentIds: ids,
    defeatedIds: ids,
  };
}

export function arcadeRematchLast(progress: ArcadeProgress): ArcadeProgress {
  const run = normalizeArcade(progress);
  const defeatedIds = run.defeatedIds.slice(0, -1);
  const lastId = run.defeatedIds[run.defeatedIds.length - 1];
  const fromId = lastId ? run.opponentIds.indexOf(lastId) : -1;
  return { ...run, step: fromId >= 0 ? fromId : run.step, defeatedIds };
}

export function arcadeDefeatedFighters(progress: ArcadeProgress): FighterDef[] {
  const run = normalizeArcade(progress);
  const ids = run.defeatedIds.length ? run.defeatedIds : run.opponentIds;
  return ids.map((id) => tryFighterById(id)).filter((f): f is FighterDef => Boolean(f));
}
