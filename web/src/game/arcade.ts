import { dummyOpponent, fighterById, LADDER_IDS, opponentHomeStageId, type FighterDef } from "../data/catalog";

/** Arcade chain: boss ladder in roster order, skipping the player's own id. */
export interface ArcadeProgress {
  playerId: string;
  /** Index into LADDER_IDS. null only if the ladder is exhausted (should not start that way). */
  step: number | null;
  /** Opponents already beaten in this arcade run (ids), in ladder order. */
  defeatedIds: string[];
}

function nextLadderIndex(from: number | null, playerId: string): number | null {
  const start = (from ?? -1) + 1;
  for (let i = start; i < LADDER_IDS.length; i++) {
    if (LADDER_IDS[i] !== playerId) return i;
  }
  return null;
}

export function arcadeStart(player: FighterDef): ArcadeProgress {
  return { playerId: player.id, step: nextLadderIndex(-1, player.id), defeatedIds: [] };
}

export function arcadePlayer(progress: ArcadeProgress): FighterDef {
  return fighterById(progress.playerId);
}

export function arcadeOpponent(progress: ArcadeProgress): FighterDef {
  if (progress.step !== null) return fighterById(LADDER_IDS[progress.step]);
  return dummyOpponent(arcadePlayer(progress));
}

export function arcadeStageId(progress: ArcadeProgress): string {
  return opponentHomeStageId(arcadeOpponent(progress), progress.step === null);
}

export function arcadeCurrentBoss(progress: ArcadeProgress): FighterDef | null {
  if (progress.step === null) return null;
  return fighterById(LADDER_IDS[progress.step]);
}

/** Record the current opponent as beaten. Used before advancing or opening victory. */
export function arcadeRecordWin(progress: ArcadeProgress): ArcadeProgress {
  const boss = arcadeCurrentBoss(progress);
  const beaten = [...(progress.defeatedIds ?? [])];
  if (!boss || beaten.includes(boss.id)) return { ...progress, defeatedIds: beaten };
  return { ...progress, defeatedIds: [...beaten, boss.id] };
}

export function arcadeNext(progress: ArcadeProgress): ArcadeProgress | null {
  const step = nextLadderIndex(progress.step, progress.playerId);
  if (step === null) return null;
  return { playerId: progress.playerId, step, defeatedIds: [...(progress.defeatedIds ?? [])] };
}

/** Full cleared-ladder cast for the victory collage (every boss except the player). */
export function arcadeClearedDefeatedIds(playerId: string): string[] {
  return LADDER_IDS.filter((id) => id !== playerId);
}

function lastLadderIndex(playerId: string): number | null {
  for (let i = LADDER_IDS.length - 1; i >= 0; i--) {
    if (LADDER_IDS[i] !== playerId) return i;
  }
  return null;
}

export function arcadeCompleteProgress(player: FighterDef): ArcadeProgress {
  return { playerId: player.id, step: lastLadderIndex(player.id), defeatedIds: arcadeClearedDefeatedIds(player.id) };
}

export function arcadeRematchLast(progress: ArcadeProgress): ArcadeProgress {
  const lastId = progress.defeatedIds[progress.defeatedIds.length - 1];
  const defeatedIds = progress.defeatedIds.slice(0, -1);
  const fromId = lastId ? LADDER_IDS.indexOf(lastId) : -1;
  return { playerId: progress.playerId, step: fromId >= 0 ? fromId : progress.step, defeatedIds };
}

export function arcadeDefeatedFighters(progress: ArcadeProgress): FighterDef[] {
  const ids = progress.defeatedIds?.length ? progress.defeatedIds : arcadeClearedDefeatedIds(progress.playerId);
  return ids.map((id) => fighterById(id));
}
