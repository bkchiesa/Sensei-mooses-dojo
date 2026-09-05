import type Phaser from "phaser";

/** Shared fight / select loop. Optional until Pixel drops the file. */
export const FIGHT_LOOP_KEY = "fight_a_loop";
export const FIGHT_LOOP_URLS = [
  "assets/audio/fight_a_loop.ogg",
  "assets/audio/fight_a_loop.mp3",
  "assets/audio/fight_a_loop.wav",
] as const;

export function hasFightLoop(scene: Phaser.Scene): boolean {
  try {
    return scene.cache.audio.exists(FIGHT_LOOP_KEY);
  } catch {
    return false;
  }
}

/** Play (or keep) the arcade loop on Select and Fight. No-op if unwired. */
export function playFightLoop(scene: Phaser.Scene, volume = 0.32): void {
  if (!hasFightLoop(scene) || !scene.sound) return;
  try {
    if (scene.sound.locked) return;
    const existing = scene.sound.get(FIGHT_LOOP_KEY);
    if (existing) {
      if ("setVolume" in existing && typeof existing.setVolume === "function") existing.setVolume(volume);
      if (!existing.isPlaying) existing.play();
      return;
    }
    scene.sound.play(FIGHT_LOOP_KEY, { loop: true, volume });
  } catch {
    /* audio optional — never block a scene */
  }
}

export function stopFightLoop(scene: Phaser.Scene): void {
  try {
    scene.sound.get(FIGHT_LOOP_KEY)?.stop();
  } catch {
    /* ignore */
  }
}
