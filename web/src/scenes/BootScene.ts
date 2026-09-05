import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { BOSSES, STARTERS } from "../data/catalog";
import { applyQueryUnlocks } from "../game/storage";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    applyQueryUnlocks();
    this.cameras.main.setBackgroundColor(0x140d1f);
    const barW = 520;
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    this.add
      .text(cx, cy - 70, "Sensei Moose's Dojo", {
        fontFamily: FONT,
        fontSize: "36px",
        color: GOLD,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const track = this.add.rectangle(cx, cy, barW, 18, 0x1a1324).setStrokeStyle(2, 0xffd651);
    const fill = this.add.rectangle(cx - barW / 2 + 2, cy, 4, 12, 0xffd651).setOrigin(0, 0.5);
    this.add
      .text(cx, cy + 36, "Loading portraits + title art…", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#c8c0d4",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      fill.width = Math.max(4, (barW - 4) * value);
      void track;
    });

    const keys = new Set<string>([
      "moose_title_idle",
      "moose_title_body",
      "moose_title_head",
      "stage1_sky",
      "stage1_master",
    ]);
    for (const f of [...STARTERS, ...BOSSES]) {
      keys.add(f.portrait);
      keys.add(f.idle);
      keys.add(f.ultimate.frameName);
    }

    for (const key of keys) {
      this.load.image(key, `assets/${key}.png`);
    }
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn("Missing art (placeholder will be used):", file.key);
    });
  }

  create(): void {
    for (const key of this.textures.getTextureKeys()) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    for (const f of [...STARTERS, ...BOSSES]) {
      this.ensurePlaceholder(f.portrait, f.accent);
      this.ensurePlaceholder(f.idle, f.accent);
    }
    this.scene.start("Title");
  }

  private ensurePlaceholder(key: string, color: number): void {
    if (this.textures.exists(key) && this.textures.get(key).getSourceImage().width > 1) return;
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, 80, 120, 8);
    g.lineStyle(2, 0xffffff, 0.4);
    g.strokeRoundedRect(0, 0, 80, 120, 8);
    g.generateTexture(key, 80, 120);
    g.destroy();
  }
}
