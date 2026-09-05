import { dummyOpponent, fighterById, LADDER_IDS, opponentHomeStageId, type FighterDef } from "../data/catalog";

/** Arcade chain after the Stage 1 starter dummy: Boss ladder in order. */
export interface ArcadeProgress {
  playerId: string;
  /** null = intro CPU dummy on Lions Bridge. Otherwise an index into LADDER_IDS. */
  step: number | null;
}

export function arcadeStart(player: FighterDef): ArcadeProgress {
  return { playerId: player.id, step: null };
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
  const upcoming = (progress.step ?? -1) + 1;
  if (upcoming >= LADDER_IDS.length) return null;
  return { playerId: progress.playerId, step: upcoming };
}
