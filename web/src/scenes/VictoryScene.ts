import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD, GOLD_NUM } from "../config";
import { type FighterDef } from "../data/catalog";
import {
  arcadeDefeatedFighters,
  arcadePlayer,
  arcadeRematchLast,
  type ArcadeProgress,
} from "../game/arcade";
import { firstAnimTexture } from "../game/anims";
import { installUnlock, playSfx, playSting, playTitleLoop, unlockAudio } from "../game/audio";
import { go } from "../game/nav";
import { submitScore } from "../game/storage";
import { drawTitleInterior, textureReady } from "../game/titleArt";
import { promptName, textStyle } from "../game/ui";
import { drawVictoryInterior, guideX, guideY, VICTORY_ARC, VICTORY_DEFEATED_SLOTS, VICTORY_HERO } from "../game/victoryArt";

export interface VictoryData {
  arcade: ArcadeProgress;
  score: number;
  /** `?victory=` QA jump. */
  preview?: boolean;
}

/**
 * Arcade-clear celebration.
 *
 * Pixel plate `victory_bg_dojo` is the backdrop. Roster is composited in code
 * (never baked). Guide slots (1280×800):
 *   - Hero standing ~y 120–520
 *   - Defeated arc D1–D8 ~y 580–700 (last 8 beaten if the run is longer)
 *
 * Winner uses idle. Fallen use `defeat_00` when Pixel has dropped it
 * (Batch1–2); otherwise idle rotated/muted.
 */
export class VictoryScene extends Phaser.Scene {
  private arcade!: ArcadeProgress;
  private score = 0;

  constructor() {
    super("Victory");
  }

  init(data: VictoryData): void {
    this.arcade = data.arcade;
    this.score = data.score ?? 0;
  }

  create(): void {
    this.input.enabled = true;
    this.cameras.main.setBackgroundColor(0x140d1f);
    installUnlock(this);
    playTitleLoop(this);
    playSting(this, "victory_sting");
    this.buildWash();
    this.buildCast();
    this.buildCopy();
    this.buildActions();
    this.input.keyboard?.once("keydown-ENTER", () => void this.submit());
  }

  shutdown(): void {
    this.input.enabled = false;
  }

  private buildWash(): void {
    if (drawVictoryInterior(this) || drawTitleInterior(this)) {
      this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x0a0610, 0.18);
      return;
    }
    const wash = textureReady(this, "stage1_sky")
      ? "stage1_sky"
      : textureReady(this, "stage1_master")
        ? "stage1_master"
        : null;
    if (wash) {
      this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, wash).setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT).setAlpha(0.4);
    }
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x120814, 0.45);
  }

  private buildCast(): void {
    const winner = arcadePlayer(this.arcade);
    const fallen = arcadeDefeatedFighters(this.arcade);
    this.drawWinner(winner);
    this.drawFallen(fallen);
  }

  private drawWinner(fighter: FighterDef): void {
    const x = DESIGN_WIDTH / 2;
    const feetY = guideY(VICTORY_HERO.y1);
    const h = guideY(VICTORY_HERO.y1) - guideY(VICTORY_HERO.y0);
    const key = this.standingKey(fighter);
    if (key) {
      const img = this.add.image(x, feetY, key);
      img.setOrigin(0.5, 1);
      const scale = h / img.height;
      img.setScale(scale);
      img.setDepth(8);
    } else {
      this.add.rectangle(x, feetY - h / 2, 140, h, fighter.accent).setDepth(8);
    }
    this.add
      .text(x, feetY + 6, fighter.displayName.toUpperCase(), {
        fontFamily: FONT,
        fontSize: "22px",
        color: GOLD,
        fontStyle: "bold",
        stroke: "#14080a",
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setDepth(12);
  }

  private drawFallen(fallen: FighterDef[]): void {
    if (!fallen.length) return;
    const shown = fallen.length > VICTORY_ARC.max ? fallen.slice(-VICTORY_ARC.max) : fallen;
    const slots = VICTORY_DEFEATED_SLOTS;
    const start = Math.max(0, Math.floor((slots.length - shown.length) / 2));
    shown.forEach((fighter, i) => {
      const slot = slots[start + i] ?? slots[i];
      this.drawDowned(fighter, guideX(slot.x), guideY(slot.y));
    });
  }

  /**
   * Laid-down opponent. Prefers defeat/defeated frames; else idle rotated 90°
   * and muted. Landscape `defeat_00` sheets scale by the long side so they
   * stay in the D1–D8 slot.
   */
  private drawDowned(fighter: FighterDef, x: number, y: number): void {
    const defeat = firstAnimTexture(fighter.id, "defeat");
    const idle = this.standingKey(fighter);
    const key = (defeat && this.hasTex(defeat) ? defeat : idle) ?? null;
    if (key) {
      const img = this.add.image(x, y, key);
      img.setOrigin(0.5, 0.5);
      const target = 88;
      const s = target / Math.max(img.width, img.height, 1);
      img.setScale(s);
      img.setDepth(10);
      if (!defeat) {
        img.setAngle(90);
        img.setTint(0x6a6a78);
        img.setAlpha(0.82);
      }
    } else {
      const body = this.add.rectangle(x, y, 88, 28, fighter.accent, 0.45).setDepth(10);
      body.setStrokeStyle(1, GOLD_NUM, 0.35);
    }
    this.add
      .text(x, y + 34, fighter.displayName.toUpperCase(), {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#c8c0d4",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  private standingKey(fighter: FighterDef): string | null {
    const idleAnim = firstAnimTexture(fighter.id, "idle");
    if (idleAnim && this.hasTex(idleAnim)) return idleAnim;
    if (this.hasTex(fighter.idle)) return fighter.idle;
    if (this.hasTex(fighter.portrait)) return fighter.portrait;
    return null;
  }

  private hasTex(key: string): boolean {
    return textureReady(this, key);
  }

  private buildCopy(): void {
    this.add
      .text(DESIGN_WIDTH / 2, 28, "ARCADE COMPLETE", {
        fontFamily: FONT,
        fontSize: "36px",
        color: GOLD,
        fontStyle: "bold",
        stroke: "#14080a",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.add
      .text(DESIGN_WIDTH / 2, 64, "DOJO CHAMPION", textStyle(16, "#fff6d8"))
      .setOrigin(0.5)
      .setDepth(20);
    this.add
      .text(DESIGN_WIDTH / 2, 88, `SCORE  ${this.score}`, textStyle(15, "#d8d0dc"))
      .setOrigin(0.5)
      .setDepth(20);
  }

  private buildActions(): void {
    const y = DESIGN_HEIGHT - 36;
    this.actionButton("SUBMIT SCORE", DESIGN_WIDTH * 0.28, y, () => void this.submit(), true);
    this.actionButton("REMATCH", DESIGN_WIDTH * 0.5, y, () => this.rematch());
    this.actionButton("CHARACTER SELECT", DESIGN_WIDTH * 0.74, y, () => this.toSelect());
  }

  private actionButton(label: string, x: number, y: number, onClick: () => void, primary = false): void {
    const bg = this.add
      .rectangle(x, y, primary ? 260 : 230, 44, 0x1f1f1f, 0.92)
      .setStrokeStyle(primary ? 3 : 2, GOLD_NUM)
      .setDepth(30);
    const text = this.add.text(x, y, label, textStyle(primary ? 16 : 14, GOLD)).setOrigin(0.5).setDepth(31);
    bg.setInteractive({ useHandCursor: true });
    text.setInteractive({ useHandCursor: true });
    const tap = () => {
      unlockAudio(this);
      playSfx(this, "menu_confirm");
      onClick();
    };
    bg.on("pointerup", tap);
    text.on("pointerup", tap);
  }

  private rematch(): void {
    go(this, "Fight", { arcade: arcadeRematchLast(this.arcade) });
  }

  private toSelect(): void {
    go(this, "Select", { mode: "arcade" });
  }

  private async submit(): Promise<void> {
    const name = await promptName(this.score);
    if (name === null) return;
    submitScore(name, this.score);
    go(this, "Leaderboard");
  }
}
