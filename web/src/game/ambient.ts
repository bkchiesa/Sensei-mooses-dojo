import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config";
import type { StageAmbientKind, StageDef } from "../data/catalog";

type LayerName = "sky" | "far" | "mid" | "master" | "near";
export type StageLayers = Partial<Record<LayerName, Phaser.GameObjects.Image>>;

export interface LayerDrift {
  x: number;
  y: number;
}

/** Read the ambient offset applied on top of locked/parallax positions. */
export function layerDrift(img?: Phaser.GameObjects.Image): LayerDrift {
  const stored = img?.getData("drift") as LayerDrift | undefined;
  return stored ?? { x: 0, y: 0 };
}

/**
 * Lightweight looping motion on background plates only.
 * Never moves `master` or `near` — those are the fight floor.
 * Drift is stored as data so FightScene parallax can add it without fighting tweens.
 */
export function startStageAmbient(scene: Phaser.Scene, stage: StageDef, layers: StageLayers): void {
  const kinds = new Set<StageAmbientKind>(stage.ambient);
  const sky = layers.sky;
  const far = layers.far;
  const mid = layers.mid;

  if (kinds.has("clouds")) {
    if (sky) drift(scene, sky, { x: 16, duration: 14000 });
    else spawnClouds(scene);
  }
  if (far && (kinds.has("trees") || kinds.has("flags"))) {
    drift(scene, far, {
      x: kinds.has("trees") ? 7 : 5,
      y: kinds.has("trees") ? 3 : 0,
      duration: kinds.has("flags") ? 4200 : 9000,
    });
  }
  if (mid && (kinds.has("water") || kinds.has("boats"))) {
    drift(scene, mid, { y: kinds.has("boats") ? 5 : 4, duration: kinds.has("boats") ? 3400 : 5200 });
    if (kinds.has("water")) {
      scene.tweens.add({
        targets: mid,
        scaleY: mid.scaleY * 1.012,
        duration: 5200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
    if (kinds.has("boats")) {
      scene.tweens.add({
        targets: mid,
        rotation: 0.01,
        duration: 3400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  } else if (kinds.has("water")) {
    waterShimmer(scene);
  }
}

function drift(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
  opts: { x?: number; y?: number; duration: number },
): void {
  const offset: LayerDrift = layerDrift(img);
  img.setData("drift", offset);
  scene.tweens.add({
    targets: offset,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    duration: opts.duration,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}

function spawnClouds(scene: Phaser.Scene): void {
  for (let i = 0; i < 3; i++) {
    const cloud = scene.add.ellipse(
      180 + i * 380,
      70 + (i % 2) * 36,
      160 + i * 20,
      36,
      0xffffff,
      0.08 + i * 0.02,
    );
    cloud.setDepth(-45);
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + 90,
      duration: 16000 + i * 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}

function waterShimmer(scene: Phaser.Scene): void {
  const band = scene.add.rectangle(
    DESIGN_WIDTH / 2,
    DESIGN_HEIGHT * 0.62,
    DESIGN_WIDTH * 1.05,
    70,
    0x7ec8e3,
    0.07,
  );
  band.setDepth(-12);
  scene.tweens.add({
    targets: band,
    alpha: 0.14,
    scaleX: 1.04,
    duration: 2800,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}
