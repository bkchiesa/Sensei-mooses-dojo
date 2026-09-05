import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD_NUM } from "../config";

type ActionName = "punch" | "kick" | "ultimate";

interface PadButton {
  name: ActionName;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  color: number;
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

/** Circular thumbstick (move / crouch / jump) + punch / kick / ult. */
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
  private readonly boundDown: (p: Phaser.Input.Pointer) => void;
  private readonly boundMove: (p: Phaser.Input.Pointer) => void;
  private readonly boundUp: (p: Phaser.Input.Pointer) => void;

  constructor(private readonly scene: Phaser.Scene) {
    const W = DESIGN_WIDTH;
    const H = DESIGN_HEIGHT;
    this.stickX = 128;
    this.stickY = H - 118;
    const actionY = H - 92;

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

    this.addButton("punch", "PUNCH", W - 176, actionY, 40, 0xbf4033);
    this.addButton("kick", "KICK", W - 82, actionY + 8, 40, 0xcc9e26);
    this.addButton("ultimate", "★ ULT", W - 258, H - 166, 40, 0x8c33b3);
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

  private addButton(name: ActionName, text: string, x: number, y: number, radius: number, color: number): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.75);
    circle.setStrokeStyle(2, 0xffffff, 0.35);
    circle.setDepth(80);
    circle.setScrollFactor(0);
    const label = this.scene.add.text(x, y, text, {
      fontFamily: FONT,
      fontSize: "13px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    label.setOrigin(0.5);
    label.setDepth(81);
    label.setScrollFactor(0);
    this.buttons.push({ name, circle, label, color });
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
    if (name === "ultimate" && this.ultimateReady) this.onUltimate?.();
  }

  private press(name: ActionName, down: boolean): void {
    const b = this.buttons.find((x) => x.name === name);
    if (!b) return;
    if (name === "ultimate") {
      b.circle.setAlpha(down ? 0.55 : this.ultimateReady ? 1 : 0.32);
    } else {
      b.circle.setAlpha(down ? 0.55 : 1);
    }
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
    if (just(this.keys.punch)) this.onPunch?.();
    if (just(this.keys.kick)) this.onKick?.();
    if (just(this.keys.ult) && this.ultimateReady) this.onUltimate?.();
  }

  setUltimateReady(ready: boolean): void {
    this.ultimateReady = ready;
    const b = this.buttons.find((x) => x.name === "ultimate");
    if (!b) return;
    b.circle.setAlpha(ready ? 1 : 0.32);
    b.circle.setStrokeStyle(2, ready ? GOLD_NUM : 0xffffff, ready ? 1 : 0.2);
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
      b.circle.setAlpha(on ? 1 : 0.28);
    }
    this.base.setAlpha(on ? 1 : 0.35);
    this.knob.setAlpha(on ? 1 : 0.35);
    this.hint.setAlpha(on ? 1 : 0.35);
    if (!on) this.setUltimateReady(false);
  }

  reset(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.downHeld = false;
    this.pointers.clear();
    this.resetStick();
    for (const b of this.buttons) b.circle.setAlpha(this.enabled ? 1 : 0.28);
    this.setUltimateReady(false);
  }

  setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.ring.setVisible(visible);
    this.knob.setVisible(visible);
    this.hint.setVisible(visible);
    for (const b of this.buttons) {
      b.circle.setVisible(visible);
      b.label.setVisible(visible);
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
    for (const b of this.buttons) {
      b.circle.destroy();
      b.label.destroy();
    }
    this.buttons.length = 0;
  }
}
