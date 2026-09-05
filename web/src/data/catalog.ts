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

export interface StageDef {
  id: string;
  displayName: string;
  assetPrefix: string;
  number: number;
  mood: string | null;
  wired: boolean;
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
  const hasDedicatedArt = id !== "senseiMoose";
  return {
    id,
    kind: "boss",
    displayName,
    portrait: hasDedicatedArt ? `boss_${id}_portrait` : "moose_title_idle",
    idle: hasDedicatedArt ? `boss_${id}_idle_00` : "moose_title_idle",
    accent,
    ultimate: ult(id, name, summary, flavor),
    stageId,
  };
}

export const STARTERS: FighterDef[] = [
  starter("matt", "Matt", rgb(0.77, 0.2, 0.15), "Rising Fang", "Leap uppercut homage to a classic dragon-punch.", "risingDragon"),
  starter("simon", "Simon", rgb(0.13, 0.27, 0.55), "Spirit Wave", "Palm-fired energy lunge, fireball-style homage.", "spiritWave"),
  starter("rich", "Rich", rgb(0.14, 0.43, 0.24), "Grove Lock", "Command grab into a body slam.", "commandSlam"),
  starter("amanda", "Amanda", rgb(0.46, 0.19, 0.59), "Violet Flash", "Back-flip kick that climbs the opponent.", "flipKick"),
  starter("jb", "JB", rgb(0.77, 0.6, 0.14), "Gold Rush", "Full-sprint clothesline.", "clothesline"),
];

export const BOSSES: FighterDef[] = [
  boss("misty", "Misty", rgb(0.85, 0.35, 0.55), "lionsBridge", "Rising Heel Flash", "Rising heel kick flash.", "flipKick"),
  boss("lucas", "Lucas", rgb(0.2, 0.45, 0.75), "lionsBridge", "Rapid Palm Barrage", "Rapid-fire palm strikes.", "rapidFists"),
  boss("chris", "Chris", rgb(0.55, 0.25, 0.2), "lionsBridge", "Diving Elbow Drop", "Top-rope style diving elbow.", "elbowDrop"),
  boss("christiano", "Christiano", rgb(0.15, 0.55, 0.4), "lionsBridge", "Wheel Kick Spiral", "Spinning wheel-kick spiral.", "spinningLariat"),
  boss("dakota", "Dakota", rgb(0.7, 0.45, 0.15), "lionsBridge", "Charge Spear", "Full-sprint spear tackle.", "spear"),
  boss("johnk", "John K.", rgb(0.25, 0.25, 0.45), "hiltonElementary", "Power Slam", "Sit-out power slam.", "powerbomb"),
  boss("finley", "Finley", rgb(0.45, 0.55, 0.25), "hiltonElementary", "Vertical Suplex", "Vertical snap-suplex.", "suplex"),
  boss("hudson", "Hudson", rgb(0.4, 0.3, 0.2), "hiltonElementary", "Running Clothesline", "Full-sprint clothesline.", "clothesline"),
  boss("michael", "Michael", rgb(0.3, 0.4, 0.55), "hiltonElementary", "Sharpshooter Lock", "Figure-four style leg submission homage.", "figure4"),
  boss("kasey", "Kasey", rgb(0.65, 0.25, 0.4), "hiltonElementary", "Moonsault Splash", "Backflip moonsault splash.", "moonsault"),
  boss("jaylen", "Jaylen", rgb(0.2, 0.55, 0.55), "axsomDojo", "Hurricane Kick", "Spinning hurricane kick barrage.", "tornadoKick"),
  boss("amiyr", "Amiyr", rgb(0.5, 0.2, 0.55), "axsomDojo", "Axe Kick Crash", "Overhead axe-kick crash.", "dropkick"),
  boss("shaun", "Shaun", rgb(0.35, 0.35, 0.35), "axsomDojo", "Rising Fist Upper", "Rising uppercut fist.", "risingDragon"),
  boss("ryan", "Ryan", rgb(0.7, 0.2, 0.2), "axsomDojo", "Running Knee Strike", "Sprint into a jumping knee.", "cutter"),
  boss("austin", "Austin", rgb(0.2, 0.35, 0.65), "axsomDojo", "Tornado Kick Barrage", "Spinning kick barrage — stylized homage.", "tornadoKick"),
  boss("senseiMoose", "Sensei Moose", rgb(0.55, 0.32, 0.12), "axsomDojo", "Figure-Four Lock", "Figure-4 leglock submission finisher.", "figure4"),
];

export const LADDER_IDS = BOSSES.map((b) => b.id);

export const STAGES: StageDef[] = [
  { id: "lionsBridge", displayName: "Lions Bridge", assetPrefix: "stage1", number: 1, mood: "B", wired: true },
  { id: "hiltonElementary", displayName: "Hilton Elementary School", assetPrefix: "stage2", number: 2, mood: "B", wired: true },
  { id: "axsomDojo", displayName: "Axsom Martial Arts Dojo", assetPrefix: "stage3", number: 3, mood: "B", wired: true },
];

const FIGHTERS_BY_ID = new Map([...STARTERS, ...BOSSES].map((f) => [f.id, f]));
const STAGES_BY_ID = new Map(STAGES.map((s) => [s.id, s]));

export function fighterById(id: string): FighterDef {
  const found = FIGHTERS_BY_ID.get(id);
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

export function dummyOpponent(player: FighterDef): FighterDef {
  if (player.kind === "starter") {
    return STARTERS.find((s) => s.id !== player.id) ?? STARTERS[4];
  }
  return STARTERS[4];
}

export function slotName(fighter: FighterDef): string {
  return fighter.kind === "starter" ? `slot-starter-${fighter.id}` : `slot-boss-${fighter.id}`;
}

export function parseSlot(name: string): FighterDef | null {
  if (name.startsWith("slot-starter-")) return fighterById(name.slice("slot-starter-".length));
  if (name.startsWith("slot-boss-")) return fighterById(name.slice("slot-boss-".length));
  return null;
}
