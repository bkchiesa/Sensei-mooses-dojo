import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./config";
import { debugHeavyHits } from "./game/storage";
import { BootScene } from "./scenes/BootScene";
import { FightScene } from "./scenes/FightScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";
import { SelectScene } from "./scenes/SelectScene";
import { TitleScene } from "./scenes/TitleScene";

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
  scene: [BootScene, TitleScene, SelectScene, FightScene, LeaderboardScene],
});

if (debugHeavyHits()) {
  (window as Window & { __smdGame?: Phaser.Game }).__smdGame = game;
}
