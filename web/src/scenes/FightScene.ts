import Phaser from "phaser";
import { COUNTDOWN_BEAT_MS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD, GOLD_NUM, GROUND_Y, ROUNDS_TO_WIN } from "../config";
import { dummyOpponent, fighterById, stageById, stageCaption, type FighterDef, type StageDef } from "../data/catalog";
import {
  arcadeCurrentBoss,
  arcadeNext,
  arcadeOpponent,
  arcadePlayer,
  arcadeStageId,
  type ArcadeProgress,
} from "../game/arcade";
import { layerDrift, startStageAmbient } from "../game/ambient";
import { playFightLoop } from "../game/audio";
import { VirtualControls } from "../game/controls";
import { difficultyForFight, type Difficulty } from "../game/difficulty";
import { Fighter, ultimateDamage } from "../game/fighter";
import { hideMatchOverlay, showMatchOverlay } from "../game/matchOverlay";
import { deferSceneChange, go } from "../game/nav";
import { applyQueryUnlocks, debugHeavyHits, submitScore, unlockBoss } from "../game/storage";
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
  private difficulty!: Difficulty;

  private player!: Fighter;
  private cpu!: Fighter;
  private pad!: VirtualControls;
  private playerBar!: HealthBar;
  private cpuBar!: HealthBar;
  private roundLabel!: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;
  private ultBanner?: Phaser.GameObjects.Text;
  private countdownLabel?: Phaser.GameObjects.Text;

  private roundOver = false;
  private matchOver = false;
  private controlsLive = false;
  private playerRounds = 0;
  private cpuRounds = 0;
  private roundNumber = 1;
  private cpuCooldown = 0.6;
  private cameraX = 0;
  private layers: Partial<Record<"sky" | "far" | "mid" | "master" | "near", Phaser.GameObjects.Image>> = {};
  private built = false;
  private overlayBusy = false;
  private arcadeAdvanceTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("Fight");
  }

  init(data: FightData): void {
    applyQueryUnlocks();
    this.input.enabled = true;
    this.overlayBusy = false;
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
    this.difficulty = difficultyForFight(this.arcade, this.opponentFighter.id);
    this.roundOver = false;
    this.matchOver = false;
    this.controlsLive = false;
    this.playerRounds = 0;
    this.cpuRounds = 0;
    this.roundNumber = 1;
    this.cpuCooldown = this.difficulty.attackCooldown;
    this.cameraX = 0;
    this.built = false;
    this.layers = {};
    this.overlay = undefined;
    this.countdownLabel = undefined;
    this.overlayBusy = false;
    this.arcadeAdvanceTimer?.remove(false);
    this.arcadeAdvanceTimer = undefined;
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
    this.scene.stop("Title");
    this.scene.stop("Select");
    playFightLoop(this);
    this.buildStage();
    this.player = new Fighter(this, this.playerFighter, true, DESIGN_WIDTH * 0.28, GROUND_Y);
    this.cpu = new Fighter(this, this.opponentFighter, false, DESIGN_WIDTH * 0.72, GROUND_Y);
    this.applyDifficulty();
    this.player.resetRound(DESIGN_WIDTH * 0.28, GROUND_Y, true);
    this.cpu.resetRound(DESIGN_WIDTH * 0.72, GROUND_Y, false);

    this.playerBar = new HealthBar(this, this.playerFighter, 48, 64, 400, true);
    const cpuTitle =
      this.arcade && arcadeCurrentBoss(this.arcade)
        ? this.opponentFighter.displayName
        : `CPU · ${this.opponentFighter.displayName}`;
    this.cpuBar = new HealthBar(this, this.opponentFighter, DESIGN_WIDTH - 48 - 400, 64, 400, false, cpuTitle);

    this.roundLabel = this.add
      .text(DESIGN_WIDTH / 2, 48, this.roundHudText(), {
        fontFamily: FONT,
        fontSize: "16px",
        color: GOLD,
        fontStyle: "bold",
        stroke: "#1a0a08",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(60);

    this.pad = new VirtualControls(this);
    this.pad.onJump = () => {
      if (this.controlsLive) this.player.jump();
    };
    this.pad.onPunch = () => {
      if (this.controlsLive) this.player.startAttack("punch");
    };
    this.pad.onKick = () => {
      if (this.controlsLive) this.player.startAttack(this.pad.downHeld && this.player.onGround ? "sweep" : "kick");
    };
    this.pad.onUltimate = () => {
      if (this.controlsLive) this.tryUltimate(this.player, this.cpu);
    };
    this.pad.setEnabled(false);
    this.startRoundIntro();
    if (debugHeavyHits()) {
      (window as unknown as { __dojoFight?: FightScene }).__dojoFight = this;
    }
  }

  private applyDifficulty(): void {
    this.cpu.incomingMul = this.difficulty.cpuDamageTaken;
    this.player.incomingMul = this.difficulty.cpuDamageDealt;
  }

  private buildStage(): void {
    const p = this.stage.assetPrefix;
    const names = { sky: `${p}_sky`, far: `${p}_far`, mid: `${p}_mid`, master: `${p}_master`, near: `${p}_near` };
    const hasBg = (["sky", "far", "mid"] as const).some((k) => this.has(names[k]));
    const hasFloor = this.has(names.near) || this.has(names.master);
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

    if (hasBg) {
      add("sky", -50, false);
      add("far", -40, false);
      add("mid", -25, false);
      // Floor / foreground stays locked. Prefer the near plate; use master only if near is missing.
      if (this.has(names.near)) add("near", 8, false);
      else add("master", -15, this.has(names.master));
    } else {
      add("master", -20, true);
    }
    if (!hasFloor && !hasBg) {
      this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x8c5238).setDepth(-20);
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

    startStageAmbient(this, this.stage, this.layers);
  }

  update(_t: number, delta: number): void {
    if (!this.built) return;
    const dt = Math.min(delta / 1000, 1 / 20);
    this.updateParallax();
    if (this.matchOver) return;

    if (this.controlsLive && !this.roundOver && this.pad) {
      this.pad.pollKeyboard();
      this.player.setCrouch(this.pad.downHeld);
      this.player.setWalk(this.pad.leftHeld, this.pad.rightHeld);
      this.updateCPU(dt);
    } else {
      this.player.setWalk(false, false);
      this.cpu.setWalk(false, false);
    }

    const minX = 70;
    const maxX = DESIGN_WIDTH - 70;
    this.player.update(dt, GROUND_Y, minX, maxX);
    this.cpu.update(dt, GROUND_Y, minX, maxX);
    this.player.faceToward(this.cpu.x);
    this.cpu.faceToward(this.player.x);

    if (this.controlsLive && !this.roundOver) {
      this.resolveHits();
    }

    this.playerBar.set(this.player.hp, this.player.maxHP);
    this.playerBar.setMeter(this.player.ultimateMeter);
    this.cpuBar.set(this.cpu.hp, this.cpu.maxHP);
    this.cpuBar.setMeter(this.cpu.ultimateMeter);
    this.pad?.setUltimateReady(this.controlsLive && this.player.isMeterFull && !this.player.isUltimate && !this.roundOver);

    if (this.controlsLive && !this.roundOver && (this.player.hp <= 0 || this.cpu.hp <= 0)) {
      this.finishRound(this.cpu.hp <= 0 && this.player.hp > 0);
    }
  }

  private updateCPU(dt: number): void {
    this.cpuCooldown -= dt;
    const gap = this.cpu.x - this.player.x;
    const distance = Math.abs(gap);
    const dummy = Boolean(this.arcade && this.arcade.step === null);
    const d = this.difficulty;

    if (this.player.isAttacking && distance < 160 && !this.cpu.isBlocking && this.cpu.onGround && Math.random() < d.blockRate) {
      this.cpu.startBlock(0.36 + d.blockRate * 0.2);
      this.cpuCooldown = 0.2;
      return;
    }

    if (this.cpu.isMeterFull && distance < 220 && this.cpuCooldown <= 0 && this.cpu.onGround && Math.random() < d.ultAggressiveness) {
      this.cpu.setWalk(false, false);
      this.tryUltimate(this.cpu, this.player);
      this.cpuCooldown = dummy ? 1.6 : 0.55 + d.attackCooldown;
    } else if (distance > d.approachDistance) {
      this.cpu.setWalk(gap > 0, gap < 0);
    } else {
      this.cpu.setWalk(false, false);
      if (this.cpuCooldown <= 0 && this.cpu.onGround) {
        if (dummy && Math.random() < 0.62) {
          this.cpuCooldown = 0.45;
        } else {
          this.cpu.startAttack(distance < 90 ? "punch" : Math.random() < 0.4 ? "sweep" : "kick");
          this.cpuCooldown = d.attackCooldown + Math.floor(Math.random() * 21) / 100;
        }
      }
    }
    if (this.cpuCooldown < -0.4 && Math.random() < d.jumpChance * 0.02) {
      this.cpu.jump();
    }
  }

  private resolveHits(): void {
    this.resolveUltimate(this.player, this.cpu);
    this.resolveUltimate(this.cpu, this.player);
    const pBox = this.player.attackHitbox();
    if (pBox && Phaser.Geom.Intersects.RectangleToRectangle(this.cpu.hurtbox(), pBox)) {
      const debugMul = debugHeavyHits() ? 8 : 1;
      this.cpu.applyHit(this.player.attackDamage() * debugMul, this.player.x);
      this.player.markConnected();
    }
    const cBox = this.cpu.attackHitbox();
    if (cBox && Phaser.Geom.Intersects.RectangleToRectangle(this.player.hurtbox(), cBox)) {
      this.player.applyHit(this.cpu.attackDamage(), this.cpu.x);
      this.cpu.markConnected();
    }
  }

  private resolveUltimate(attacker: Fighter, defender: Fighter): void {
    if (!attacker.ultimateShouldConnect) return;
    const reach = Math.abs(attacker.x - defender.x) < 220 * (attacker.bodyHeight / 210);
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

  /**
   * Background plates track the fighters. Master / near (the fight floor) stay pinned
   * so the ground never slides under their feet.
   */
  private updateParallax(): void {
    const midX = (this.player.x + this.cpu.x) * 0.5;
    this.cameraX += (midX - DESIGN_WIDTH * 0.5 - this.cameraX) * 0.08;
    const c = this.cameraX;
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    const place = (img: Phaser.GameObjects.Image | undefined, factor: number, locked: boolean) => {
      if (!img) return;
      const d = layerDrift(img);
      img.x = cx - (locked ? 0 : c * factor) + d.x;
      img.y = cy + d.y;
    };
    place(this.layers.sky, 0.1, false);
    place(this.layers.far, 0.2, false);
    place(this.layers.mid, 0.32, false);
    place(this.layers.master, 0, true);
    place(this.layers.near, 0, true);
  }

  private roundHudText(): string {
    return `ROUND ${this.roundNumber}  ·  ${this.playerRounds} – ${this.cpuRounds}  ·  BEST OF 3`;
  }

  private startRoundIntro(): void {
    this.controlsLive = false;
    this.roundOver = false;
    this.pad.setEnabled(false);
    this.pad.reset();
    this.roundLabel.setText(this.roundHudText());
    const beats: { text: string; size: string; color: string; hold: number }[] = [
      { text: `ROUND ${this.roundNumber}`, size: "64px", color: GOLD, hold: COUNTDOWN_BEAT_MS },
      { text: "3", size: "140px", color: "#fff6d8", hold: COUNTDOWN_BEAT_MS },
      { text: "2", size: "140px", color: "#fff6d8", hold: COUNTDOWN_BEAT_MS },
      { text: "1", size: "140px", color: "#fff6d8", hold: COUNTDOWN_BEAT_MS },
      { text: "FIGHT!", size: "96px", color: GOLD, hold: 420 },
    ];
    const play = (i: number) => {
      if (!this.scene.isActive()) return;
      const beat = beats[i];
      this.countdownLabel?.destroy();
      const label = this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.42, beat.text, {
          fontFamily: FONT,
          fontSize: beat.size,
          color: beat.color,
          fontStyle: "bold",
          stroke: "#14080a",
          strokeThickness: 12,
          shadow: { offsetX: 0, offsetY: 6, color: "#00000088", blur: 8, fill: true },
        })
        .setOrigin(0.5)
        .setDepth(90)
        .setScale(0.35)
        .setAlpha(0);
      this.countdownLabel = label;
      this.tweens.add({
        targets: label,
        scale: 1.12,
        alpha: 1,
        duration: 140,
        ease: "Back.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: label,
            scale: 1.28,
            alpha: 0,
            delay: Math.max(40, beat.hold - 180),
            duration: 160,
            onComplete: () => {
              label.destroy();
              if (this.countdownLabel === label) this.countdownLabel = undefined;
              if (i + 1 < beats.length) play(i + 1);
              else this.enableFighting();
            },
          });
        },
      });
    };
    play(0);
  }

  private enableFighting(): void {
    this.controlsLive = true;
    this.roundOver = false;
    this.pad.setEnabled(true);
    this.cpuCooldown = this.difficulty.attackCooldown * 0.7;
  }

  private fightScore(): number {
    const sweep = this.playerRounds === ROUNDS_TO_WIN && this.cpuRounds === 0 ? 50 : 0;
    return Math.floor(Math.max(this.player.hp, 0)) * 10 + sweep;
  }

  private finishRound(playerWon: boolean): void {
    this.roundOver = true;
    this.controlsLive = false;
    this.pad.setEnabled(false);
    this.pad.reset();
    this.playerBar.set(this.player.hp, this.player.maxHP);
    this.cpuBar.set(this.cpu.hp, this.cpu.maxHP);

    if (playerWon) this.playerRounds += 1;
    else this.cpuRounds += 1;
    this.playerBar.setRounds(this.playerRounds);
    this.cpuBar.setRounds(this.cpuRounds);
    this.roundLabel.setText(this.roundHudText());

    const matchDone = this.playerRounds >= ROUNDS_TO_WIN || this.cpuRounds >= ROUNDS_TO_WIN;
    const banner = matchDone
      ? playerWon
        ? "YOU WIN"
        : "YOU LOSE"
      : playerWon
        ? "ROUND WIN"
        : "ROUND LOSE";
    this.flashCenter(banner, playerWon ? GOLD : "#ff5947", matchDone ? 52 : 44);

    if (matchDone) {
      this.time.delayedCall(900, () => this.endMatch(playerWon));
    } else {
      this.time.delayedCall(1100, () => this.beginNextRound());
    }
  }

  private flashCenter(text: string, color: string, size: number): void {
    const label = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.4, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        color,
        fontStyle: "bold",
        stroke: "#100808",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(88)
      .setScale(0.7);
    this.tweens.add({
      targets: label,
      scale: 1.08,
      duration: 180,
      onComplete: () => {
        this.tweens.add({
          targets: label,
          alpha: 0,
          delay: 620,
          duration: 220,
          onComplete: () => label.destroy(),
        });
      },
    });
  }

  private beginNextRound(): void {
    if (this.matchOver) return;
    this.roundNumber += 1;
    this.player.resetRound(DESIGN_WIDTH * 0.28, GROUND_Y, true, { preserveMeter: true });
    this.cpu.resetRound(DESIGN_WIDTH * 0.72, GROUND_Y, false, { preserveMeter: true });
    this.applyDifficulty();
    this.playerBar.set(this.player.hp, this.player.maxHP);
    this.cpuBar.set(this.cpu.hp, this.cpu.maxHP);
    this.startRoundIntro();
  }

  private endMatch(playerWon: boolean): void {
    this.matchOver = true;
    this.controlsLive = false;
    this.overlayBusy = false;
    this.pad.detach();
    this.input.enabled = true;
    this.input.setTopOnly(true);
    applyQueryUnlocks();

    const boss = this.arcade ? arcadeCurrentBoss(this.arcade) : null;
    if (playerWon && boss) unlockBoss(boss.id);

    const panel = this.add.container(0, 0).setDepth(240);
    const dimmer = this.add
      .rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.58)
      .setInteractive({ useHandCursor: false });
    dimmer.setDepth(240);
    panel.add(dimmer);
    panel.add(
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.24, playerWon ? "YOU WIN" : "YOU LOSE", textStyle(52, playerWon ? GOLD : "#ff5947"))
        .setOrigin(0.5),
    );
    panel.add(
      this.add
        .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.34, `${this.playerRounds}  –  ${this.cpuRounds}`, textStyle(28, GOLD))
        .setOrigin(0.5),
    );

    const next = this.arcade ? arcadeNext(this.arcade) : null;
    const canAdvance = Boolean(playerWon && this.arcade && next);
    if (canAdvance) {
      dimmer.on("pointerup", () => this.advanceArcade());
    }
    if (playerWon && boss) {
      panel.add(
        this.add
          .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.42, `UNLOCKED  ${boss.displayName.toUpperCase()}`, textStyle(18, "#b3ffb3"))
          .setOrigin(0.5),
      );
    }

    if (playerWon && this.arcade && next) {
      panel.add(
        this.add
          .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.5, `NEXT:  ${arcadeOpponent(next).displayName.toUpperCase()}`, textStyle(22))
          .setOrigin(0.5),
      );
      this.showEndActions(
        panel,
        [
          { label: "NEXT FIGHT", onClick: () => this.advanceArcade(), primary: true },
          { label: "REMATCH", onClick: () => this.rematch() },
          { label: "CHARACTER SELECT", onClick: () => this.toSelect() },
        ],
        () => this.advanceArcade(),
      );
      // Native SpriteKit auto-continues after 1.35s. That timer runs on the
      // game clock — not inside a touch/click — so iPad Safari cannot drop it.
      this.arcadeAdvanceTimer?.remove(false);
      this.arcadeAdvanceTimer = this.time.delayedCall(1350, () => this.advanceArcade());
    } else if (playerWon && this.arcade && !next) {
      panel.add(this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.48, "ARCADE COMPLETE", textStyle(22, GOLD)).setOrigin(0.5));
      this.showEndActions(panel, [
        { label: "SUBMIT SCORE", onClick: () => void this.submit(), primary: true },
        { label: "REMATCH", onClick: () => this.rematch() },
        { label: "CHARACTER SELECT", onClick: () => this.toSelect() },
      ]);
    } else if (playerWon) {
      panel.add(this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.46, `SCORE  ${this.fightScore()}`, textStyle(22)).setOrigin(0.5));
      this.showEndActions(panel, [
        { label: "SUBMIT SCORE", onClick: () => void this.submit(), primary: true },
        { label: "REMATCH", onClick: () => this.rematch() },
        { label: "CHARACTER SELECT", onClick: () => this.toSelect() },
      ]);
    } else {
      this.showEndActions(panel, [
        { label: "REMATCH", onClick: () => this.rematch(), primary: true },
        { label: "CHARACTER SELECT", onClick: () => this.toSelect() },
      ]);
    }
    this.overlay = panel;
  }

  private bindOverlayConfirm(onConfirm: () => void): void {
    const fire = () => onConfirm();
    this.input.keyboard?.once("keydown-ENTER", fire);
    this.input.keyboard?.once("keydown-SPACE", fire);
    this.input.keyboard?.once("keydown-N", fire);
  }

  private showEndActions(
    panel: Phaser.GameObjects.Container,
    actions: { label: string; onClick: () => void; primary?: boolean }[],
    onConfirm?: () => void,
  ): void {
    const shown = showMatchOverlay(actions, {
      canvas: this.game.canvas,
      onBackdrop: onConfirm,
    });
    if (!shown) {
      const startY = onConfirm ? 0.62 : 0.52;
      actions.forEach((action, i) => {
        this.addOverlayButton(panel, action.label, DESIGN_HEIGHT * (startY + i * 0.11), action.onClick, Boolean(action.primary));
      });
    }
    if (onConfirm) this.bindOverlayConfirm(onConfirm);
  }

  private addOverlayButton(
    panel: Phaser.GameObjects.Container,
    title: string,
    y: number,
    onClick: () => void,
    primary = false,
  ): void {
    const bg = this.add
      .rectangle(DESIGN_WIDTH / 2, y, primary ? 420 : 360, primary ? 64 : 52, 0x1f1f1f, 0.95)
      .setStrokeStyle(primary ? 3 : 2, GOLD_NUM);
    const label = this.add.text(DESIGN_WIDTH / 2, y, title, textStyle(primary ? 24 : 20)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });
    bg.on("pointerup", onClick);
    label.on("pointerup", onClick);
    panel.add([bg, label]);
  }

  private onceOverlay(fn: () => void): void {
    if (this.overlayBusy) return;
    this.overlayBusy = true;
    this.arcadeAdvanceTimer?.remove(false);
    this.arcadeAdvanceTimer = undefined;
    this.input.enabled = false;
    hideMatchOverlay();
    fn();
  }

  private rematch(): void {
    this.onceOverlay(() => {
      if (this.arcade) this.restartFight({ arcade: this.arcade });
      else {
        this.restartFight({
          playerId: this.playerFighter.id,
          opponentId: this.opponentFighter.id,
          stageId: this.stage.id,
        });
      }
    });
  }

  private advanceArcade(): void {
    this.onceOverlay(() => {
      if (!this.arcade) return;
      applyQueryUnlocks();
      const next = arcadeNext(this.arcade);
      if (!next) return;
      this.restartFight({ arcade: next });
    });
  }

  private restartFight(data: FightData): void {
    applyQueryUnlocks();
    hideMatchOverlay();
    this.input.enabled = false;
    const payload = data;
    deferSceneChange(this, () => {
      if (!this.sys.game?.isRunning) return;
      applyQueryUnlocks();
      this.scene.restart(payload);
    });
  }

  private toSelect(): void {
    this.onceOverlay(() => go(this, "Select", { mode: this.arcade ? "arcade" : "freePlay" }));
  }

  private async submit(): Promise<void> {
    const score = this.fightScore();
    const name = await promptName(score);
    if (name === null) return;
    submitScore(name, score);
    go(this, "Leaderboard");
  }

  shutdown(): void {
    this.arcadeAdvanceTimer?.remove(false);
    this.arcadeAdvanceTimer = undefined;
    hideMatchOverlay();
    this.pad?.detach();
    this.overlay?.destroy(true);
    this.overlay = undefined;
    this.input.enabled = false;
    const debug = window as unknown as { __dojoFight?: FightScene };
    if (debug.__dojoFight === this) delete debug.__dojoFight;
  }
}

class HealthBar {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly meter: Phaser.GameObjects.Rectangle;
  private readonly pips: Phaser.GameObjects.Arc[] = [];
  private readonly width: number;
  private readonly alignLeft: boolean;

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
    const root = scene.add.container(x, y).setDepth(60);
    const plate = scene.add.rectangle(0, 8, width + 10, 56, 0x000000, 0.62).setOrigin(0, 0.5);
    plate.setStrokeStyle(2, GOLD_NUM, 0.85);
    const hpBack = scene.add.rectangle(5, 0, width, 20, 0x2a1212, 1).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(5, 0, width, 20, 0x40cc52, 1).setOrigin(this.alignLeft ? 0 : 1, 0.5);
    if (!this.alignLeft) this.fill.setPosition(5 + width, 0);
    const meterBack = scene.add.rectangle(5, 20, width, 12, 0x1a1030, 1).setOrigin(0, 0.5);
    this.meter = scene.add.rectangle(5, 20, 6, 12, 0x8c66f2, 1).setOrigin(this.alignLeft ? 0 : 1, 0.5);
    if (!this.alignLeft) this.meter.setPosition(5 + width, 20);
    const name = scene.add
      .text(8, -22, (title ?? fighter.displayName).toUpperCase(), textStyle(14, "#ffffff"))
      .setOrigin(this.alignLeft ? 0 : 1, 0.5);
    if (!this.alignLeft) name.setX(width + 2);
    const ult = scene.add.text(8, 34, "ULT", textStyle(12, "#c4b4ff")).setOrigin(this.alignLeft ? 0 : 1, 0.5);
    if (!this.alignLeft) ult.setX(width + 2);
    root.add([plate, hpBack, this.fill, meterBack, this.meter, name, ult]);
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      const px = this.alignLeft ? width - 10 - i * 20 : 14 + i * 20;
      const pip = scene.add.circle(px, 34, 6, 0x2a2a2a).setStrokeStyle(2, GOLD_NUM, 0.9);
      this.pips.push(pip);
      root.add(pip);
    }
    if (scene.textures.exists(fighter.portrait)) {
      const portrait = scene.add.image(this.alignLeft ? -22 : width + 32, 4, fighter.portrait);
      portrait.setDisplaySize(44, 44);
      root.add(portrait);
    }
  }

  set(hp: number, maxHP: number): void {
    const t = Phaser.Math.Clamp(hp / maxHP, 0, 1);
    this.fill.setSize(Math.max(2, this.width * t), 20);
    this.fill.setFillStyle(t > 0.35 ? 0x40cc52 : 0xd92e29);
  }

  setMeter(t: number): void {
    const clamped = Phaser.Math.Clamp(t, 0, 1);
    this.meter.setSize(Math.max(clamped > 0 ? 6 : 0, this.width * clamped), 12);
    this.meter.setFillStyle(clamped >= 1 ? GOLD_NUM : 0x8c66f2);
  }

  setRounds(won: number): void {
    this.pips.forEach((pip, i) => pip.setFillStyle(i < won ? GOLD_NUM : 0x2a2a2a));
  }
}
