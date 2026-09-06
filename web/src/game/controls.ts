import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD_NUM } from "../config";
import {
  actionButtonTexture,
  hasActionButtonArt,
  type ActionFace,
} from "./actionButtonArt";
import {
  ensureUltButtonAnims,
  hasUltButtonArt,
  idleUltKey,
  ULT_BTN_BOLT_ANIM,
  ULT_BTN_DISPLAY,
  ULT_BTN_READY_ANIM,
} from "./ultButtonArt";

type ActionName = "punch" | "kick" | "ultimate";

interface PadButton {
  name: ActionName;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  color: number;
  art?: Phaser.GameObjects.Image;
  restScale: number;
}

export interface StickAxes {
  nx: number;
  ny: number;
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
}

const STICK_RADIUS = 78;
const KNOB_RADIUS = 30;
const DEADZONE = 0.22;
const WALK_GATE = 0.32;
const VERT_GATE = 0.42;

/** Was 40px radius; Brandon playtest: ~50% larger. */
const ACTION_RADIUS = 60;
/** Extra pointer slack used by hitButton — counted in the punch/kick gap. */
const ACTION_HIT_PAD = 10;
/** Pixel lock: ≥48px between punch and kick hitboxes. */
const ACTION_GAP = 48;
/** Display size for 384×384 pad plates (a bit larger than the 120px hit circle). */
const ACTION_ART_DISPLAY = 140;

/** Convert stick offset (px, +y down) into digital gates. */
export function readStickAxes(dx: number, dy: number, radius: number): StickAxes {
  const nx = Phaser.Math.Clamp(dx / radius, -1, 1);
  const ny = Phaser.Math.Clamp(dy / radius, -1, 1);
  const mag = Math.hypot(nx, ny);
  if (mag < DEADZONE) {
    return { nx: 0, ny: 0, left: false, right: false, down: false, jump: false };
  }
  return {
    nx,
    ny,
    left: nx <= -WALK_GATE,
    right: nx >= WALK_GATE,
    down: ny >= VERT_GATE,
    jump: ny <= -VERT_GATE,
  };
}

/** Circular thumbstick (move / crouch / jump) + punch / kick / locked gold-bolt ULT. */
export class VirtualControls {
  leftHeld = false;
  rightHeld = false;
  downHeld = false;
  enabled = true;
  onJump?: () => void;
  onPunch?: () => void;
  onKick?: () => void;
  onUltimate?: () => void;

  private ultimateReady = false;
  private stickJumpLatched = false;
  private readonly buttons: PadButton[] = [];
  private readonly pointers = new Map<number, ActionName | "stick">();
  private readonly keys: {
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
    jump: Phaser.Input.Keyboard.Key[];
    punch: Phaser.Input.Keyboard.Key[];
    kick: Phaser.Input.Keyboard.Key[];
    ult: Phaser.Input.Keyboard.Key[];
  };

  private readonly stickX: number;
  private readonly stickY: number;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly ultSprite?: Phaser.GameObjects.Sprite;
  private readonly ultBolt?: Phaser.GameObjects.Sprite;
  private readonly boundDown: (p: Phaser.Input.Pointer) => void;
  private readonly boundMove: (p: Phaser.Input.Pointer) => void;
  private readonly boundUp: (p: Phaser.Input.Pointer) => void;

  constructor(private readonly scene: Phaser.Scene) {
    const W = DESIGN_WIDTH;
    const H = DESIGN_HEIGHT;
    this.stickX = 128;
    this.stickY = H - 118;
    const actionY = H - 108;
    const kickX = W - 86;
    // hit radii (60+10)*2 + 48px gap = 188px center-to-center.
    const punchX = kickX - (ACTION_RADIUS * 2 + ACTION_HIT_PAD * 2 + ACTION_GAP);
    const ultX = (punchX + kickX) / 2;
    const ultY = H - 232;

    this.base = scene.add.circle(this.stickX, this.stickY, STICK_RADIUS, 0x101018, 0.72);
    this.base.setStrokeStyle(4, GOLD_NUM, 0.85);
    this.base.setDepth(80).setScrollFactor(0);
    this.ring = scene.add.circle(this.stickX, this.stickY, 8, 0xffffff, 0.12);
    this.ring.setDepth(80).setScrollFactor(0);
    this.knob = scene.add.circle(this.stickX, this.stickY, KNOB_RADIUS, 0xd8d8e0, 0.95);
    this.knob.setStrokeStyle(3, 0xffffff, 0.95);
    this.knob.setDepth(82).setScrollFactor(0);
    this.hint = scene.add
      .text(this.stickX, this.stickY - STICK_RADIUS - 18, "↑ JUMP", {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#fff6d8",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(81)
      .setScrollFactor(0);

    this.addButton("punch", "PUNCH", punchX, actionY, ACTION_RADIUS, 0xbf4033);
    this.addButton("kick", "KICK", kickX, actionY, ACTION_RADIUS, 0xcc9e26);
    this.addButton("ultimate", "★ ULT", ultX, ultY, 40, 0x8c33b3);
    const ultArt = this.mountUltButton(ultX, ultY);
    this.ultSprite = ultArt.sprite;
    this.ultBolt = ultArt.bolt;
    this.setUltimateReady(false);

    const kb = scene.input.keyboard;
    const k = (code: string): Phaser.Input.Keyboard.Key[] => (kb ? [kb.addKey(code)] : []);
    this.keys = {
      left: [...k("LEFT"), ...k("A")],
      right: [...k("RIGHT"), ...k("D")],
      down: [...k("DOWN"), ...k("S")],
      jump: [...k("UP"), ...k("W"), ...k("SPACE")],
      punch: [...k("J"), ...k("Z")],
      kick: [...k("K"), ...k("X")],
      ult: [...k("U"), ...k("ENTER")],
    };

    scene.input.addPointer(3);
    this.boundDown = (p) => this.onPointer(p, true);
    this.boundMove = (p) => {
      if (p.isDown) this.onPointer(p, false);
    };
    this.boundUp = (p) => this.releasePointer(p.id);
    scene.input.on("pointerdown", this.boundDown);
    scene.input.on("pointermove", this.boundMove);
    scene.input.on("pointerup", this.boundUp);
    scene.input.on("pointerupoutside", this.boundUp);
  }

  private mountUltButton(
    x: number,
    y: number,
  ): { sprite?: Phaser.GameObjects.Sprite; bolt?: Phaser.GameObjects.Sprite } {
    if (!hasUltButtonArt(this.scene)) return {};
    const { bolt } = ensureUltButtonAnims(this.scene);
    const idle = idleUltKey(this.scene);
    if (!idle) return {};
    const sprite = this.scene.add.sprite(x, y, idle);
    sprite.setDisplaySize(ULT_BTN_DISPLAY, ULT_BTN_DISPLAY);
    sprite.setDepth(81).setScrollFactor(0);
    sprite.setAlpha(0.78);
    const flash = bolt[0]
      ? this.scene.add.sprite(x, y, bolt[0]).setVisible(false)
      : undefined;
    if (flash) {
      flash.setDisplaySize(ULT_BTN_DISPLAY, ULT_BTN_DISPLAY);
      flash.setDepth(82).setScrollFactor(0);
    }
    const pad = this.buttons.find((b) => b.name === "ultimate");
    if (pad) {
      pad.circle.setFillStyle(0x000000, 0);
      pad.circle.setStrokeStyle(0, 0x000000, 0);
      pad.label.setVisible(false);
    }
    return { sprite, bolt: flash };
  }

  private addButton(name: ActionName, text: string, x: number, y: number, radius: number, color: number): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.75);
    circle.setStrokeStyle(2, 0xffffff, 0.35);
    circle.setDepth(80);
    circle.setScrollFactor(0);
    const label = this.scene.add.text(x, y, text, {
      fontFamily: FONT,
      fontSize: name === "ultimate" ? "13px" : "16px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    label.setOrigin(0.5);
    label.setDepth(81);
    label.setScrollFactor(0);
    const art = name === "punch" || name === "kick" ? this.mountActionArt(name, x, y) : undefined;
    if (art) {
      circle.setFillStyle(0x000000, 0);
      circle.setStrokeStyle(0, 0x000000, 0);
      label.setVisible(false);
    }
    this.buttons.push({ name, circle, label, color, art, restScale: art ? art.scale : 1 });
  }

  /**
   * Pixel locked punch/kick up/down plates from `dojo-art/finals/ui/pad-buttons/`.
   * Falls back to the scaled circle if a pair is missing.
   */
  private mountActionArt(face: ActionFace, x: number, y: number): Phaser.GameObjects.Image | undefined {
    if (!hasActionButtonArt(this.scene, face)) return undefined;
    const key = actionButtonTexture(this.scene, face, "up") ?? actionButtonTexture(this.scene, face, "down");
    if (!key) return undefined;
    const img = this.scene.add.image(x, y, key);
    img.setDisplaySize(ACTION_ART_DISPLAY, ACTION_ART_DISPLAY);
    img.setDepth(81).setScrollFactor(0);
    return img;
  }

  private hitButton(x: number, y: number): ActionName | null {
    for (const b of this.buttons) {
      const dx = x - b.circle.x;
      const dy = y - b.circle.y;
      if (dx * dx + dy * dy <= (b.circle.radius + 10) ** 2) return b.name;
    }
    return null;
  }

  private hitStick(x: number, y: number): boolean {
    const dx = x - this.stickX;
    const dy = y - this.stickY;
    return dx * dx + dy * dy <= (STICK_RADIUS + 36) ** 2;
  }

  private onPointer(p: Phaser.Input.Pointer, isDown: boolean): void {
    if (!this.enabled) return;
    const previous = this.pointers.get(p.id);
    if (previous === "stick") {
      this.applyStick(p.worldX, p.worldY);
      return;
    }
    const button = this.hitButton(p.worldX, p.worldY);
    if (button) {
      if (previous === button) return;
      if (previous) this.press(previous, false);
      this.pointers.set(p.id, button);
      this.press(button, true);
      this.fire(button);
      return;
    }
    if (previous === undefined && this.hitStick(p.worldX, p.worldY)) {
      this.pointers.set(p.id, "stick");
      this.applyStick(p.worldX, p.worldY);
      return;
    }
    if (!isDown || previous) this.releasePointer(p.id);
  }

  private applyStick(x: number, y: number): void {
    let dx = x - this.stickX;
    let dy = y - this.stickY;
    const mag = Math.hypot(dx, dy);
    if (mag > STICK_RADIUS) {
      dx = (dx / mag) * STICK_RADIUS;
      dy = (dy / mag) * STICK_RADIUS;
    }
    this.knob.setPosition(this.stickX + dx, this.stickY + dy);
    const axes = readStickAxes(dx, dy, STICK_RADIUS);
    this.leftHeld = axes.left;
    this.rightHeld = axes.right;
    this.downHeld = axes.down;
    this.stickJumpLatched = axes.jump;
    if (axes.jump) this.onJump?.();
    this.knob.setFillStyle(axes.jump ? 0x3373bf : axes.down ? 0x5a4030 : 0x3a3a3a, 0.92);
  }

  private resetStick(): void {
    this.knob.setPosition(this.stickX, this.stickY);
    this.knob.setFillStyle(0x3a3a3a, 0.92);
    this.stickJumpLatched = false;
    if (![...this.pointers.values()].some((n) => n === "stick")) {
      /* keyboard may still hold dirs */
    }
  }

  private releasePointer(id: number): void {
    const name = this.pointers.get(id);
    if (name === "stick") {
      this.pointers.delete(id);
      this.resetStick();
      if (![...this.pointers.values()].includes("stick")) {
        this.leftHeld = false;
        this.rightHeld = false;
        this.downHeld = false;
      }
      return;
    }
    if (name) this.press(name, false);
    this.pointers.delete(id);
  }

  private fire(name: ActionName): void {
    if (name === "punch") this.onPunch?.();
    if (name === "kick") this.onKick?.();
    if (name === "ultimate" && this.ultimateReady) {
      this.playUltBoltFlash();
      this.onUltimate?.();
    }
  }

  private press(name: ActionName, down: boolean): void {
    const b = this.buttons.find((x) => x.name === name);
    if (!b) return;
    if (name === "ultimate") {
      if (this.ultSprite) {
        const base = ULT_BTN_DISPLAY / this.ultSprite.width;
        this.ultSprite.setScale(base * (down ? 0.92 : 1));
      } else {
        b.circle.setAlpha(down ? 0.55 : this.ultimateReady ? 1 : 0.32);
      }
      return;
    }
    // Pressed/unpressed: swap Pixel plates when present; else scale + tint the circle.
    if (b.art && (name === "punch" || name === "kick")) {
      const key = actionButtonTexture(this.scene, name, down ? "down" : "up");
      if (key) b.art.setTexture(key);
      b.art.setScale(b.restScale * (down ? 0.9 : 1));
      b.art.setTint(down ? 0xd0d0d0 : 0xffffff);
      return;
    }
    b.circle.setScale(down ? 0.9 : 1);
    b.circle.setAlpha(down ? 0.7 : this.enabled ? 1 : 0.28);
    b.circle.setFillStyle(down ? 0x7a281c : b.color, down ? 0.95 : 0.75);
    if (name === "kick") b.circle.setFillStyle(down ? 0x8a6a14 : b.color, down ? 0.95 : 0.75);
    b.label.setScale(down ? 0.92 : 1);
  }

  private playUltBoltFlash(): void {
    if (!this.ultBolt) return;
    this.ultBolt.setVisible(true);
    this.ultBolt.setAlpha(1);
    if (this.scene.anims.exists(ULT_BTN_BOLT_ANIM)) {
      this.ultBolt.play(ULT_BTN_BOLT_ANIM, true);
      this.ultBolt.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.ultBolt?.setVisible(false);
      });
    } else {
      this.scene.tweens.add({
        targets: this.ultBolt,
        alpha: 0,
        duration: 180,
        onComplete: () => this.ultBolt?.setVisible(false),
      });
    }
  }

  private syncUltArt(): void {
    const pad = this.buttons.find((b) => b.name === "ultimate");
    if (this.ultSprite) {
      const idle = idleUltKey(this.scene);
      const dim = this.enabled ? (this.ultimateReady ? 1 : 0.78) : 0.45;
      this.ultSprite.setAlpha(dim);
      if (this.ultimateReady && this.scene.anims.exists(ULT_BTN_READY_ANIM)) {
        if (this.ultSprite.anims.currentAnim?.key !== ULT_BTN_READY_ANIM) {
          this.ultSprite.play(ULT_BTN_READY_ANIM);
          this.ultSprite.setDisplaySize(ULT_BTN_DISPLAY, ULT_BTN_DISPLAY);
        }
      } else {
        this.ultSprite.stop();
        if (idle) this.ultSprite.setTexture(idle);
        this.ultSprite.setDisplaySize(ULT_BTN_DISPLAY, ULT_BTN_DISPLAY);
      }
      return;
    }
    if (!pad) return;
    pad.circle.setAlpha(this.ultimateReady ? 1 : 0.32);
    pad.circle.setStrokeStyle(2, this.ultimateReady ? GOLD_NUM : 0xffffff, this.ultimateReady ? 1 : 0.2);
  }

  pollKeyboard(): void {
    if (!this.enabled) {
      this.leftHeld = false;
      this.rightHeld = false;
      this.downHeld = false;
      return;
    }
    const down = (keys: Phaser.Input.Keyboard.Key[]) => keys.some((k) => k.isDown);
    const just = (keys: Phaser.Input.Keyboard.Key[]) => keys.some((k) => Phaser.Input.Keyboard.JustDown(k));
    const stickHeld = [...this.pointers.values()].includes("stick");

    const left = down(this.keys.left);
    const right = down(this.keys.right);
    if (left || right) {
      this.leftHeld = left && !right;
      this.rightHeld = right && !left;
    } else if (!stickHeld) {
      this.leftHeld = false;
      this.rightHeld = false;
    }

    const crouchKey = down(this.keys.down);
    this.downHeld = crouchKey || (stickHeld && this.downHeld);

    if (just(this.keys.jump) || this.stickJumpLatched) this.onJump?.();
    if (just(this.keys.punch)) {
      this.flashPress("punch");
      this.onPunch?.();
    }
    if (just(this.keys.kick)) {
      this.flashPress("kick");
      this.onKick?.();
    }
    if (just(this.keys.ult) && this.ultimateReady) {
      this.playUltBoltFlash();
      this.onUltimate?.();
    }
  }

  private flashPress(name: ActionName): void {
    this.press(name, true);
    this.scene.time.delayedCall(120, () => {
      if (![...this.pointers.values()].includes(name)) this.press(name, false);
    });
  }

  setUltimateReady(ready: boolean): void {
    if (this.ultimateReady === ready) return;
    this.ultimateReady = ready;
    this.syncUltArt();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.leftHeld = false;
      this.rightHeld = false;
      this.downHeld = false;
      this.pointers.clear();
      this.resetStick();
    }
    for (const b of this.buttons) {
      if (b.name === "ultimate") continue;
      this.press(b.name, false);
      b.circle.setAlpha(on ? 1 : 0.28);
      if (b.art) b.art.setAlpha(on ? 1 : 0.35);
    }
    this.base.setAlpha(on ? 1 : 0.35);
    this.knob.setAlpha(on ? 1 : 0.35);
    this.hint.setAlpha(on ? 1 : 0.35);
    if (!on) this.ultimateReady = false;
    this.syncUltArt();
  }

  reset(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.downHeld = false;
    this.pointers.clear();
    this.resetStick();
    for (const b of this.buttons) {
      if (b.name === "ultimate") continue;
      this.press(b.name, false);
      b.circle.setAlpha(this.enabled ? 1 : 0.28);
    }
    this.ultBolt?.setVisible(false);
    this.setUltimateReady(false);
    this.syncUltArt();
  }

  setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.ring.setVisible(visible);
    this.knob.setVisible(visible);
    this.hint.setVisible(visible);
    this.ultSprite?.setVisible(visible);
    if (!visible) this.ultBolt?.setVisible(false);
    for (const b of this.buttons) {
      b.circle.setVisible(visible);
      b.art?.setVisible(visible);
      if ((b.name === "ultimate" && this.ultSprite) || b.art) {
        b.label.setVisible(false);
      } else {
        b.label.setVisible(visible);
      }
    }
  }

  /** Drop global pointer hooks so an overlay can receive iPad taps. */
  detach(): void {
    this.enabled = false;
    this.leftHeld = false;
    this.rightHeld = false;
    this.downHeld = false;
    this.pointers.clear();
    this.scene.input.off("pointerdown", this.boundDown);
    this.scene.input.off("pointermove", this.boundMove);
    this.scene.input.off("pointerup", this.boundUp);
    this.scene.input.off("pointerupoutside", this.boundUp);
    this.setVisible(false);
  }

  destroy(): void {
    this.detach();
    this.base.destroy();
    this.ring.destroy();
    this.knob.destroy();
    this.hint.destroy();
    this.ultSprite?.destroy();
    this.ultBolt?.destroy();
    for (const b of this.buttons) {
      b.circle.destroy();
      b.label.destroy();
      b.art?.destroy();
    }
    this.buttons.length = 0;
  }
}
