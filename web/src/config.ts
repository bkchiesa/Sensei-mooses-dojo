/** Matches GameViewController.designSize — iPhone landscape, scaled to the browser. */
export const DESIGN_WIDTH = 1334;
export const DESIGN_HEIGHT = 750;
export const GROUND_FROM_BOTTOM = 132;
export const GROUND_Y = DESIGN_HEIGHT - GROUND_FROM_BOTTOM;

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
