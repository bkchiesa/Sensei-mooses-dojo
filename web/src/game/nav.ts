import type Phaser from "phaser";
import { hideMatchOverlay } from "./matchOverlay";
import { applyQueryUnlocks } from "./storage";

const FLOW = ["Title", "Select", "Fight", "Leaderboard"] as const;

/**
 * Scene change used by Title / Select / Fight / overlay buttons.
 *
 * Do not call scene.start synchronously from a DOM/pointer callback —
 * Phaser can abort a same-scene restart mid-dispatch on iPad Safari.
 * Do not use window.setTimeout either: iOS delays or drops timeouts
 * scheduled during a touch, which hid the overlay and then never started
 * the next fight. Phaser's clock is RAF-backed and keeps ticking.
 *
 * Use scene.restart when staying on the same key. Never stop-all-then-start
 * (zero active scenes relaunches Boot → Title).
 */
export function go(from: Phaser.Scene, key: (typeof FLOW)[number], data?: object): void {
  applyQueryUnlocks();
  hideMatchOverlay();
  from.input.enabled = false;
  try {
    const title = from.game.scene.getScene("Title");
    if (title) title.input.enabled = false;
  } catch {
    /* Title may already be gone */
  }

  const payload = data;
  deferSceneChange(from, () => {
    if (!from.sys.game?.isRunning) return;
    applyQueryUnlocks();
    hideMatchOverlay();
    if (key === from.scene.key) from.scene.restart(payload);
    else from.scene.start(key, payload);
  });
}

/** Run after the current input/DOM turn, on the Phaser clock when possible. */
export function deferSceneChange(from: Phaser.Scene, fn: () => void): void {
  if (from.sys.isActive()) from.time.delayedCall(0, fn);
  else requestAnimationFrame(fn);
}
