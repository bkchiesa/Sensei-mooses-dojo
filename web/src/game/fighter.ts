import Phaser from "phaser";
import { CHARGE_PER_HIT, FIGHTER_HEIGHT, MOOSE_HEIGHT_SCALE, ULT_DAMAGE_FRACTION } from "../config";
import type { FighterAnimName, FighterDef, UltimateFlavor, UltimateMove } from "../data/catalog";
import { animPackFor, hasDedicatedFrames } from "./anims";
import { playSfx } from "./audio";
import { readyUltFrames, splashDisplayHeight, ultDurationFor, ULT_SPLASH_FPS } from "./ultArt";

export type AttackKind = "punch" | "kick" | "sweep";

const ATTACK = {
  punch: { damage: 8, range: 78, duration: 0.28, activeStart: 0.07, activeEnd: 0.18 },
  kick: { damage: 14, range: 102, duration: 0.4, activeStart: 0.12, activeEnd: 0.26 },
  sweep: { damage: 12, range: 118, duration: 0.42, activeStart: 0.14, activeEnd: 0.3 },
} as const;

/** Grounded crouch+kick → sweep. Airborne punch/kick only (sweep remaps to kick). */
export function resolveAttackKind(kind: AttackKind, onGround: boolean, isCrouching: boolean): AttackKind {
  if (!onGround) return kind === "sweep" ? "kick" : kind;
  if (isCrouching && kind === "kick") return "sweep";
  return kind;
}

function isMooseId(id: string): boolean {
  return id === "senseiMoose" || id === "moose";
}

export class Fighter {
  readonly fighter: FighterDef;
  readonly isPlayer: boolean;
  readonly maxHP = 100;
  readonly bodyHeight: number;

  hp = 100;
  facing = 1;
  vx = 0;
  vy = 0;
  onGround = true;
  isAttacking = false;
  isHit = false;
  isKO = false;
  isUltimate = false;
  isBlocking = false;
  isCrouching = false;
  activeAttack: AttackKind | null = null;
  ultimateMeter = 0;
  /** Incoming damage scale (CPU tankiness / player fragility). */
  incomingMul = 1;

  readonly root: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Image;
  readonly strike: Phaser.GameObjects.Rectangle;

  private attackElapsed = 0;
  private hitElapsed = 0;
  private ultimateElapsed = 0;
  private didConnect = false;
  private ultimateDidConnect = false;
  private readonly scene: Phaser.Scene;
  private readonly idleKey: string;
  private ultTween: Phaser.Tweens.Tween | Phaser.Tweens.TweenChain | null = null;
  private splashKeys: string[] = [];
  private splashFrame = 0;
  private splashElapsed = 0;

  private readonly moveSpeed = 280;
  private readonly jumpVelocity: number;
  private readonly gravity = -2600;
  private currentAnim: FighterAnimName = "idle";
  private animFrame = 0;
  private animElapsed = 0;
  private blockElapsed = 0;
  private blockDuration = 0.38;

  constructor(scene: Phaser.Scene, fighter: FighterDef, isPlayer: boolean, x: number, y: number) {
    this.scene = scene;
    this.fighter = fighter;
    this.isPlayer = isPlayer;
    this.bodyHeight = isMooseId(fighter.id) ? Math.round(FIGHTER_HEIGHT * MOOSE_HEIGHT_SCALE) : FIGHTER_HEIGHT;
    this.jumpVelocity = 920 * Math.sqrt(this.bodyHeight / 210);
    this.idleKey = scene.textures.exists(fighter.idle) ? fighter.idle : this.fallbackKey();

    this.root = scene.add.container(x, y);
    this.body = scene.add.image(0, 0, this.idleKey);
    this.body.setOrigin(0.5, 1);
    this.fitBody();
    this.strike = scene.add.rectangle(36, -this.bodyHeight * 0.45, 28, 18, 0xffffff, 0);
    this.strike.setOrigin(0.5, 0.5);
    this.root.add([this.body, this.strike]);
    this.root.setDepth(10);
    this.playAnim("idle", true);
  }

  private fallbackKey(): string {
    if (this.scene.textures.exists("moose_title_idle")) return "moose_title_idle";
    return this.fighter.idle;
  }

  private fitBody(): void {
    if (this.body.height <= 0) return;
    this.body.setDisplaySize((this.body.width / this.body.height) * this.bodyHeight, this.bodyHeight);
  }

  private poseKey(anim: FighterAnimName, frame = 0): string | null {
    const frames = animPackFor(this.fighter.id).frames[anim];
    if (frames && frames[frame] && this.scene.textures.exists(frames[frame])) return frames[frame];
    if (anim === "idle" && this.scene.textures.exists(this.idleKey)) return this.idleKey;
    return null;
  }

  playAnim(anim: FighterAnimName, force = false): void {
    if (!force && this.currentAnim === anim) return;
    this.currentAnim = anim;
    this.animFrame = 0;
    this.animElapsed = 0;
    const key = this.poseKey(anim, 0) ?? this.idleKey;
    if (this.scene.textures.exists(key)) {
      this.body.setTexture(key);
      this.fitBody();
    }
  }

  get x(): number {
    return this.root.x;
  }
  set x(v: number) {
    this.root.x = v;
  }
  get y(): number {
    return this.root.y;
  }
  set y(v: number) {
    this.root.y = v;
  }

  get isMeterFull(): boolean {
    return this.ultimateMeter >= 1;
  }

  get ultimateDuration(): number {
    return ultDurationFor(this.splashKeys.length);
  }

  get ultimateShouldConnect(): boolean {
    if (!this.isUltimate || this.ultimateDidConnect) return false;
    const duration = this.ultimateDuration;
    return this.ultimateElapsed >= duration * 0.28 && this.ultimateElapsed <= duration * 0.65;
  }

  faceToward(otherX: number): void {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO) return;
    this.facing = otherX >= this.x ? 1 : -1;
    this.root.setScale(this.facing, 1);
  }

  setWalk(left: boolean, right: boolean): void {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO || this.isBlocking || this.isCrouching) {
      if (this.onGround) this.vx = 0;
      return;
    }
    if (left === right) {
      this.vx = 0;
    } else if (left) {
      this.vx = -this.moveSpeed;
      this.facing = -1;
      this.root.setScale(-1, 1);
    } else {
      this.vx = this.moveSpeed;
      this.facing = 1;
      this.root.setScale(1, 1);
    }
  }

  jump(): void {
    if (!this.onGround || this.isHit || this.isKO || this.isUltimate || this.isBlocking || this.isCrouching) return;
    this.vy = this.jumpVelocity;
    this.onGround = false;
    this.playAnim("jump");
    playSfx(this.scene, "jump");
  }

  startBlock(duration = 0.38): boolean {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO || !this.onGround) return false;
    this.isBlocking = true;
    this.isCrouching = false;
    this.blockElapsed = 0;
    this.blockDuration = duration;
    this.vx = 0;
    this.playAnim("block");
    if (!hasDedicatedFrames(this.fighter.id, "block")) {
      this.body.setScale(1, 0.92);
    }
    return true;
  }

  setCrouch(held: boolean): void {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO || this.isBlocking || !this.onGround) {
      if (!held) this.isCrouching = false;
      return;
    }
    if (held === this.isCrouching) {
      if (held) this.vx = 0;
      return;
    }
    this.isCrouching = held;
    this.vx = 0;
    this.playAnim(held ? "crouch" : "idle");
    if (held) playSfx(this.scene, "crouch");
  }

  startAttack(kind: AttackKind): boolean {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO || this.isBlocking) return false;
    kind = resolveAttackKind(kind, this.onGround, this.isCrouching);
    if (this.onGround) {
      if (kind !== "sweep") this.isCrouching = false;
      this.vx = 0;
    }
    this.isAttacking = true;
    this.activeAttack = kind;
    this.attackElapsed = 0;
    this.didConnect = false;
    this.playAnim(kind);
    playSfx(this.scene, kind === "punch" ? "punch_miss" : kind === "kick" ? "kick_miss" : "sweep");
    if (!hasDedicatedFrames(this.fighter.id, kind)) {
      const lift = kind === "punch" ? 8 : kind === "sweep" ? 14 : -4;
      this.scene.tweens.add({
        targets: this.body,
        x: 10,
        y: -lift,
        duration: ATTACK[kind].activeStart * 1000,
        yoyo: true,
        hold: (ATTACK[kind].activeEnd - ATTACK[kind].activeStart) * 1000,
      });
    }
    return true;
  }

  applyHit(damage: number, fromX: number, kind?: AttackKind | "ult"): void {
    if (this.isKO) return;
    let incoming = damage * this.incomingMul;
    if (this.isBlocking) {
      playSfx(this.scene, "block");
      incoming *= 0.28;
    } else if (kind === "punch") playSfx(this.scene, "punch_hit");
    else if (kind === "kick") playSfx(this.scene, "kick_hit");
    else if (kind === "sweep") playSfx(this.scene, "hit");
    else if (kind === "ult") playSfx(this.scene, "ult_impact");
    else playSfx(this.scene, "hit");
    this.hp = Math.max(0, this.hp - incoming);
    this.isBlocking = false;
    this.isCrouching = false;
    this.isHit = true;
    this.hitElapsed = 0;
    this.isAttacking = false;
    this.isUltimate = false;
    this.activeAttack = null;
    this.strike.setFillStyle(0xffffff, 0);
    this.stopUltTween();
    this.restoreIdlePose();
    const dir = this.x >= fromX ? 1 : -1;
    this.vx = 220 * dir;
    this.vy = 240;
    this.onGround = false;
    this.body.setTint(0xffffff);
    this.scene.tweens.add({
      targets: this.body,
      alpha: 0.55,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.body.clearTint();
        this.body.setAlpha(1);
      },
    });
    if (this.hp <= 0) {
      this.isKO = true;
      playSfx(this.scene, "ko");
      playSfx(this.scene, "vo_ko");
      this.scene.tweens.add({ targets: this.root, rotation: dir * 1.2, duration: 350 });
    }
  }

  attackHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.isAttacking || !this.activeAttack || this.didConnect) return null;
    const kind = ATTACK[this.activeAttack];
    if (this.attackElapsed < kind.activeStart || this.attackElapsed > kind.activeEnd) return null;
    const reach = this.bodyHeight / 210;
    const w = kind.range * reach;
    const h = (this.activeAttack === "sweep" ? 22 : this.activeAttack === "kick" ? 36 : 28) * reach;
    const originX = this.facing > 0 ? this.x + 10 : this.x - 10 - w;
    const yFactor = this.activeAttack === "sweep" ? 0.28 : 0.55;
    const originY = this.y - this.bodyHeight * yFactor;
    return new Phaser.Geom.Rectangle(originX, originY, w, h);
  }

  hurtbox(): Phaser.Geom.Rectangle {
    const w = 64 * (this.bodyHeight / 210);
    const crouched = this.isCrouching || this.activeAttack === "sweep";
    const hFactor = crouched ? 0.52 : 0.9;
    return new Phaser.Geom.Rectangle(this.x - w / 2, this.y - this.bodyHeight * hFactor, w, this.bodyHeight * hFactor);
  }

  attackDamage(): number {
    return this.activeAttack ? ATTACK[this.activeAttack].damage : 0;
  }

  markConnected(): void {
    this.didConnect = true;
    this.chargeMeter();
  }

  chargeMeter(): void {
    if (this.isKO) return;
    this.ultimateMeter = Math.min(1, this.ultimateMeter + CHARGE_PER_HIT);
  }

  startUltimate(towardX: number): boolean {
    if (!this.isMeterFull || this.isAttacking || this.isUltimate || this.isHit || this.isKO || !this.onGround) {
      return false;
    }
    this.ultimateMeter = 0;
    this.isUltimate = true;
    this.isBlocking = false;
    this.isCrouching = false;
    this.ultimateElapsed = 0;
    this.ultimateDidConnect = false;
    this.vx = 0;
    const close = Math.min(96, Math.abs(towardX - this.x) * 0.55) * (towardX >= this.x ? 1 : -1);
    this.playUltimateMotion(this.fighter.ultimate, close);
    playSfx(this.scene, "ult_activate");
    return true;
  }

  markUltimateConnected(): void {
    this.ultimateDidConnect = true;
  }

  private playUltimateMotion(move: UltimateMove, closeX: number): void {
    this.stopUltTween();
    this.splashKeys = readyUltFrames(this.scene, this.fighter.id);
    this.splashFrame = 0;
    this.splashElapsed = 0;

    if (this.splashKeys.length) {
      this.body.setTexture(this.splashKeys[0]);
      this.fitSplashBody();
      // Splash sheets already carry the motion — only ease toward the opponent.
      this.ultTween = this.scene.tweens.add({
        targets: this.body,
        x: closeX * 0.4,
        duration: this.ultimateDuration * 1000,
        ease: "Sine.easeOut",
      });
      return;
    }

    if (this.scene.textures.exists(move.frameName)) {
      this.body.setTexture(move.frameName);
      this.fitBody();
    } else {
      this.body.setTint(this.fighter.accent);
    }

    const f = this.facing;
    const chain = this.flavorChain(move.flavor, closeX, f);
    this.ultTween = this.scene.tweens.chain({
      targets: this.body,
      tweens: chain as Phaser.Types.Tweens.TweenBuilderConfig[],
      onComplete: () => this.finishUltimate(),
    });
  }

  private fitSplashBody(): void {
    if (this.body.height <= 0) return;
    const h = splashDisplayHeight(this.bodyHeight);
    this.body.setDisplaySize((this.body.width / this.body.height) * h, h);
  }

  private cycleSplashFrames(dt: number): void {
    if (this.splashKeys.length <= 1) return;
    this.splashElapsed += dt;
    const idx = Math.min(this.splashKeys.length - 1, Math.floor(this.splashElapsed * ULT_SPLASH_FPS));
    if (idx === this.splashFrame) return;
    this.splashFrame = idx;
    const key = this.splashKeys[idx];
    if (this.scene.textures.exists(key)) {
      this.body.setTexture(key);
      this.fitSplashBody();
    }
  }

  private flavorChain(flavor: UltimateFlavor, closeX: number, f: number): object[] {
    const b = this.body;
    switch (flavor) {
      case "tornadoKick":
        return [
          { rotation: b.rotation + Math.PI * 2 * 5, x: closeX, y: -28, duration: 800, ease: "Sine.easeInOut" },
        ];
      case "figure4":
        return [
          { x: closeX, y: -8, duration: 160 },
          { rotation: 1.15, scaleY: 0.72, duration: 180 },
          { duration: 450 },
        ];
      case "risingDragon":
        return [
          { x: closeX * 0.35, y: -96, rotation: b.rotation + f * 0.55, duration: 220 },
          { y: -20, duration: 320 },
        ];
      case "tigerUpper":
        return [
          { x: closeX * 0.15, y: -12, duration: 80 },
          { x: closeX * 0.55, y: -92, rotation: b.rotation + f * -0.7, duration: 200 },
          { y: -22, duration: 280 },
        ];
      case "spiritWave":
        return [
          { x: closeX * 0.15, duration: 100 },
          { scaleX: 1.28, duration: 100 },
          { x: closeX, duration: 280 },
        ];
      case "commandSlam":
        return [
          { x: closeX, y: -16, duration: 140 },
          { y: -60, rotation: b.rotation + Math.PI * 0.7, duration: 160 },
          { y: -12, duration: 160 },
        ];
      case "suplex":
        return [
          { x: closeX * 0.85, y: -10, duration: 120 },
          { x: closeX * 0.65, y: -66, rotation: b.rotation + Math.PI, duration: 200 },
          { y: -14, duration: 140 },
        ];
      case "powerbomb":
        return [
          { x: closeX, y: -24, duration: 120 },
          { y: -86, rotation: b.rotation + Math.PI * 1.15, duration: 160 },
          { y: -16, duration: 120 },
        ];
      case "piledriver":
        return [
          { x: closeX * 0.7, y: -8, duration: 100 },
          { y: -48, rotation: Math.PI, duration: 140 },
          { y: -2, duration: 120 },
          { rotation: 0, duration: 120 },
        ];
      case "flipKick":
        return [
          { x: closeX, y: -16, rotation: b.rotation + f * -Math.PI * 2, duration: 420 },
        ];
      case "moonsault":
        return [
          { y: -88, duration: 160 },
          { x: closeX * 0.7, y: -8, rotation: b.rotation + f * Math.PI * 2, duration: 360 },
        ];
      case "rana":
        return [
          { x: closeX * 0.6, y: -28, duration: 120 },
          { x: closeX * 0.9, y: -64, rotation: b.rotation + f * Math.PI * 1.4, duration: 280 },
          { y: -12, duration: 160 },
        ];
      case "clothesline":
        return [{ x: closeX * 1.15, y: -8, rotation: b.rotation + f * 0.45, duration: 260 }];
      case "spinningLariat":
        return [{ x: closeX * 0.9, rotation: b.rotation + Math.PI * 4, duration: 400 }];
      case "spear":
        return [
          { x: -closeX * 0.15, duration: 80 },
          { x: closeX * 1.15, y: -12, rotation: b.rotation + f * 0.85, duration: 180 },
          { y: -2, duration: 120 },
        ];
      case "dashThrough":
        return [
          { alpha: 0.25, duration: 80 },
          { x: closeX * 1.5, duration: 140 },
          { alpha: 1, duration: 80 },
          { duration: 280 },
        ];
      case "teleport":
        return [
          { alpha: 0, duration: 80 },
          { x: closeX * 1.6, y: -18, duration: 20 },
          { alpha: 1, duration: 100 },
          { rotation: b.rotation + f * 0.6, duration: 160 },
          { duration: 220 },
        ];
      case "rapidFists":
        return [
          { x: closeX * 0.45, duration: 100 },
          { x: closeX * 0.45 + 12, y: -6, duration: 45, yoyo: true, repeat: 6 },
        ];
      case "dropkick":
        return [
          { x: closeX * 0.35, y: -64, duration: 140 },
          { rotation: b.rotation + f * 1.35, duration: 100 },
          { x: closeX * 0.9, y: -6, duration: 160 },
        ];
      case "elbowDrop":
        return [
          { x: closeX * 0.25, y: -86, duration: 180 },
          { rotation: b.rotation + f * 0.25, duration: 80 },
          { x: closeX * 0.6, y: -4, duration: 140 },
        ];
      case "cutter":
        return [
          { x: closeX * 0.5, y: -48, duration: 140 },
          { rotation: b.rotation + f * -1.5, duration: 120 },
          { x: closeX * 0.75, y: -4, duration: 140 },
        ];
    }
  }

  private finishUltimate(): void {
    this.isUltimate = false;
    this.strike.setFillStyle(0xffffff, 0);
    this.restoreIdlePose();
  }

  private stopUltTween(): void {
    if (this.ultTween) {
      this.ultTween.stop();
      this.ultTween = null;
    }
    this.scene.tweens.killTweensOf(this.body);
  }

  private clearAttack(resume: FighterAnimName): void {
    this.isAttacking = false;
    this.activeAttack = null;
    this.strike.setFillStyle(0xffffff, 0);
    this.body.setPosition(0, 0);
    this.playAnim(resume);
  }

  private restoreIdlePose(): void {
    this.stopUltTween();
    this.splashKeys = [];
    this.splashFrame = 0;
    this.splashElapsed = 0;
    this.body.setRotation(0);
    this.body.setScale(1);
    this.body.setAlpha(1);
    this.body.setPosition(0, 0);
    this.body.clearTint();
    this.playAnim("idle", true);
  }

  update(dt: number, groundY: number, minX: number, maxX: number): void {
    if (this.isUltimate) {
      this.ultimateElapsed += dt;
      this.cycleSplashFrames(dt);
      this.strike.setFillStyle(this.fighter.accent, this.ultimateShouldConnect ? 0.95 : 0);
      this.strike.setSize(50, 40);
      this.strike.setPosition(36, -this.bodyHeight * 0.45);
      if (this.ultimateElapsed >= this.ultimateDuration) this.finishUltimate();
    }

    if (this.isAttacking && this.activeAttack) {
      this.attackElapsed += dt;
      const kind = ATTACK[this.activeAttack];
      const active = this.attackElapsed >= kind.activeStart && this.attackElapsed <= kind.activeEnd;
      this.strike.setFillStyle(this.activeAttack === "punch" ? 0xffffff : 0xffd94d, active ? 0.85 : 0);
      this.strike.setPosition(
        kind.range * 0.35,
        this.activeAttack === "sweep" ? -this.bodyHeight * 0.16 : this.activeAttack === "kick" ? -this.bodyHeight * 0.38 : -this.bodyHeight * 0.62,
      );
      this.strike.setSize(
        this.activeAttack === "sweep" ? 40 : this.activeAttack === "kick" ? 34 : 22,
        this.activeAttack === "sweep" ? 12 : this.activeAttack === "kick" ? 16 : 14,
      );
      if (this.attackElapsed >= kind.duration) {
        this.clearAttack(this.onGround ? (this.isCrouching ? "crouch" : "idle") : "jump");
      }
    }

    if (this.isBlocking) {
      this.blockElapsed += dt;
      if (this.blockElapsed >= this.blockDuration) {
        this.isBlocking = false;
        this.body.setScale(1);
        this.playAnim("idle");
      }
    }

    if (this.isHit) {
      this.hitElapsed += dt;
      if (this.hitElapsed > 0.28) this.isHit = false;
    }

    if (!this.onGround || this.vy !== 0) {
      this.vy += this.gravity * dt;
    }
    this.x += this.vx * dt;
    this.y -= this.vy * dt;

    if (this.y >= groundY) {
      const landed = !this.onGround;
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
      if (this.isKO) this.vx = 0;
      if (landed) playSfx(this.scene, "land");
      if (landed && this.isAttacking) {
        this.scene.tweens.killTweensOf(this.body);
        this.clearAttack("idle");
      }
    } else {
      this.onGround = false;
    }

    this.x = Phaser.Math.Clamp(this.x, minX, maxX);

    if (!this.onGround && !this.isAttacking && !this.isUltimate && !this.isHit && !this.isKO) {
      this.isCrouching = false;
      this.playAnim("jump");
    } else if (this.onGround && this.currentAnim === "jump" && !this.isAttacking && !this.isUltimate) {
      this.playAnim(this.isCrouching ? "crouch" : "idle");
    } else if (
      this.onGround &&
      this.isCrouching &&
      !this.isAttacking &&
      !this.isUltimate &&
      !this.isHit &&
      !this.isKO &&
      this.currentAnim !== "crouch"
    ) {
      this.playAnim("crouch");
    }

    if (!this.isUltimate) this.cycleAnimFrames(dt);
  }

  private cycleAnimFrames(dt: number): void {
    const frames = animPackFor(this.fighter.id).frames[this.currentAnim];
    if (!frames || frames.length <= 1) return;
    this.animElapsed += dt;
    const fps = this.currentAnim === "idle" ? 8 : 12;
    if (this.animElapsed < 1 / fps) return;
    this.animElapsed = 0;
    this.animFrame = (this.animFrame + 1) % frames.length;
    const key = frames[this.animFrame];
    if (this.scene.textures.exists(key)) {
      this.body.setTexture(key);
      this.fitBody();
    }
  }

  resetRound(x: number, y: number, facingRight: boolean, opts?: { preserveMeter?: boolean }): void {
    this.stopUltTween();
    this.root.setRotation(0);
    this.hp = this.maxHP;
    this.isKO = false;
    this.isHit = false;
    this.isAttacking = false;
    this.isUltimate = false;
    this.isBlocking = false;
    this.isCrouching = false;
    this.activeAttack = null;
    if (!opts?.preserveMeter) this.ultimateMeter = 0;
    this.ultimateDidConnect = false;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.x = x;
    this.y = y;
    this.facing = facingRight ? 1 : -1;
    this.root.setScale(this.facing, 1);
    this.restoreIdlePose();
  }

  destroy(): void {
    this.stopUltTween();
    this.root.destroy(true);
  }
}

export function ultimateDamage(defender: Fighter): number {
  return defender.maxHP * ULT_DAMAGE_FRACTION;
}
