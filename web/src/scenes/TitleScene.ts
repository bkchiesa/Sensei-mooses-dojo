import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD } from "../config";
import { installUnlock, playSfx, playTitleLoop, unlockAudio } from "../game/audio";
import { unlockAllBosses } from "../game/storage";
import { drawTitleInterior, drawTitleLogo, hasTitleLogo, textureReady, TITLE_ART } from "../game/titleArt";
import { textStyle } from "../game/ui";

export class TitleScene extends Phaser.Scene {
  private titleTaps = 0;
  private menuConsumed = false;

  constructor() {
    super("Title");
  }

  create(): void {
    this.titleTaps = 0;
    this.menuConsumed = false;
    this.input.enabled = true;
    this.cameras.main.setBackgroundColor(0x140d1f);
    this.buildWash();
    this.buildMoose();
    this.buildTitle();
    this.buildPrompt();
    this.buildMenuButtons();
    installUnlock(this);
    this.input.on("pointerdown", () => {
      unlockAudio(this);
      playTitleLoop(this);
    });
    playTitleLoop(this);
    const welcome = () => playSfx(this, "splash_welcome");
    if (this.sound.locked) this.sound.once("unlocked", welcome);
    else welcome();
  }

  shutdown(): void {
    this.menuConsumed = true;
    this.input.enabled = false;
  }

  private has(key: string): boolean {
    return textureReady(this, key);
  }

  /**
   * Locked `title_bg_dojo` full-bleed when Boot loaded it; else the
   * current stage wash. Arcade / Free Play / Fight stay untouched.
   */
  private buildWash(): void {
    if (drawTitleInterior(this)) {
      this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 45, DESIGN_WIDTH, 90, 0x1a0c10, 0.55);
      return;
    }
    const wash = this.has("stage1_sky") ? "stage1_sky" : this.has("stage1_master") ? "stage1_master" : null;
    if (wash) {
      this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, wash).setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT).setAlpha(0.35);
    }
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x0f081a, 0.45);
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 45, DESIGN_WIDTH, 90, 0x2e1a12);
  }

  private buildMoose(): void {
    if (hasTitleLogo(this)) return;
    const key = this.has(TITLE_ART.moose) ? TITLE_ART.moose : null;
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

  /**
   * Locked `title_logo_00–07` glow loop (hero / single frame if the loop
   * is incomplete). Falls back to the live text title.
   */
  private buildTitle(): void {
    const y = hasTitleLogo(this) ? DESIGN_HEIGHT * 0.38 : DESIGN_HEIGHT * 0.18;
    const logo = drawTitleLogo(this, DESIGN_WIDTH / 2, y);
    const tagY = logo ? logo.y + logo.displayHeight * 0.5 + 14 : DESIGN_HEIGHT * 0.18 + 48;
    const grantUnlock = () => {
      if (this.menuConsumed) return;
      this.titleTaps += 1;
      if (this.titleTaps >= 8) {
        unlockAllBosses();
        playSfx(this, "unlock_boss");
        this.add.text(DESIGN_WIDTH / 2, tagY + 52, "ALL BOSSES UNLOCKED", textStyle(16, "#9fff9f")).setOrigin(0.5);
      }
    };
    if (logo) {
      logo.setInteractive({ useHandCursor: true });
      logo.on("pointerup", grantUnlock);
      if (!logo.anims?.isPlaying) {
        this.tweens.add({
          targets: logo,
          scale: logo.scale * 1.04,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    } else {
      this.add
        .text(DESIGN_WIDTH / 2 + 3, y + 3, "Sensei Moose's Dojo", textStyle(52, "#3f150a"))
        .setOrigin(0.5);
      const title = this.add.text(DESIGN_WIDTH / 2, y, "Sensei Moose's Dojo", textStyle(52, GOLD)).setOrigin(0.5);
      title.setInteractive({ useHandCursor: true });
      title.on("pointerup", grantUnlock);
      this.tweens.add({
        targets: title,
        scale: 1.045,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
    this.add
      .text(DESIGN_WIDTH / 2, tagY, "Street-fight  ·  best of 3  ·  play in the browser", {
        fontFamily: FONT,
        fontSize: "18px",
        color: "#d8d0dc",
      })
      .setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, tagY + 24, "Stick / WASD move  ·  stick↑ or W jump  ·  J punch  ·  K kick  ·  U ult", {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#9a90a8",
      })
      .setOrigin(0.5);
  }

  private buildPrompt(): void {
    const prompt = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 148, "TAP FOR ARCADE", textStyle(22, "#f2f2f2"))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    prompt.on("pointerdown", () => this.open("arcade"));
    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });
  }

  private buildMenuButtons(): void {
    this.menuButton("ARCADE", DESIGN_WIDTH * 0.32, DESIGN_HEIGHT - 92, () => this.open("arcade"));
    this.menuButton("FREE PLAY", DESIGN_WIDTH * 0.5, DESIGN_HEIGHT - 92, () => this.open("freePlay"));
    this.menuButton("TOP 10", DESIGN_WIDTH * 0.68, DESIGN_HEIGHT - 92, () => this.open("board"));
  }

  private open(which: "arcade" | "freePlay" | "board"): void {
    if (this.menuConsumed) return;
    this.menuConsumed = true;
    unlockAudio(this);
    playSfx(this, "menu_confirm");
    this.input.enabled = false;
    this.scene.start(which === "board" ? "Leaderboard" : "Select", which === "board" ? undefined : { mode: which });
  }

  private menuButton(label: string, x: number, y: number, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 200, 52, 0x1f1f1f, 0.9).setStrokeStyle(2, 0xffd651);
    const text = this.add.text(x, y, label, textStyle(16, GOLD)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    text.setInteractive({ useHandCursor: true });
    const goTap = (e: Phaser.Input.Pointer) => {
      e.event?.stopPropagation?.();
      onClick();
    };
    bg.on("pointerdown", goTap);
    text.on("pointerdown", goTap);
  }
}
