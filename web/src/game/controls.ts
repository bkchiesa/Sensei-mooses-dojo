import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, FONT, GOLD_NUM } from "../config";

type ActionName = "left" | "right" | "down" | "jump" | "punch" | "kick" | "ultimate";

interface PadButton {
  name: ActionName;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  baseAlpha: number;
  color: number;
}

/** On-screen pad + keyboard. Multitouch for iPad Safari. */
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
  private readonly buttons: PadButton[] = [];
  private readonly pointers = new Map<number, ActionName>();
  private readonly keys: {
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
    jump: Phaser.Input.Keyboard.Key[];
    punch: Phaser.Input.Keyboard.Key[];
    kick: Phaser.Input.Keyboard.Key[];
    ult: Phaser.Input.Keyboard.Key[];
  };

  constructor(private readonly scene: Phaser.Scene) {
    const W = DESIGN_WIDTH;
    const H = DESIGN_HEIGHT;
    const moveY = H - 78;
    const actionY = H - 92;

    this.addButton("left", "◀", 90, moveY, 42, 0x262626, 0.55);
    this.addButton("down", "▼", 138, moveY + 56, 34, 0x262626, 0.55);
    this.addButton("right", "▶", 186, moveY, 42, 0x262626, 0.55);
    this.addButton("jump", "JUMP", W - 96, H - (92 + 78), 38, 0x3373bf, 0.7);
    this.addButton("punch", "PUNCH", W - 176, actionY, 40, 0xbf4033, 0.75);
    this.addButton("kick", "KICK", W - 82, actionY + 8, 40, 0xcc9e26, 0.75);
    this.addButton("ultimate", "★ ULT", W - 258, H - (92 + 74), 40, 0x8c33b3, 0.85);
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
    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.onPointer(p, false);
    });
    scene.input.on("pointerup", (p: Phaser.Input.Pointer) => this.releasePointer(p.id));
    scene.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.releasePointer(p.id));
  }

  private addButton(
    name: ActionName,
    text: string,
    x: number,
    y: number,
    radius: number,
    color: number,
    alpha: number,
  ): void {
    const circle = this.scene.add.circle(x, y, radius, color, alpha);
    circle.setStrokeStyle(2, 0xffffff, 0.35);
    circle.setDepth(80);
    circle.setScrollFactor(0);
    const label = this.scene.add.text(x, y, text, {
      fontFamily: FONT,
      fontSize: text.length > 1 ? "13px" : "22px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    label.setOrigin(0.5);
    label.setDepth(81);
    label.setScrollFactor(0);
    this.buttons.push({ name, circle, label, baseAlpha: 1, color });
  }

  private hit(x: number, y: number): ActionName | null {
    for (const b of this.buttons) {
      const dx = x - b.circle.x;
      const dy = y - b.circle.y;
      if (dx * dx + dy * dy <= (b.circle.radius + 8) ** 2) return b.name;
    }
    return null;
  }

  private onPointer(p: Phaser.Input.Pointer, isDown: boolean): void {
    if (!this.enabled) return;
    const name = this.hit(p.worldX, p.worldY);
    const previous = this.pointers.get(p.id);
    if (previous === name) return;
    if (previous) this.press(previous, false);
    if (name) {
      this.pointers.set(p.id, name);
      this.press(name, true);
      this.fire(name);
    } else if (!isDown || previous) {
      this.pointers.delete(p.id);
    }
  }

  private releasePointer(id: number): void {
    const name = this.pointers.get(id);
    if (name) this.press(name, false);
    this.pointers.delete(id);
  }

  private fire(name: ActionName): void {
    if (name === "jump") this.onJump?.();
    if (name === "punch") this.onPunch?.();
    if (name === "kick") this.onKick?.();
    if (name === "ultimate" && this.ultimateReady) this.onUltimate?.();
  }

  private press(name: ActionName, down: boolean): void {
    const b = this.buttons.find((x) => x.name === name);
    if (b) {
      if (name === "ultimate") {
        b.circle.setAlpha(down ? 0.55 : this.ultimateReady ? 1 : 0.32);
      } else {
        b.circle.setAlpha(down ? 0.55 : 1);
      }
    }
    if (name === "left") this.leftHeld = down;
    if (name === "right") this.rightHeld = down;
    if (name === "down") this.downHeld = down;
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

    const left = down(this.keys.left);
    const right = down(this.keys.right);
    if (left || right) {
      this.leftHeld = left && !right;
      this.rightHeld = right && !left;
    } else if (![...this.pointers.values()].some((n) => n === "left" || n === "right")) {
      this.leftHeld = false;
      this.rightHeld = false;
    }

    const crouchKey = down(this.keys.down);
    const crouchPad = [...this.pointers.values()].some((n) => n === "down");
    this.downHeld = crouchKey || crouchPad;

    if (just(this.keys.jump)) this.onJump?.();
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
    }
    for (const b of this.buttons) {
      if (b.name === "ultimate") continue;
      b.circle.setAlpha(on ? 1 : 0.28);
    }
    if (!on) this.setUltimateReady(false);
  }

  reset(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.downHeld = false;
    this.pointers.clear();
    for (const b of this.buttons) b.circle.setAlpha(this.enabled ? 1 : 0.28);
    this.setUltimateReady(false);
  }

  setVisible(visible: boolean): void {
    for (const b of this.buttons) {
      b.circle.setVisible(visible);
      b.label.setVisible(visible);
    }
  }
}
