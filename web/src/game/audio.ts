import type Phaser from "phaser";

/** Shared fight / select loop. Optional until Pixel drops the file. */
export const FIGHT_LOOP_KEY = "fight_a_loop";
export const FIGHT_LOOP_URLS = [
  "assets/audio/fight_a_loop.ogg",
  "assets/audio/fight_a_loop.mp3",
  "assets/audio/fight_a_loop.wav",
] as const;

export function hasFightLoop(scene: Phaser.Scene): boolean {
  return scene.cache.audio.exists(FIGHT_LOOP_KEY);
}

/** Play (or keep) the arcade loop on Select and Fight. No-op if unwired. */
export function playFightLoop(scene: Phaser.Scene, volume = 0.32): void {
  if (!hasFightLoop(scene) || !scene.sound || scene.sound.locked === undefined) return;
  try {
    const existing = scene.sound.get(FIGHT_LOOP_KEY);
    if (existing) {
      if ("setVolume" in existing && typeof existing.setVolume === "function") existing.setVolume(volume);
      if (!existing.isPlaying) existing.play();
      return;
    }
    scene.sound.play(FIGHT_LOOP_KEY, { loop: true, volume });
  } catch {
    /* audio optional */
  }
}

export function stopFightLoop(scene: Phaser.Scene): void {
  try {
    scene.sound.get(FIGHT_LOOP_KEY)?.stop();
  } catch {
    /* ignore */
  }
}
