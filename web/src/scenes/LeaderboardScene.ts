import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { go } from "../game/nav";
import { loadTop10 } from "../game/storage";
import { textStyle } from "../game/ui";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("Leaderboard");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x120d1c);
    this.add.text(DESIGN_WIDTH / 2, 48, "TOP 10", textStyle(36, GOLD)).setOrigin(0.5);
    const back = this.add.text(36, 36, "← TITLE", textStyle(16, "#d9d9d9")).setInteractive({ useHandCursor: true });
    back.on("pointerup", () => go(this, "Title"));

    this.add
      .text(DESIGN_WIDTH / 2, 88, "This browser  ·  Game Center is native-only", {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#b3b3b3",
      })
      .setOrigin(0.5);

    const rows = loadTop10();
    if (rows.length === 0) {
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.5, "No scores yet. Win a bout to post one.", {
          fontFamily: FONT,
          fontSize: "18px",
          color: "#cccccc",
        })
        .setOrigin(0.5);
      return;
    }

    rows.forEach((row, index) => {
      const y = 140 + index * 48;
      this.add.rectangle(DESIGN_WIDTH / 2, y, 780, 42, 0x1f1f1f, 0.9).setStrokeStyle(1, 0xffffff, 0.12);
      this.add.text(DESIGN_WIDTH / 2 - 360, y, String(row.rank).padStart(2, " "), textStyle(20, GOLD)).setOrigin(0, 0.5);
      this.add.text(DESIGN_WIDTH / 2 - 300, y, row.name, textStyle(20)).setOrigin(0, 0.5);
      this.add.text(DESIGN_WIDTH / 2 + 360, y, String(row.score), textStyle(20)).setOrigin(1, 0.5);
    });
  }
}
