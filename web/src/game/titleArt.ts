import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config";

/**
 * Drop-in Title splash. Pixel can land files later — Boot/Title already
 * look these keys up and fall back to the current moose + stage wash.
 *
 *   dojo-art/finals/ui/title/dojo-interior.png  →  title-dojo-interior
 *   dojo-art/finals/ui/title/logo.png           →  title-logo
 *   optional spritesheet / atlas later for an animated logo
 */
export const TITLE_ART = {
  interior: "title-dojo-interior",
  logo: "title-logo",
  moose: "moose_title_idle",
} as const;

export const TITLE_ART_URLS: Record<keyof typeof TITLE_ART, string> = {
  interior: "assets/ui/title/dojo-interior.png",
  logo: "assets/ui/title/logo.png",
  moose: "assets/moose_title_idle.png",
};

export function textureReady(scene: Phaser.Scene, key: string): boolean {
  try {
    if (!scene.textures.exists(key)) return false;
    const src = scene.textures.get(key).getSourceImage() as { width?: number };
    return Boolean(src?.width && src.width > 1);
  } catch {
    return false;
  }
}

/** Full-bleed interior plate when the locked dojo shot is present. */
export function drawTitleInterior(scene: Phaser.Scene): boolean {
  if (!textureReady(scene, TITLE_ART.interior)) return false;
  scene.add
    .image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, TITLE_ART.interior)
    .setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT)
    .setDepth(-20);
  return true;
}

/** Centered logo. Swap `title-logo` for a spritesheet later and play here. */
export function drawTitleLogo(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Image | null {
  if (!textureReady(scene, TITLE_ART.logo)) return null;
  const logo = scene.add.image(x, y, TITLE_ART.logo).setDepth(8);
  const maxW = DESIGN_WIDTH * 0.72;
  const maxH = DESIGN_HEIGHT * 0.28;
  const s = Math.min(maxW / logo.width, maxH / logo.height, 1);
  logo.setScale(s);
  return logo;
}
