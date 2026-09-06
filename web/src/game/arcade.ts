import { dummyOpponent, fighterById, LADDER_IDS, opponentHomeStageId, type FighterDef } from "../data/catalog";

/** Arcade chain: boss ladder in roster order, skipping the player's own id. */
export interface ArcadeProgress {
  playerId: string;
  /** Index into LADDER_IDS. null only if the ladder is exhausted (should not start that way). */
  step: number | null;
}

function nextLadderIndex(from: number | null, playerId: string): number | null {
  const start = (from ?? -1) + 1;
  for (let i = start; i < LADDER_IDS.length; i++) {
    if (LADDER_IDS[i] !== playerId) return i;
  }
  return null;
}

export function arcadeStart(player: FighterDef): ArcadeProgress {
  return { playerId: player.id, step: nextLadderIndex(-1, player.id) };
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

export function arcadeNext(progress: ArcadeProgress): ArcadeProgress | null {
  const step = nextLadderIndex(progress.step, progress.playerId);
  if (step === null) return null;
  return { playerId: progress.playerId, step };
}
