import type Phaser from "phaser";
import { hideMatchOverlay } from "./matchOverlay";
import { applyQueryUnlocks } from "./storage";

const FLOW = ["Title", "Select", "Fight", "Leaderboard"] as const;

/**
 * Start a flow scene after fully stopping the others.
 *
 * iPad Safari + Phaser: calling `scene.restart()` from a pointer callback
 * (Next Fight) often dies mid-dispatch — the overlay GameObject is destroyed
 * while the event is still walking the display list. Title can also stay
 * sleeping with live hit targets that steal the tap.
 *
 * Defer onto `window.setTimeout` so the pointer event finishes, kill Title
 * input, then `stop` + `start` with fresh data (never in-place restart).
 */
export function go(from: Phaser.Scene, key: (typeof FLOW)[number], data?: object): void {
  const game = from.game;
  applyQueryUnlocks();
  hideMatchOverlay();
  from.input.enabled = false;
  silenceTitle(game);

  window.setTimeout(() => {
    if (!game.isRunning) return;
    applyQueryUnlocks();
    silenceTitle(game);
    for (const name of FLOW) {
      if (name === key) continue;
      if (game.scene.isActive(name) || game.scene.isSleeping(name)) {
        game.scene.stop(name);
      }
    }
    if (game.scene.isActive(key) || game.scene.isSleeping(key)) {
      game.scene.stop(key);
    }
    game.scene.start(key, data);
  }, 0);
}

function silenceTitle(game: Phaser.Game): void {
  const title = game.scene.getScene("Title");
  if (!title) return;
  title.input.enabled = false;
  title.input.removeAllListeners();
}
