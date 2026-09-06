import { BOSSES, LADDER_IDS, STARTERS, type FighterDef, fighterById } from "../data/catalog";

const UNLOCK_KEY = "dojo.unlockedBossIDs";
const SCORES_KEY = "smd.localTop10";
const NAME_KEY = "smd.displayName";

export function unlockedBossIDs(): Set<string> {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    /* ignore */
  }
  return new Set();
}

export function isUnlocked(bossId: string): boolean {
  return unlockedBossIDs().has(bossId);
}

export function unlockBoss(bossId: string): void {
  const set = unlockedBossIDs();
  if (set.has(bossId)) return;
  set.add(bossId);
  localStorage.setItem(UNLOCK_KEY, JSON.stringify([...set].sort()));
}

export function unlockAllBosses(): void {
  localStorage.setItem(UNLOCK_KEY, JSON.stringify(LADDER_IDS));
}

export function selectRoster(): { starters: FighterDef[]; unlockedBosses: FighterDef[] } {
  const unlocked = unlockedBossIDs();
  return {
    starters: STARTERS,
    unlockedBosses: BOSSES.filter((b) => unlocked.has(b.id)),
  };
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function lastDisplayName(): string {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function setLastDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}

export function loadTop10(): ScoreRow[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    const rows = JSON.parse(raw) as ScoreRow[];
    return Array.isArray(rows) ? rows.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function submitScore(name: string, score: number): ScoreRow[] {
  const trimmed = name.trim().slice(0, 16) || "Sensei";
  setLastDisplayName(trimmed);
  const rows = loadTop10();
  rows.push({ rank: 0, name: trimmed, score, date: new Date().toISOString() });
  rows.sort((a, b) => (a.score !== b.score ? b.score - a.score : a.date.localeCompare(b.date)));
  const top = rows.slice(0, 10).map((row, i) => ({ ...row, rank: i + 1 }));
  localStorage.setItem(SCORES_KEY, JSON.stringify(top));
  return top;
}

export function applyQueryUnlocks(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get("unlock") === "all") unlockAllBosses();
}

/** `?debug=1` — heavy player hits so Brandon can check round / Next Fight flow quickly. */
export function debugHeavyHits(): boolean {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

/** `?ult=1` — start each round with a full player ultimate meter (splash QA). */
export function debugFullUlt(): boolean {
  return new URLSearchParams(window.location.search).get("ult") === "1";
}

export function fighterFromQuery(): FighterDef | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("fighter");
  if (!id) return null;
  try {
    return fighterById(id);
  } catch {
    return null;
  }
}
