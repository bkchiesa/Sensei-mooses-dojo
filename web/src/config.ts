/** Matches GameViewController.designSize — iPhone landscape, scaled to the browser. */
export const DESIGN_WIDTH = 1334;
export const DESIGN_HEIGHT = 750;

/**
 * Original standing-plane inset from the screen bottom (pre-playtest).
 * Fighters use `GROUND_Y` / `fightGroundY()`, which drop this plane halfway
 * toward the screen bottom so feet sit on the stage plates.
 */
export const GROUND_FROM_BOTTOM_BASE = 132;

/**
 * Fight standing plane (feet origin). Versus and Arcade both use this.
 *
 * Brandon playtest: fighters sat too high vs stage backgrounds.
 * Lower the plane by half the remaining gap to the screen bottom:
 *   Y' = Y_floor + 0.5 * (H - Y_floor)
 * With H = 750 and Y_floor = 618 that is 618 + 66 = 684 (66px from bottom).
 */
export function fightGroundY(height = DESIGN_HEIGHT, fromBottom = GROUND_FROM_BOTTOM_BASE): number {
  const yFloor = height - fromBottom;
  return yFloor + 0.5 * (height - yFloor);
}

/** Inset after the half-gap drop (`fightGroundY` vs screen bottom). */
export const GROUND_FROM_BOTTOM = DESIGN_HEIGHT - fightGroundY();
export const GROUND_Y = fightGroundY();

/** Display height for human fighters. Brandon: 2× the previous 210px body. */
export const FIGHTER_HEIGHT = 420;
/** Sensei Moose is 30% taller than the other (already 2×) fighters. */
export const MOOSE_HEIGHT_SCALE = 1.3;
export const HITS_TO_FILL = 6;
export const ULT_DAMAGE_FRACTION = 0.3;
export const CHARGE_PER_HIT = 1 / HITS_TO_FILL;

/** First to this many round wins takes the match (best of 3). */
export const ROUNDS_TO_WIN = 2;
export const COUNTDOWN_BEAT_MS = 640;

export const GOLD = "#ffd651";
export const GOLD_NUM = 0xffd651;

export const FONT = "Trebuchet MS, Avenir Next, Helvetica, sans-serif";

export const LIVE_PAGES_URL = "https://bkchiesa.github.io/Sensei-mooses-dojo/";
