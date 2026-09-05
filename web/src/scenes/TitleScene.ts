import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { unlockAllBosses } from "../game/storage";
import { textStyle } from "../game/ui";

export class TitleScene extends Phaser.Scene {
  private titleTaps = 0;

  constructor() {
    super("Title");
  }

  create(): void {
    this.titleTaps = 0;
    this.cameras.main.setBackgroundColor(0x140d1f);
    this.buildWash();
    this.buildMoose();
    this.buildTitle();
    this.buildPrompt();
    this.buildMenuButtons();
  }

  private has(key: string): boolean {
    return this.textures.exists(key) && this.textures.get(key).getSourceImage().width > 1;
  }

  private buildWash(): void {
    const wash = this.has("stage1_sky") ? "stage1_sky" : this.has("stage1_master") ? "stage1_master" : null;
    if (wash) {
      this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, wash).setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT).setAlpha(0.35);
    }
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x0f081a, 0.45);
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 45, DESIGN_WIDTH, 90, 0x2e1a12);
  }

  private buildMoose(): void {
    const key = this.has("moose_title_idle") ? "moose_title_idle" : null;
    const h = DESIGN_HEIGHT * 0.4;
    const y = DESIGN_HEIGHT * 0.54;
    if (key) {
      const moose = this.add.image(DESIGN_WIDTH / 2, y, key);
      const scale = h / moose.height;
      moose.setScale(scale);
      moose.setDepth(5);
      this.tweens.add({
        targets: moose,
        y: y - 16,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.add
        .text(DESIGN_WIDTH / 2, y, "MOOSE", { fontFamily: FONT, fontSize: "64px", color: "#8b5220", fontStyle: "bold" })
        .setOrigin(0.5);
    }
  }

  private buildTitle(): void {
    const y = DESIGN_HEIGHT * 0.18;
    this.add
      .text(DESIGN_WIDTH / 2 + 3, y + 3, "Sensei Moose's Dojo", textStyle(52, "#3f150a"))
      .setOrigin(0.5);
    const title = this.add.text(DESIGN_WIDTH / 2, y, "Sensei Moose's Dojo", textStyle(52, GOLD)).setOrigin(0.5);
    title.setInteractive({ useHandCursor: true });
    title.setData("menu", true);
    title.on("pointerup", () => {
      this.titleTaps += 1;
      if (this.titleTaps >= 8) {
        unlockAllBosses();
        this.add.text(DESIGN_WIDTH / 2, y + 96, "ALL BOSSES UNLOCKED", textStyle(16, "#9fff9f")).setOrigin(0.5);
      }
    });
    this.tweens.add({
      targets: title,
      scale: 1.045,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.18 + 48, "Street-fight  ·  best of 3  ·  play in the browser", {
        fontFamily: FONT,
        fontSize: "18px",
        color: "#d8d0dc",
      })
      .setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.18 + 72, "Keyboard  ·  arrows move  ·  J punch  ·  K kick  ·  U ult", {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#9a90a8",
      })
      .setOrigin(0.5);
  }

  private buildPrompt(): void {
    const prompt = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 148, "TAP FOR ARCADE", textStyle(22, "#f2f2f2"))
      .setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });
  }

  private buildMenuButtons(): void {
    this.menuButton("ARCADE", DESIGN_WIDTH * 0.32, DESIGN_HEIGHT - 92, () => {
      this.scene.start("Select", { mode: "arcade" });
    });
    this.menuButton("FREE PLAY", DESIGN_WIDTH * 0.5, DESIGN_HEIGHT - 92, () => {
      this.scene.start("Select", { mode: "freePlay" });
    });
    this.menuButton("TOP 10", DESIGN_WIDTH * 0.68, DESIGN_HEIGHT - 92, () => {
      this.scene.start("Leaderboard");
    });

    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.sys.isActive()) return;
      const hits = this.input.hitTestPointer(p);
      if (hits.some((obj) => Boolean(obj.getData("menu")))) return;
      this.scene.start("Select", { mode: "arcade" });
    });
  }

  private menuButton(label: string, x: number, y: number, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 168, 44, 0x1f1f1f, 0.9).setStrokeStyle(2, 0xffd651);
    bg.setData("menu", true);
    const text = this.add.text(x, y, label, textStyle(16, GOLD)).setOrigin(0.5);
    text.setData("menu", true);
    bg.setInteractive({ useHandCursor: true });
    text.setInteractive({ useHandCursor: true });
    const go = (e: Phaser.Input.Pointer) => {
      e.event?.stopPropagation?.();
      onClick();
    };
    bg.on("pointerup", go);
    text.on("pointerup", go);
  }
}
