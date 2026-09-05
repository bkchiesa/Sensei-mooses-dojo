import Phaser from "phaser";
import { CHARGE_PER_HIT, FIGHTER_HEIGHT, ULT_DAMAGE_FRACTION } from "../config";
import type { FighterDef, UltimateFlavor, UltimateMove } from "../data/catalog";

export type AttackKind = "punch" | "kick";

const ATTACK = {
  punch: { damage: 8, range: 78, duration: 0.28, activeStart: 0.07, activeEnd: 0.18 },
  kick: { damage: 14, range: 102, duration: 0.4, activeStart: 0.12, activeEnd: 0.26 },
} as const;

export class Fighter {
  readonly fighter: FighterDef;
  readonly isPlayer: boolean;
  readonly maxHP = 100;
  readonly bodyHeight = FIGHTER_HEIGHT;

  hp = 100;
  facing = 1;
  vx = 0;
  vy = 0;
  onGround = true;
  isAttacking = false;
  isHit = false;
  isKO = false;
  isUltimate = false;
  activeAttack: AttackKind | null = null;
  ultimateMeter = 0;

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
  private ultTween: Phaser.Tweens.TweenChain | null = null;

  private readonly moveSpeed = 280;
  private readonly jumpVelocity = 920;
  private readonly gravity = -2600;

  constructor(scene: Phaser.Scene, fighter: FighterDef, isPlayer: boolean, x: number, y: number) {
    this.scene = scene;
    this.fighter = fighter;
    this.isPlayer = isPlayer;
    this.idleKey = scene.textures.exists(fighter.idle) ? fighter.idle : this.fallbackKey();

    this.root = scene.add.container(x, y);
    this.body = scene.add.image(0, 0, this.idleKey);
    this.body.setOrigin(0.5, 1);
    this.fitBody();
    this.strike = scene.add.rectangle(36, -this.bodyHeight * 0.45, 28, 18, 0xffffff, 0);
    this.strike.setOrigin(0.5, 0.5);
    this.root.add([this.body, this.strike]);
    this.root.setDepth(10);
  }

  private fallbackKey(): string {
    if (this.scene.textures.exists("moose_title_idle")) return "moose_title_idle";
    return this.fighter.idle;
  }

  private fitBody(): void {
    if (this.body.height <= 0) return;
    this.body.setDisplaySize((this.body.width / this.body.height) * FIGHTER_HEIGHT, FIGHTER_HEIGHT);
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

  get ultimateShouldConnect(): boolean {
    return this.isUltimate && !this.ultimateDidConnect && this.ultimateElapsed >= 0.28 && this.ultimateElapsed <= 0.62;
  }

  faceToward(otherX: number): void {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO) return;
    this.facing = otherX >= this.x ? 1 : -1;
    this.root.setScale(this.facing, 1);
  }

  setWalk(left: boolean, right: boolean): void {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO) {
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
    if (!this.onGround || this.isHit || this.isKO || this.isUltimate) return;
    this.vy = this.jumpVelocity;
    this.onGround = false;
  }

  startAttack(kind: AttackKind): boolean {
    if (this.isAttacking || this.isUltimate || this.isHit || this.isKO || !this.onGround) return false;
    this.isAttacking = true;
    this.activeAttack = kind;
    this.attackElapsed = 0;
    this.didConnect = false;
    this.vx = 0;
    const lift = kind === "punch" ? 8 : -4;
    this.scene.tweens.add({
      targets: this.body,
      x: 10,
      y: -lift,
      duration: ATTACK[kind].activeStart * 1000,
      yoyo: true,
      hold: (ATTACK[kind].activeEnd - ATTACK[kind].activeStart) * 1000,
    });
    return true;
  }

  applyHit(damage: number, fromX: number): void {
    if (this.isKO) return;
    this.hp = Math.max(0, this.hp - damage);
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
      this.scene.tweens.add({ targets: this.root, rotation: dir * 1.2, duration: 350 });
    }
  }

  attackHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.isAttacking || !this.activeAttack || this.didConnect) return null;
    const kind = ATTACK[this.activeAttack];
    if (this.attackElapsed < kind.activeStart || this.attackElapsed > kind.activeEnd) return null;
    const w = kind.range;
    const h = this.activeAttack === "kick" ? 36 : 28;
    const originX = this.facing > 0 ? this.x + 10 : this.x - 10 - w;
    const originY = this.y - this.bodyHeight * 0.55;
    return new Phaser.Geom.Rectangle(originX, originY, w, h);
  }

  hurtbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 32, this.y - this.bodyHeight * 0.9, 64, this.bodyHeight * 0.9);
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
    this.ultimateElapsed = 0;
    this.ultimateDidConnect = false;
    this.vx = 0;
    const close = Math.min(96, Math.abs(towardX - this.x) * 0.55) * (towardX >= this.x ? 1 : -1);
    this.playUltimateMotion(this.fighter.ultimate, close);
    return true;
  }

  markUltimateConnected(): void {
    this.ultimateDidConnect = true;
  }

  private playUltimateMotion(move: UltimateMove, closeX: number): void {
    this.stopUltTween();
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

  private restoreIdlePose(): void {
    this.stopUltTween();
    this.body.setRotation(0);
    this.body.setScale(1);
    this.body.setAlpha(1);
    this.body.setPosition(0, 0);
    this.body.clearTint();
    if (this.scene.textures.exists(this.idleKey)) {
      this.body.setTexture(this.idleKey);
      this.fitBody();
    }
  }

  update(dt: number, groundY: number, minX: number, maxX: number): void {
    if (this.isUltimate) {
      this.ultimateElapsed += dt;
      this.strike.setFillStyle(this.fighter.accent, this.ultimateShouldConnect ? 0.95 : 0);
      this.strike.setSize(50, 40);
      this.strike.setPosition(36, -this.bodyHeight * 0.45);
      if (this.ultimateElapsed >= 0.95) this.finishUltimate();
    }

    if (this.isAttacking && this.activeAttack) {
      this.attackElapsed += dt;
      const kind = ATTACK[this.activeAttack];
      const active = this.attackElapsed >= kind.activeStart && this.attackElapsed <= kind.activeEnd;
      this.strike.setFillStyle(this.activeAttack === "kick" ? 0xffd94d : 0xffffff, active ? 0.85 : 0);
      this.strike.setPosition(kind.range * 0.35, this.activeAttack === "kick" ? -this.bodyHeight * 0.38 : -this.bodyHeight * 0.62);
      this.strike.setSize(this.activeAttack === "kick" ? 34 : 22, this.activeAttack === "kick" ? 16 : 14);
      if (this.attackElapsed >= kind.duration) {
        this.isAttacking = false;
        this.activeAttack = null;
        this.strike.setFillStyle(0xffffff, 0);
        this.body.setPosition(0, 0);
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
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
      if (this.isKO) this.vx = 0;
    } else {
      this.onGround = false;
    }

    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
  }

  resetRound(x: number, y: number, facingRight: boolean): void {
    this.stopUltTween();
    this.root.setRotation(0);
    this.hp = this.maxHP;
    this.isKO = false;
    this.isHit = false;
    this.isAttacking = false;
    this.isUltimate = false;
    this.activeAttack = null;
    this.ultimateMeter = 0;
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
