/** Port of Roster / BossRoster / Stage / UltimateMove. Swift remains the native source. */

export type FighterKind = "starter" | "boss";

export type UltimateFlavor =
  | "risingDragon"
  | "spiritWave"
  | "commandSlam"
  | "flipKick"
  | "clothesline"
  | "dashThrough"
  | "rapidFists"
  | "spinningLariat"
  | "dropkick"
  | "suplex"
  | "powerbomb"
  | "rana"
  | "elbowDrop"
  | "spear"
  | "moonsault"
  | "tigerUpper"
  | "teleport"
  | "piledriver"
  | "cutter"
  | "tornadoKick"
  | "figure4";

export interface UltimateMove {
  name: string;
  summary: string;
  flavor: UltimateFlavor;
  frameName: string;
}

export interface FighterDef {
  id: string;
  kind: FighterKind;
  displayName: string;
  portrait: string;
  idle: string;
  accent: number;
  ultimate: UltimateMove;
  stageId: string;
}

export type StageAmbientKind = "clouds" | "water" | "boats" | "trees" | "flags";

export interface StageDef {
  id: string;
  displayName: string;
  assetPrefix: string;
  number: number;
  mood: string | null;
  wired: boolean;
  /** Lightweight loops used when the plate has sky / water / boats. */
  ambient: StageAmbientKind[];
}

function rgb(r: number, g: number, b: number): number {
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

function ult(id: string, name: string, summary: string, flavor: UltimateFlavor): UltimateMove {
  return { name, summary, flavor, frameName: `ult_${id}_00` };
}

function starter(
  id: string,
  displayName: string,
  accent: number,
  name: string,
  summary: string,
  flavor: UltimateFlavor,
): FighterDef {
  return {
    id,
    kind: "starter",
    displayName,
    portrait: `fighter_${id}_portrait`,
    idle: `fighter_${id}_idle_00`,
    accent,
    ultimate: ult(id, name, summary, flavor),
    stageId: "lionsBridge",
  };
}

function boss(
  id: string,
  displayName: string,
  accent: number,
  stageId: string,
  name: string,
  summary: string,
  flavor: UltimateFlavor,
): FighterDef {
  const moose = id === "senseiMoose";
  return {
    id,
    kind: "boss",
    displayName,
    portrait: moose ? "boss_senseiMoose_idle_00" : `boss_${id}_portrait`,
    idle: moose ? "boss_senseiMoose_idle_00" : `boss_${id}_idle_00`,
    accent,
    ultimate: ult(id, name, summary, flavor),
    stageId,
  };
}

/** Scratch starters stay loadable for art / `?fighter=` debug. Not on Select. */
export const STARTERS: FighterDef[] = [
  starter("matt", "Matt", rgb(0.77, 0.2, 0.15), "Rising Fang", "Leap uppercut homage to a classic dragon-punch.", "risingDragon"),
  starter("simon", "Simon", rgb(0.13, 0.27, 0.55), "Spirit Wave", "Palm-fired energy lunge, fireball-style homage.", "spiritWave"),
  starter("rich", "Rich", rgb(0.14, 0.43, 0.24), "Grove Lock", "Command grab into a body slam.", "commandSlam"),
  starter("amanda", "Amanda", rgb(0.46, 0.19, 0.59), "Violet Flash", "Back-flip kick that climbs the opponent.", "flipKick"),
  starter("jb", "JB", rgb(0.77, 0.6, 0.14), "Gold Rush", "Full-sprint clothesline.", "clothesline"),
];

/** Ryan stays greyed until beaten in Arcade. Austin + Sensei Moose are open. */
export const LOCKED_UNTIL_DEFEAT_IDS = ["ryan"] as const;

export function isLockedUntilDefeat(id: string): boolean {
  return (LOCKED_UNTIL_DEFEAT_IDS as readonly string[]).includes(id);
}

/** Arcade + Free Play home stages — one distinct landmark per boss. See README. */
export const BOSSES: FighterDef[] = [
  boss("misty", "Misty", rgb(0.85, 0.35, 0.55), "lionsBridge", "Rising Heel Flash", "Rising heel kick flash.", "flipKick"),
  boss("lucas", "Lucas", rgb(0.2, 0.45, 0.75), "hiltonvillage", "Rapid Palm Barrage", "Rapid-fire palm strikes.", "rapidFists"),
  boss("chris", "Chris", rgb(0.55, 0.25, 0.2), "oysterpoint", "Diving Elbow Drop", "Top-rope style diving elbow.", "elbowDrop"),
  boss("christiano", "Christiano", rgb(0.15, 0.55, 0.4), "phmall", "Wheel Kick Spiral", "Spinning wheel-kick spiral.", "spinningLariat"),
  boss("dakota", "Dakota", rgb(0.7, 0.45, 0.15), "shipyard", "Charge Spear", "Full-sprint spear tackle.", "spear"),
  boss("johnk", "John K.", rgb(0.25, 0.25, 0.45), "hiltonElementary", "Power Slam", "Sit-out power slam.", "powerbomb"),
  boss("casper", "Casper", rgb(0.82, 0.68, 0.22), "mariners", "Rank Certificate", "Scroll-and-rank celebration surge.", "spiritWave"),
  boss("hudson", "Hudson", rgb(0.4, 0.3, 0.2), "subwaywarwick", "Running Clothesline", "Full-sprint clothesline.", "clothesline"),
  boss("michael", "Michael", rgb(0.3, 0.4, 0.55), "nnpark", "Sharpshooter Lock", "Figure-four style leg submission homage.", "figure4"),
  boss("shianne", "Shianne", rgb(0.72, 0.22, 0.48), "jrbridge", "Crescent Flash", "Rising crescent kick flash.", "flipKick"),
  boss("dean", "Dean", rgb(0.15, 0.32, 0.42), "colonial", "Calligraphy Kiai", "Gold brush-script kiai burst.", "tigerUpper"),
  boss("amiyr", "Amiyr", rgb(0.5, 0.2, 0.55), "busch", "Axe Kick Crash", "Overhead axe-kick crash.", "dropkick"),
  boss("shaun", "Shaun", rgb(0.35, 0.35, 0.35), "hampton", "Rising Fist Upper", "Rising uppercut fist.", "risingDragon"),
  boss("ryan", "Ryan", rgb(0.7, 0.2, 0.2), "poquoson", "Running Knee Strike", "Sprint into a jumping knee.", "cutter"),
  boss("austin", "Austin", rgb(0.2, 0.35, 0.65), "stadium", "Tornado Kick Barrage", "Spinning kick barrage — stylized homage.", "tornadoKick"),
  boss("senseiMoose", "Sensei Moose", rgb(0.55, 0.32, 0.12), "axsomDojo", "Figure-Four Lock", "Figure-4 leglock submission finisher.", "figure4"),
];

export const LADDER_IDS = BOSSES.map((b) => b.id);

{
  const seen = new Set<string>();
  for (const boss of BOSSES) {
    if (seen.has(boss.stageId)) {
      throw new Error(`Boss home stages must be unique; duplicate ${boss.stageId}`);
    }
    seen.add(boss.stageId);
  }
}

export const STAGES: StageDef[] = [
  { id: "lionsBridge", displayName: "Lions Bridge", assetPrefix: "stage1", number: 1, mood: "B", wired: true, ambient: ["clouds", "water", "boats"] },
  { id: "hiltonElementary", displayName: "Hilton Elementary School", assetPrefix: "stage2", number: 2, mood: "B", wired: true, ambient: ["clouds", "water", "boats"] },
  { id: "axsomDojo", displayName: "Axsom Martial Arts Dojo", assetPrefix: "stage3", number: 3, mood: "B", wired: true, ambient: ["clouds", "flags"] },
  { id: "oysterpoint", displayName: "Oyster Point", assetPrefix: "stage_oysterpoint", number: 4, mood: null, wired: true, ambient: ["clouds", "water", "boats"] },
  { id: "phmall", displayName: "Patrick Henry Mall", assetPrefix: "stage_phmall", number: 5, mood: null, wired: true, ambient: ["clouds", "flags"] },
  { id: "shipyard", displayName: "Newport News Shipyard", assetPrefix: "stage_shipyard", number: 6, mood: null, wired: true, ambient: ["clouds", "water", "boats"] },
  { id: "hiltonvillage", displayName: "Hilton Village", assetPrefix: "stage_hiltonvillage", number: 7, mood: null, wired: true, ambient: ["clouds", "trees"] },
  { id: "mariners", displayName: "Mariners' Museum", assetPrefix: "stage_mariners", number: 8, mood: "B", wired: true, ambient: ["clouds", "water", "trees"] },
  { id: "subwaywarwick", displayName: "Warwick Blvd", assetPrefix: "stage_subwaywarwick", number: 9, mood: "B", wired: true, ambient: ["clouds", "flags"] },
  { id: "nnpark", displayName: "Newport News Park", assetPrefix: "stage_nnpark", number: 10, mood: "B", wired: true, ambient: ["clouds", "trees"] },
  { id: "jrbridge", displayName: "James River Bridge", assetPrefix: "stage_jrbridge", number: 11, mood: "B", wired: true, ambient: ["clouds", "water", "boats"] },
  { id: "colonial", displayName: "Colonial Capitol", assetPrefix: "stage_colonial", number: 12, mood: "B", wired: true, ambient: ["clouds", "flags"] },
  { id: "stadium", displayName: "Local Stadium", assetPrefix: "stage_stadium", number: 13, mood: "B", wired: true, ambient: ["clouds", "flags"] },
  { id: "busch", displayName: "Busch Gardens", assetPrefix: "stage_busch", number: 14, mood: "B", wired: true, ambient: ["clouds", "trees", "flags"] },
  { id: "hampton", displayName: "Hampton Waterfront", assetPrefix: "stage_hampton", number: 15, mood: "B", wired: true, ambient: ["clouds", "water", "boats"] },
  { id: "poquoson", displayName: "Poquoson Waterfront", assetPrefix: "stage_poquoson", number: 16, mood: "B", wired: true, ambient: ["clouds", "water", "boats"] },
];

export const ARCADE_STAGE_IDS = ["lionsBridge", "hiltonElementary", "axsomDojo"];

const FIGHTERS_BY_ID = new Map([...STARTERS, ...BOSSES].map((f) => [f.id, f]));
const STAGES_BY_ID = new Map(STAGES.map((s) => [s.id, s]));

export function tryFighterById(id: string | undefined | null): FighterDef | null {
  if (!id) return null;
  return FIGHTERS_BY_ID.get(id === "moose" ? "senseiMoose" : id) ?? null;
}

export function fighterById(id: string): FighterDef {
  const found = tryFighterById(id);
  if (!found) throw new Error(`Unknown fighter ${id}`);
  return found;
}

export function stageById(id: string): StageDef {
  return STAGES_BY_ID.get(id) ?? STAGES[0];
}

export function stageCaption(stage: StageDef): string {
  const mood = stage.mood ? `  ·  MOOD ${stage.mood}` : "";
  return `STAGE ${stage.number}  ·  ${stage.displayName.toUpperCase()}${mood}`;
}

export function defaultFighter(): FighterDef {
  return BOSSES.find((b) => !isLockedUntilDefeat(b.id)) ?? BOSSES[0];
}

/** Fallback CPU when no opponent is picked — another default-playable boss, never a scratch starter. */
export function dummyOpponent(player: FighterDef): FighterDef {
  const pool = BOSSES.filter((b) => b.id !== player.id && !isLockedUntilDefeat(b.id));
  return pool[0] ?? BOSSES.find((b) => b.id !== player.id) ?? BOSSES[0];
}

/** Arcade uses the opponent's home stage. `arcadeIntro` kept for older `step === null` saves. */
export function opponentHomeStageId(opponent: FighterDef, arcadeIntro: boolean): string {
  return arcadeIntro ? "lionsBridge" : opponent.stageId;
}

/** Core pose-bar set. `hit` / `defeat` load when Pixel drops frames; `defeated` is an alias. */
export const CORE_FIGHTER_ANIM_NAMES = ["idle", "punch", "kick", "jump", "block", "crouch", "sweep"] as const;
export const OPTIONAL_FIGHTER_ANIM_NAMES = ["hit", "defeat"] as const;
export const FIGHTER_ANIM_NAMES = [...CORE_FIGHTER_ANIM_NAMES, ...OPTIONAL_FIGHTER_ANIM_NAMES] as const;
export type FighterAnimName = (typeof FIGHTER_ANIM_NAMES)[number];
export const DEFEAT_ANIM_ALIASES = ["defeat", "defeated"] as const;

export function slotName(fighter: FighterDef): string {
  return fighter.kind === "starter" ? `slot-starter-${fighter.id}` : `slot-boss-${fighter.id}`;
}

export function parseSlot(name: string): FighterDef | null {
  if (name.startsWith("slot-starter-")) return fighterById(name.slice("slot-starter-".length));
  if (name.startsWith("slot-boss-")) return fighterById(name.slice("slot-boss-".length));
  return null;
}
