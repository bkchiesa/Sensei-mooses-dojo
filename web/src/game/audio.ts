import type Phaser from "phaser";

/** Shared fight / select loop. */
export const FIGHT_LOOP_KEY = "fight_a_loop";
export const TITLE_LOOP_KEY = "title_attract_loop";
export const AUDIO_MANIFEST_KEY = "audio-manifest";
export const AUDIO_MANIFEST_URL = "assets/audio/manifest.json";

export const FIGHT_LOOP_URLS = [
  "assets/audio/bgm/fight_a_loop.ogg",
  "assets/audio/bgm/fight_a_loop.mp3",
  "assets/audio/fight_a_loop.ogg",
  "assets/audio/fight_a_loop.mp3",
] as const;

export interface AudioCue {
  kind?: "sfx" | "bgm" | "vo";
  loop?: boolean;
  urls: string[];
}

export interface AudioManifest {
  source?: string;
  cues?: Record<string, AudioCue>;
  files?: string[];
}

const SFX_VOL = 0.62;
const BGM_VOL = 0.32;
const STING_VOL = 0.55;

let unlockBound = false;
let pendingBgm: { key: string; volume: number } | null = null;
const optionalKeys = new Set<string>([AUDIO_MANIFEST_KEY, FIGHT_LOOP_KEY, TITLE_LOOP_KEY]);

export function parseAudioManifest(raw: unknown): AudioManifest {
  if (!raw || typeof raw !== "object") return { cues: {} };
  const m = raw as AudioManifest;
  const cues: Record<string, AudioCue> = {};
  if (m.cues && typeof m.cues === "object") {
    for (const [key, cue] of Object.entries(m.cues)) {
      if (!cue || !Array.isArray(cue.urls) || !cue.urls.length) continue;
      const urls = cue.urls.filter((u): u is string => typeof u === "string" && u.length > 0);
      if (!urls.length) continue;
      cues[key] = { kind: cue.kind, loop: cue.loop, urls };
    }
  }
  return { source: m.source, cues, files: m.files };
}

/** Only queue audio the export manifest says is on disk — no speculative 404s. */
export function audioQueueFromManifest(raw: unknown): { key: string; urls: string[] }[] {
  const { cues } = parseAudioManifest(raw);
  const queue: { key: string; urls: string[] }[] = [];
  for (const [key, cue] of Object.entries(cues ?? {})) {
    optionalKeys.add(key);
    queue.push({ key, urls: cue.urls });
  }
  return queue;
}

export function optionalAudioKeys(): string[] {
  return [...optionalKeys];
}

export function hasCue(scene: Phaser.Scene, key: string): boolean {
  try {
    return Boolean(key) && scene.cache.audio.exists(key);
  } catch {
    return false;
  }
}

export function hasFightLoop(scene: Phaser.Scene): boolean {
  return hasCue(scene, FIGHT_LOOP_KEY);
}

function webAudioContext(sound: Phaser.Sound.BaseSoundManager): AudioContext | undefined {
  try {
    const ctx = (sound as Phaser.Sound.WebAudioSoundManager).context;
    return ctx ?? undefined;
  } catch {
    return undefined;
  }
}

/** Resume WebAudio after a user gesture so iPad Safari actually plays SFX. */
export function unlockAudio(scene: Phaser.Scene): void {
  if (!scene.sound) return;
  try {
    if (scene.sound.locked) scene.sound.unlock();
    const ctx = webAudioContext(scene.sound);
    if (ctx && ctx.state !== "running") void ctx.resume();
  } catch {
    /* audio optional */
  }
}

function replayPendingBgm(scene: Phaser.Scene): void {
  if (!pendingBgm) return;
  const { key, volume } = pendingBgm;
  playBgm(scene, key, { volume, loop: true });
}

/** One-time window + Phaser unlock so the first title tap starts audio. */
export function installUnlock(scene: Phaser.Scene): void {
  if (!scene.sound) return;
  const resume = () => {
    unlockAudio(scene);
    if (!scene.sound.locked) replayPendingBgm(scene);
  };
  if (!unlockBound) {
    unlockBound = true;
    const opts: AddEventListenerOptions = { capture: true };
    for (const ev of ["pointerdown", "pointerup", "touchstart", "touchend", "keydown"]) {
      window.addEventListener(ev, resume, opts);
    }
    scene.game.canvas?.addEventListener("pointerdown", resume);
    scene.game.canvas?.addEventListener("touchend", resume);
  }
  if (scene.sound.locked) {
    scene.sound.once("unlocked", () => replayPendingBgm(scene));
  }
  resume();
}

export function playSfx(scene: Phaser.Scene, key: string, volume = SFX_VOL): void {
  if (!key || !scene.sound || !hasCue(scene, key)) return;
  unlockAudio(scene);
  if (scene.sound.locked) return;
  try {
    scene.sound.play(key, { volume, loop: false });
  } catch {
    /* audio optional — never block a scene */
  }
}

export function playBgm(
  scene: Phaser.Scene,
  key: string,
  opts?: { volume?: number; loop?: boolean },
): void {
  const volume = opts?.volume ?? BGM_VOL;
  const loop = opts?.loop ?? true;
  pendingBgm = loop ? { key, volume } : pendingBgm;
  if (!scene.sound || !hasCue(scene, key)) return;
  unlockAudio(scene);
  if (scene.sound.locked) return;
  try {
    const existing = scene.sound.get(key);
    if (existing) {
      if ("setVolume" in existing && typeof existing.setVolume === "function") existing.setVolume(volume);
      if (!existing.isPlaying) existing.play({ loop, volume });
      stopOtherLoops(scene, key);
      return;
    }
    stopOtherLoops(scene, key);
    scene.sound.play(key, { loop, volume });
  } catch {
    /* audio optional — never block a scene */
  }
}

function stopOtherLoops(scene: Phaser.Scene, keep: string): void {
  for (const key of [TITLE_LOOP_KEY, FIGHT_LOOP_KEY, "fight_b_loop", "fight_c_loop", "select_loop"]) {
    if (key === keep) continue;
    try {
      scene.sound.get(key)?.stop();
    } catch {
      /* ignore */
    }
  }
}

const FEMALE_IDS = new Set(["amanda", "misty", "shianne"]);

export type GruntAction = "punch" | "kick" | "hit" | "ko";

/** Shared Tempo grunt bank: moose / female / male. */
export function gruntKey(fighterId: string, action: GruntAction): string {
  const flavor =
    fighterId === "senseiMoose" || fighterId === "moose" ? "moose" : FEMALE_IDS.has(fighterId) ? "female" : "male";
  return `grunt_${flavor}_${action}`;
}

export function playGrunt(scene: Phaser.Scene, fighterId: string, action: GruntAction, volume = 0.55): void {
  playSfx(scene, gruntKey(fighterId, action), volume);
}

export function playSting(scene: Phaser.Scene, key: string, volume = STING_VOL): void {
  playSfx(scene, key, volume);
}

/** Play (or keep) the arcade loop on Select and Fight. No-op if unwired. */
export function playFightLoop(scene: Phaser.Scene, volume = BGM_VOL): void {
  playBgm(scene, FIGHT_LOOP_KEY, { volume, loop: true });
}

export function playTitleLoop(scene: Phaser.Scene, volume = 0.28): void {
  playBgm(scene, TITLE_LOOP_KEY, { volume, loop: true });
}

export function stopFightLoop(scene: Phaser.Scene): void {
  try {
    scene.sound.get(FIGHT_LOOP_KEY)?.stop();
  } catch {
    /* ignore */
  }
}

export function stopBgm(scene: Phaser.Scene): void {
  pendingBgm = null;
  stopOtherLoops(scene, "");
}
