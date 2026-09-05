import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD, GOLD_NUM, GROUND_Y } from "../config";
import { dummyOpponent, fighterById, stageById, stageCaption, type FighterDef, type StageDef } from "../data/catalog";
import {
  arcadeCurrentBoss,
  arcadeNext,
  arcadeOpponent,
  arcadePlayer,
  arcadeStageId,
  type ArcadeProgress,
} from "../game/arcade";
import { VirtualControls } from "../game/controls";
import { Fighter, ultimateDamage } from "../game/fighter";
import { submitScore, unlockBoss } from "../game/storage";
import { promptName, textStyle } from "../game/ui";

export interface FightData {
  arcade?: ArcadeProgress;
  playerId?: string;
  opponentId?: string;
  stageId?: string;
}

export class FightScene extends Phaser.Scene {
  private playerFighter!: FighterDef;
  private opponentFighter!: FighterDef;
  private stage!: StageDef;
  private arcade: ArcadeProgress | null = null;

  private player!: Fighter;
  private cpu!: Fighter;
  private pad!: VirtualControls;
  private playerBar!: HealthBar;
  private cpuBar!: HealthBar;
  private overlay?: Phaser.GameObjects.Container;
  private ultBanner?: Phaser.GameObjects.Text;
  private roundOver = false;
  private cpuCooldown = 0.6;
  private cameraX = 0;
  private layers: Partial<Record<"sky" | "far" | "mid" | "master" | "near", Phaser.GameObjects.Image>> = {};
  private built = false;

  constructor() {
    super("Fight");
  }

  init(data: FightData): void {
    this.arcade = data.arcade ?? null;
    if (this.arcade) {
      this.playerFighter = arcadePlayer(this.arcade);
      this.opponentFighter = arcadeOpponent(this.arcade);
      this.stage = stageById(arcadeStageId(this.arcade));
    } else {
      this.playerFighter = fighterById(data.playerId ?? "matt");
      this.opponentFighter = data.opponentId ? fighterById(data.opponentId) : dummyOpponent(this.playerFighter);
      this.stage = stageById(data.stageId ?? this.opponentFighter.stageId);
    }
    this.roundOver = false;
    this.cpuCooldown = 0.6;
    this.cameraX = 0;
    this.built = false;
    this.layers = {};
    this.overlay = undefined;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x733848);
    const needed = this.stageKeys();
    const missing = needed.filter((k) => !this.textures.exists(k));
    if (missing.length) {
      const label = this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, "Loading stage…", textStyle(24, GOLD))
        .setOrigin(0.5);
      for (const key of missing) this.load.image(key, `assets/${key}.png`);
      this.load.once("complete", () => {
        label.destroy();
        this.buildFight();
      });
      this.load.start();
    } else {
      this.buildFight();
    }
  }

  private stageKeys(): string[] {
    const p = this.stage.assetPrefix;
    return [`${p}_sky`, `${p}_far`, `${p}_mid`, `${p}_master`, `${p}_near`];
  }

  private has(key: string): boolean {
    return this.textures.exists(key) && this.textures.get(key).getSourceImage().width > 1;
  }

  private buildFight(): void {
    if (this.built) return;
    this.built = true;
    this.buildStage();
    this.player = new Fighter(this, this.playerFighter, true, DESIGN_WIDTH * 0.28, GROUND_Y);
    this.cpu = new Fighter(this, this.opponentFighter, false, DESIGN_WIDTH * 0.72, GROUND_Y);
    this.player.resetRound(DESIGN_WIDTH * 0.28, GROUND_Y, true);
    this.cpu.resetRound(DESIGN_WIDTH * 0.72, GROUND_Y, false);

    this.playerBar = new HealthBar(this, this.playerFighter, 36, 52, 420, true);
    const cpuTitle =
      this.arcade && arcadeCurrentBoss(this.arcade)
        ? this.opponentFighter.displayName
        : `CPU · ${this.opponentFighter.displayName}`;
    this.cpuBar = new HealthBar(this, this.opponentFighter, DESIGN_WIDTH - 36 - 420, 52, 420, false, cpuTitle);

    this.pad = new VirtualControls(this);
    this.pad.onJump = () => this.player.jump();
    this.pad.onPunch = () => this.player.startAttack("punch");
    this.pad.onKick = () => this.player.startAttack("kick");
    this.pad.onUltimate = () => this.tryUltimate(this.player, this.cpu);
  }

  private buildStage(): void {
    const p = this.stage.assetPrefix;
    const names = { sky: `${p}_sky`, far: `${p}_far`, mid: `${p}_mid`, master: `${p}_master`, near: `${p}_near` };
    const hasParallax = (["sky", "far", "mid", "near"] as const).some((k) => this.has(names[k]));
    const add = (key: keyof typeof names, z: number, required: boolean) => {
      const asset = names[key];
      if (!required && !this.has(asset)) return;
      if (!this.has(asset)) {
        const fallback = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x8c5238);
        fallback.setDepth(z);
        return;
      }
      const img = this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, asset);
      img.setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT);
      img.setDepth(z);
      this.layers[key] = img;
    };
    if (hasParallax) {
      add("sky", -50, false);
      add("far", -40, false);
      add("mid", -25, false);
      add("master", -15, this.has(names.master));
      add("near", 8, false);
    } else {
      add("master", -20, true);
    }
    this.add
      .text(DESIGN_WIDTH / 2, 22, stageCaption(this.stage), {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#ffffffb3",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(40);
  }

  update(_t: number, delta: number): void {
    if (!this.built || this.roundOver) return;
    const dt = Math.min(delta / 1000, 1 / 20);
    this.pad.pollKeyboard();
    this.player.setWalk(this.pad.leftHeld, this.pad.rightHeld);
    this.updateCPU(dt);

    const minX = 70;
    const maxX = DESIGN_WIDTH - 70;
    this.player.update(dt, GROUND_Y, minX, maxX);
    this.cpu.update(dt, GROUND_Y, minX, maxX);
    this.player.faceToward(this.cpu.x);
    this.cpu.faceToward(this.player.x);
    this.resolveHits();
    this.playerBar.set(this.player.hp, this.player.maxHP);
    this.playerBar.setMeter(this.player.ultimateMeter);
    this.cpuBar.set(this.cpu.hp, this.cpu.maxHP);
    this.cpuBar.setMeter(this.cpu.ultimateMeter);
    this.pad.setUltimateReady(this.player.isMeterFull && !this.player.isUltimate && !this.roundOver);
    this.updateParallax();

    if (this.player.hp <= 0 || this.cpu.hp <= 0) {
      this.endRound(this.cpu.hp <= 0 && this.player.hp > 0);
    }
  }

  private updateCPU(dt: number): void {
    this.cpuCooldown -= dt;
    const gap = this.cpu.x - this.player.x;
    const distance = Math.abs(gap);
    const dummy = Boolean(this.arcade && this.arcade.step === null);
    if (this.cpu.isMeterFull && distance < 220 && this.cpuCooldown <= 0 && this.cpu.onGround) {
      this.cpu.setWalk(false, false);
      this.tryUltimate(this.cpu, this.player);
      this.cpuCooldown = dummy ? 1.6 : 1.1;
    } else if (distance > (dummy ? 120 : 95)) {
      this.cpu.setWalk(gap > 0, gap < 0);
    } else {
      this.cpu.setWalk(false, false);
      if (this.cpuCooldown <= 0 && this.cpu.onGround) {
        if (dummy && Math.random() < 0.4) {
          this.cpuCooldown = 0.45;
        } else {
          this.cpu.startAttack(distance < 70 ? "punch" : "kick");
          this.cpuCooldown = (dummy ? 1.05 : 0.7) + Math.floor(Math.random() * 21) / 100;
        }
      }
    }
    if (this.cpuCooldown < -1 && Math.floor(Math.random() * 121) === 0) {
      this.cpu.jump();
    }
  }

  private resolveHits(): void {
    this.resolveUltimate(this.player, this.cpu);
    this.resolveUltimate(this.cpu, this.player);
    const pBox = this.player.attackHitbox();
    if (pBox && Phaser.Geom.Intersects.RectangleToRectangle(this.cpu.hurtbox(), pBox)) {
      this.cpu.applyHit(this.player.activeAttack === "kick" ? 14 : 8, this.player.x);
      this.player.markConnected();
    }
    const cBox = this.cpu.attackHitbox();
    if (cBox && Phaser.Geom.Intersects.RectangleToRectangle(this.player.hurtbox(), cBox)) {
      this.player.applyHit(this.cpu.activeAttack === "kick" ? 14 : 8, this.cpu.x);
      this.cpu.markConnected();
    }
  }

  private resolveUltimate(attacker: Fighter, defender: Fighter): void {
    if (!attacker.ultimateShouldConnect) return;
    const reach = Math.abs(attacker.x - defender.x) < 220;
    const flavor = attacker.fighter.ultimate.flavor;
    if (!reach && flavor !== "figure4" && flavor !== "teleport") return;
    defender.applyHit(ultimateDamage(defender), attacker.x);
    attacker.markUltimateConnected();
  }

  private tryUltimate(attacker: Fighter, defender: Fighter): void {
    if (!attacker.startUltimate(defender.x)) return;
    this.showUltimateBanner(attacker.fighter.ultimate.name);
  }

  private showUltimateBanner(name: string): void {
    this.ultBanner?.destroy();
    const label = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.38, name.toUpperCase(), textStyle(28, GOLD))
      .setOrigin(0.5)
      .setDepth(70)
      .setScale(0.9);
    this.ultBanner = label;
    this.tweens.add({
      targets: label,
      scale: 1.12,
      alpha: 1,
      duration: 120,
      onComplete: () => {
        this.tweens.add({
          targets: label,
          alpha: 0,
          delay: 700,
          duration: 200,
          onComplete: () => label.destroy(),
        });
      },
    });
  }

  private updateParallax(): void {
    const midX = (this.player.x + this.cpu.x) * 0.5;
    this.cameraX += (midX - DESIGN_WIDTH * 0.5 - this.cameraX) * 0.08;
    const c = this.cameraX;
    const cx = DESIGN_WIDTH / 2;
    if (this.layers.sky) this.layers.sky.x = cx - c * 0.08;
    if (this.layers.far) this.layers.far.x = cx - c * 0.18;
    if (this.layers.master) this.layers.master.x = cx - c * 0.32;
    if (this.layers.mid) this.layers.mid.x = cx - c * 0.42;
    if (this.layers.near) this.layers.near.x = cx - c * 0.7;
  }

  private fightScore(): number {
    return Math.floor(this.player.hp) * 10;
  }

  private endRound(playerWon: boolean): void {
    this.roundOver = true;
    this.pad.reset();
    this.pad.setVisible(true);
    this.playerBar.set(this.player.hp, this.player.maxHP);
    this.cpuBar.set(this.cpu.hp, this.cpu.maxHP);

    const boss = this.arcade ? arcadeCurrentBoss(this.arcade) : null;
    if (playerWon && boss) unlockBoss(boss.id);

    const panel = this.add.container(0, 0).setDepth(100);
    panel.add(this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.55));
    panel.add(
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.28, playerWon ? "YOU WIN" : "YOU LOSE", textStyle(52, playerWon ? GOLD : "#ff5947"))
        .setOrigin(0.5),
    );

    const next = this.arcade ? arcadeNext(this.arcade) : null;
    if (playerWon && boss) {
      panel.add(
        this.add
          .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.38, `UNLOCKED  ${boss.displayName.toUpperCase()}`, textStyle(18, "#b3ffb3"))
          .setOrigin(0.5),
      );
    }

    if (playerWon && this.arcade && next) {
      panel.add(
        this.add
          .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.46, `NEXT:  ${arcadeOpponent(next).displayName.toUpperCase()}`, textStyle(22))
          .setOrigin(0.5),
      );
      this.addOverlayButton(panel, "NEXT FIGHT", DESIGN_HEIGHT * 0.56, () => this.advanceArcade());
      this.addOverlayButton(panel, "REMATCH", DESIGN_HEIGHT * 0.66, () => this.rematch());
      this.addOverlayButton(panel, "CHARACTER SELECT", DESIGN_HEIGHT * 0.76, () => this.toSelect());
      this.time.delayedCall(1350, () => this.advanceArcade());
    } else if (playerWon && this.arcade && !next) {
      panel.add(this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.46, "ARCADE COMPLETE", textStyle(22, GOLD)).setOrigin(0.5));
      this.addOverlayButton(panel, "SUBMIT SCORE", DESIGN_HEIGHT * 0.56, () => void this.submit());
      this.addOverlayButton(panel, "REMATCH", DESIGN_HEIGHT * 0.66, () => this.rematch());
      this.addOverlayButton(panel, "CHARACTER SELECT", DESIGN_HEIGHT * 0.76, () => this.toSelect());
    } else if (playerWon) {
      panel.add(this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.44, `SCORE  ${this.fightScore()}`, textStyle(22)).setOrigin(0.5));
      this.addOverlayButton(panel, "SUBMIT SCORE", DESIGN_HEIGHT * 0.54, () => void this.submit());
      this.addOverlayButton(panel, "REMATCH", DESIGN_HEIGHT * 0.64, () => this.rematch());
      this.addOverlayButton(panel, "CHARACTER SELECT", DESIGN_HEIGHT * 0.74, () => this.toSelect());
    } else {
      this.addOverlayButton(panel, "REMATCH", DESIGN_HEIGHT * 0.5, () => this.rematch());
      this.addOverlayButton(panel, "CHARACTER SELECT", DESIGN_HEIGHT * 0.62, () => this.toSelect());
    }
    this.overlay = panel;
  }

  private addOverlayButton(panel: Phaser.GameObjects.Container, title: string, y: number, onClick: () => void): void {
    const bg = this.add.rectangle(DESIGN_WIDTH / 2, y, 360, 52, 0x1f1f1f, 0.95).setStrokeStyle(2, GOLD_NUM);
    const label = this.add.text(DESIGN_WIDTH / 2, y, title, textStyle(20)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerup", onClick);
    label.setInteractive({ useHandCursor: true });
    label.on("pointerup", onClick);
    panel.add([bg, label]);
  }

  private rematch(): void {
    if (this.arcade) this.scene.start("Fight", { arcade: this.arcade });
    else {
      this.scene.start("Fight", {
        playerId: this.playerFighter.id,
        opponentId: this.opponentFighter.id,
        stageId: this.stage.id,
      });
    }
  }

  private advanceArcade(): void {
    if (!this.arcade) return;
    const next = arcadeNext(this.arcade);
    if (!next) return;
    this.scene.start("Fight", { arcade: next });
  }

  private toSelect(): void {
    this.scene.start("Select", { mode: this.arcade ? "arcade" : "freePlay" });
  }

  private async submit(): Promise<void> {
    const score = this.fightScore();
    const name = await promptName(score);
    if (name === null) return;
    submitScore(name, score);
    this.scene.start("Leaderboard");
  }
}

class HealthBar {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly meter: Phaser.GameObjects.Rectangle;
  private readonly width: number;
  private readonly alignLeft: boolean;
  private readonly fillX: number;
  private readonly meterX: number;

  constructor(
    scene: Phaser.Scene,
    fighter: FighterDef,
    x: number,
    y: number,
    width: number,
    alignLeft: boolean,
    title?: string,
  ) {
    this.width = width;
    this.alignLeft = alignLeft;
    const back = scene.add.rectangle(x, y, width + 6, 28, 0x141414, 0.82).setOrigin(0, 0.5).setDepth(50);
    back.setStrokeStyle(1, 0xffffff, 0.2);
    this.fillX = alignLeft ? x + 3 : x + width - 3;
    this.fill = scene.add.rectangle(this.fillX, y, width, 22, fighter.accent).setOrigin(alignLeft ? 0 : 1, 0.5).setDepth(51);
    const meterBack = scene.add.rectangle(x + 3, y + 22, width, 12, 0x120818, 0.92).setOrigin(0, 0.5).setDepth(50);
    meterBack.setStrokeStyle(1, 0x8c66f2, 0.7);
    this.meterX = this.fillX;
    this.meter = scene.add.rectangle(this.meterX, y + 22, 4, 8, 0x8c66f2).setOrigin(alignLeft ? 0 : 1, 0.5).setDepth(51);
    scene.add
      .text(alignLeft ? x + 8 : x + width - 8, y + 36, "ULT", {
        fontFamily: FONT,
        fontSize: "11px",
        color: "#c4b4ff",
        fontStyle: "bold",
      })
      .setOrigin(alignLeft ? 0 : 1, 0)
      .setDepth(51);
    if (scene.textures.exists(fighter.portrait)) {
      const portrait = scene.add.image(alignLeft ? x - 20 : x + width + 20, y, fighter.portrait);
      portrait.setDisplaySize(36, 36);
      portrait.setDepth(51);
    }
    scene.add
      .text(alignLeft ? x + 8 : x + width - 8, y - 22, (title ?? fighter.displayName).toUpperCase(), textStyle(13))
      .setOrigin(alignLeft ? 0 : 1, 0.5)
      .setDepth(51);
  }

  set(hp: number, maxHP: number): void {
    const t = Phaser.Math.Clamp(hp / maxHP, 0, 1);
    this.fill.width = this.width * t;
    this.fill.setFillStyle(t > 0.35 ? 0x40cc52 : 0xd92e29);
  }

  setMeter(t: number): void {
    const clamped = Phaser.Math.Clamp(t, 0, 1);
    this.meter.width = this.width * clamped;
    this.meter.setFillStyle(clamped >= 1 ? GOLD_NUM : 0x8c66f2);
  }
}
