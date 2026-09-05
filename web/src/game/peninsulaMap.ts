import Phaser from "phaser";
import { FONT, GOLD, GOLD_NUM } from "../config";
import { PENINSULA_LAND, STAGE_GEO, geoToUv, type StageGeo } from "../data/peninsula";

export interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class PeninsulaMap {
  readonly root: Phaser.GameObjects.Container;
  private readonly dots = new Map<string, Phaser.GameObjects.Arc>();
  private readonly labels = new Map<string, Phaser.GameObjects.Text>();
  private selectedId: string | null = null;
  private pulse?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rect: MapRect,
    onPick: (id: string) => void,
    interactive: boolean,
  ) {
    this.root = scene.add.container(rect.x, rect.y);
    this.drawPlate();
    this.drawLand();
    this.drawWaterLabels();
    for (const geo of STAGE_GEO) {
      const { px, py } = this.project(geo);
      const dot = scene.add.circle(px, py, 7, 0x4c8ad4, 1).setStrokeStyle(2, 0xe8f2ff, 0.9);
      this.dots.set(geo.id, dot);
      const label = scene.add
        .text(px + (geo.labelDx ?? 0), py + (geo.labelDy ?? -12), geo.short, {
          fontFamily: FONT,
          fontSize: "10px",
          color: "#dce8f4",
          fontStyle: "bold",
        })
        .setOrigin(geo.labelDx && geo.labelDx > 0 ? 0 : geo.labelDx && geo.labelDx < 0 ? 1 : 0.5, 0.5);
      this.labels.set(geo.id, label);
      const hit = scene.add.circle(px, py, 18, 0xffffff, 0.001);
      if (interactive) {
        hit.setInteractive({ useHandCursor: true });
        hit.on("pointerup", () => onPick(geo.id));
      }
      this.root.add([dot, label, hit]);
    }
  }

  highlight(stageId: string | null): void {
    this.selectedId = stageId;
    this.pulse?.stop();
    for (const [id, dot] of this.dots) {
      const on = id === stageId;
      dot.setFillStyle(on ? GOLD_NUM : 0x4c8ad4);
      dot.setScale(on ? 1.35 : 1);
      const label = this.labels.get(id);
      if (label) label.setColor(on ? GOLD : "#dce8f4");
    }
    const active = stageId ? this.dots.get(stageId) : undefined;
    if (active) {
      this.pulse = this.scene.tweens.add({
        targets: active,
        scale: 1.55,
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  destroy(): void {
    this.pulse?.stop();
    this.root.destroy(true);
  }

  private project(geo: StageGeo): { px: number; py: number } {
    const { u, v } = geoToUv(geo.lon, geo.lat);
    return { px: (u - 0.5) * this.rect.w * 0.92, py: (v - 0.5) * this.rect.h * 0.86 };
  }

  private drawPlate(): void {
    const { w, h } = this.rect;
    const g = this.scene.add.graphics();
    g.fillStyle(0x10243c, 0.92);
    g.fillEllipse(0, 0, w, h);
    g.lineStyle(4, GOLD_NUM, 0.85);
    g.strokeEllipse(0, 0, w, h);
    g.lineStyle(1, 0xffffff, 0.2);
    g.strokeEllipse(0, 0, w - 12, h - 12);
    this.root.add(g);

    if (this.scene.textures.exists("ui-select-map")) {
      const art = this.scene.add.image(0, 0, "ui-select-map");
      art.setDisplaySize(w - 18, h - 18);
      this.root.add(art);
    }
  }

  private drawLand(): void {
    if (this.scene.textures.exists("ui-select-map")) return;
    const { w, h } = this.rect;
    const g = this.scene.add.graphics();
    g.fillStyle(0xc9b48a, 1);
    g.lineStyle(2, 0x8a7048, 0.9);
    const pts = PENINSULA_LAND.map(([u, v]) => ({
      x: (u - 0.5) * w * 0.92,
      y: (v - 0.5) * h * 0.86,
    }));
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
    g.closePath();
    g.fillPath();
    g.strokePath();
    this.root.add(g);
  }

  private drawWaterLabels(): void {
    if (this.scene.textures.exists("ui-select-map")) return;
    const style = { fontFamily: FONT, fontSize: "11px", color: "#8ec4e8", fontStyle: "bold" as const };
    this.root.add(this.scene.add.text(-this.rect.w * 0.28, this.rect.h * 0.28, "JAMES RIVER", style).setOrigin(0.5));
    this.root.add(this.scene.add.text(this.rect.w * 0.18, -this.rect.h * 0.36, "YORK RIVER", style).setOrigin(0.5));
    this.root.add(this.scene.add.text(this.rect.w * 0.28, 0.02, "CHESAPEAKE BAY", style).setOrigin(0.5));
    this.root.add(
      this.scene.add
        .text(0, -this.rect.h * 0.42, "HAMPTON ROADS", {
          fontFamily: FONT,
          fontSize: "12px",
          color: "#f2e6c4",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );
  }
}
