import { LADDER_IDS } from "../data/catalog";
import { ARCADE_STAGE_COUNT, arcadeStageIndex, type ArcadeProgress } from "./arcade";

/**
 * Progressive arcade difficulty.
 *
 * Arcade uses the 12-fight run index (0…11). Free Play uses the opponent’s
 * catalog ladder index when they are a boss, otherwise a mild mid-roster
 * profile. Curves stay monotonic in `t`.
 */
export interface Difficulty {
  /** Ladder index, or -1 for the intro dummy. */
  index: number;
  /** Seconds between CPU attack decisions (lower = more aggressive). */
  attackCooldown: number;
  /** Walk in until this gap (px). */
  approachDistance: number;
  /** Chance per decision tick to start a block when a hit is coming. */
  blockRate: number;
  /** Multiplier on damage the CPU deals to the player. */
  cpuDamageDealt: number;
  /** Multiplier on damage the CPU takes from the player. */
  cpuDamageTaken: number;
  /** How readily the CPU spends a full ULT meter. */
  ultAggressiveness: number;
  /** Random jump chance while idle (0–1 per long cooldown). */
  jumpChance: number;
}

const DUMMY: Difficulty = {
  index: -1,
  attackCooldown: 1.45,
  approachDistance: 140,
  blockRate: 0.02,
  cpuDamageDealt: 0.55,
  cpuDamageTaken: 1.35,
  ultAggressiveness: 0.22,
  jumpChance: 0.05,
};

export function difficultyForStep(index: number, span = LADDER_IDS.length): Difficulty {
  if (index < 0) return { ...DUMMY };
  const t = index / Math.max(span - 1, 1);
  return {
    index,
    attackCooldown: lerp(0.92, 0.28, t),
    approachDistance: lerp(118, 68, t),
    blockRate: lerp(0.08, 0.46, t),
    cpuDamageDealt: lerp(0.82, 1.38, t),
    cpuDamageTaken: lerp(1.08, 0.68, t),
    ultAggressiveness: lerp(0.45, 0.95, t),
    jumpChance: lerp(0.1, 0.28, t),
  };
}

export function difficultyForFight(arcade: ArcadeProgress | null, opponentId: string): Difficulty {
  if (arcade) return difficultyForStep(arcadeStageIndex(arcade), ARCADE_STAGE_COUNT);
  const ladder = LADDER_IDS.indexOf(opponentId);
  if (ladder >= 0) return difficultyForStep(ladder);
  return difficultyForStep(2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
