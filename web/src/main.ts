import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./config";
import { BootScene } from "./scenes/BootScene";
import { FightScene } from "./scenes/FightScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";
import { SelectScene } from "./scenes/SelectScene";
import { TitleScene } from "./scenes/TitleScene";
import { VictoryScene } from "./scenes/VictoryScene";

const hint = document.getElementById("rotate-hint");
document.getElementById("rotate-dismiss")?.addEventListener("click", () => {
  hint?.classList.add("hidden");
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  backgroundColor: "#140d1f",
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
  },
  audio: {
    disableWebAudio: false,
  },
  render: {
    antialias: true,
    pixelArt: false,
    transparent: false,
  },
  scene: [BootScene, TitleScene, SelectScene, FightScene, VictoryScene, LeaderboardScene],
});

game.sound.pauseOnBlur = false;
const unlock = () => {
  try {
    if (game.sound.locked) game.sound.unlock();
    const ctx = (game.sound as Phaser.Sound.WebAudioSoundManager).context;
    if (ctx && ctx.state !== "running") void ctx.resume();
  } catch {
    /* audio optional */
  }
};
for (const ev of ["pointerdown", "pointerup", "touchstart", "touchend", "keydown"]) {
  window.addEventListener(ev, unlock, { capture: true });
}
