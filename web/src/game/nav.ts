import type Phaser from "phaser";
import { hideMatchOverlay } from "./matchOverlay";
import { applyQueryUnlocks } from "./storage";

const FLOW = ["Title", "Select", "Fight", "Leaderboard"] as const;

/**
 * Scene change used by Title / Select / Fight / overlay buttons.
 *
 * Defer off the pointer callback (iPad Safari + Phaser will abort a
 * synchronous restart mid-dispatch). Use `scene.start` — it already stops
 * the current scene — instead of stop-all-then-start, which can leave zero
 * active scenes so Boot relaunches and dumps the player on Title.
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
  window.setTimeout(() => {
    if (!from.game.isRunning) return;
    applyQueryUnlocks();
    hideMatchOverlay();
    from.scene.start(key, payload);
  }, 16);
}
