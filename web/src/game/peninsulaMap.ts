import Phaser from "phaser";
import { FONT, GOLD, GOLD_NUM } from "../config";
import {
  PENINSULA_SHORE,
  PENINSULA_WATER_LABELS,
  PLATE_C_MAP_RECT,
  PLATE_C_PX,
  STAGE_GEO,
  fitGeoPlot,
  geoToUv,
  isFramedSelectPlate,
  type StageGeo,
} from "../data/peninsula";

export interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class PeninsulaMap {
  readonly root: Phaser.GameObjects.Container;
  private readonly plot: { w: number; h: number };
  private readonly framed: boolean;
  private readonly plateSize: { width: number; height: number };
  private readonly dots = new Map<string, Phaser.GameObjects.Arc>();
  private readonly labels = new Map<string, Phaser.GameObjects.Text>();
  private selectedId: string | null = null;
  private pulse?: Phaser.Tweens.Tween;
  private plateMask?: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rect: MapRect,
    onPick: (id: string) => void,
    interactive: boolean,
  ) {
    const src = this.plateSource();
    this.framed = isFramedSelectPlate(src?.width, src?.height);
    this.plateSize = this.framed
      ? { width: src?.width ?? PLATE_C_PX.width, height: src?.height ?? PLATE_C_PX.height }
      : { width: src?.width ?? 0, height: src?.height ?? 0 };
    this.plot = this.framed ? { w: rect.w, h: rect.h } : fitGeoPlot(rect.w, rect.h);
    this.root = scene.add.container(rect.x, rect.y);
    this.drawPlate();
    this.drawLand();
    this.drawWaterLabels();
    for (const geo of STAGE_GEO) {
      const { px, py } = this.project(geo);
      const dot = scene.add.circle(px, py, this.framed ? 6 : 7, 0x4c8ad4, 1).setStrokeStyle(2, 0xe8f2ff, 0.95);
      this.dots.set(geo.id, dot);
      const nodes: Phaser.GameObjects.GameObject[] = [dot];
      if (!this.framed) {
        const label = scene.add
          .text(px + (geo.labelDx ?? 0), py + (geo.labelDy ?? -12), geo.short, {
            fontFamily: FONT,
            fontSize: "10px",
            color: "#dce8f4",
            fontStyle: "bold",
          })
          .setOrigin(geo.labelDx && geo.labelDx > 0 ? 0 : geo.labelDx && geo.labelDx < 0 ? 1 : 0.5, 0.5);
        this.labels.set(geo.id, label);
        nodes.push(label);
      }
      const hit = scene.add.circle(px, py, 18, 0xffffff, 0.001);
      if (interactive) {
        hit.setInteractive({ useHandCursor: true });
        hit.on("pointerup", () => onPick(geo.id));
      }
      nodes.push(hit);
      this.root.add(nodes);
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
    this.plateMask?.destroy();
    this.root.destroy(true);
  }

  /** Raw 0–1 UV over the geo plot. Framed plate C uses the fitted map rect. */
  private project(geo: Pick<StageGeo, "lon" | "lat">): { px: number; py: number } {
    const { u, v } = geoToUv(geo.lon, geo.lat);
    if (this.framed) {
      const plateX = PLATE_C_MAP_RECT.x + u * PLATE_C_MAP_RECT.w;
      const plateY = PLATE_C_MAP_RECT.y + v * PLATE_C_MAP_RECT.h;
      return {
        px: (plateX / this.plateSize.width - 0.5) * this.plot.w,
        py: (plateY / this.plateSize.height - 0.5) * this.plot.h,
      };
    }
    return { px: (u - 0.5) * this.plot.w, py: (v - 0.5) * this.plot.h };
  }

  private drawPlate(): void {
    const { w, h } = this.rect;
    const g = this.scene.add.graphics();
    if (this.framed) {
      g.fillStyle(0x0c1428, 1);
      g.fillRect(-w / 2, -h / 2, w, h);
      g.lineStyle(3, GOLD_NUM, 0.75);
      g.strokeRect(-w / 2, -h / 2, w, h);
    } else {
      g.fillStyle(0x10243c, 0.92);
      g.fillEllipse(0, 0, w, h);
      g.lineStyle(4, GOLD_NUM, 0.85);
      g.strokeEllipse(0, 0, w, h);
      g.lineStyle(1, 0xffffff, 0.2);
      g.strokeEllipse(0, 0, w - 12, h - 12);
    }
    this.root.add(g);

    if (!this.hasPlateArt()) return;
    const art = this.scene.add.image(0, 0, "ui-select-map");
    art.setDisplaySize(this.plot.w, this.plot.h);
    if (!this.framed) this.clipToChrome(art);
    this.root.add(art);
  }

  private drawLand(): void {
    if (this.hasPlateArt()) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0xc9b48a, 1);
    g.lineStyle(2, 0x8a7048, 0.9);
    const pts = PENINSULA_SHORE.map((pt) => this.project(pt));
    g.beginPath();
    g.moveTo(pts[0].px, pts[0].py);
    for (const p of pts.slice(1)) g.lineTo(p.px, p.py);
    g.closePath();
    g.fillPath();
    g.strokePath();
    this.clipToChrome(g);
    this.root.add(g);
  }

  private drawWaterLabels(): void {
    if (this.framed) return;
    const style = { fontFamily: FONT, fontSize: "11px", color: "#8ec4e8", fontStyle: "bold" as const };
    for (const label of PENINSULA_WATER_LABELS) {
      const { px, py } = this.project(label);
      this.root.add(this.scene.add.text(px, py, label.text, style).setOrigin(0.5));
    }
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

  private plateSource(): { width?: number; height?: number } | null {
    if (!this.scene.textures.exists("ui-select-map")) return null;
    return this.scene.textures.get("ui-select-map").getSourceImage() as { width?: number; height?: number };
  }

  private hasPlateArt(): boolean {
    const src = this.plateSource();
    return Boolean(src?.width && src.width >= 8);
  }

  private clipToChrome(target: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics): void {
    const mask = this.scene.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillEllipse(this.rect.x, this.rect.y, this.rect.w - 16, this.rect.h - 16);
    mask.setVisible(false);
    this.plateMask = mask;
    target.setMask(mask.createGeometryMask());
  }
}
