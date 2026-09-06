import Phaser from "phaser";

/**
 * Punch / kick HUD plates (Pixel lock 2026-09-06).
 *
 *   dojo-art/finals/ui/pad-buttons/punch_up.png
 *   dojo-art/finals/ui/pad-buttons/punch_down.png
 *   dojo-art/finals/ui/pad-buttons/kick_up.png
 *   dojo-art/finals/ui/pad-buttons/kick_down.png
 *
 * Export writes `assets/ui/pad-buttons/pad-buttons.json` listing files that
 * exist (`pad_buttons_contact.png` is skipped). Boot only queues those URLs.
 * Fight HUD falls back to scaled circles + press tint if a pair is missing.
 */
export const ACTION_BTN_MANIFEST_KEY = "ui-pad-buttons-manifest";
export const ACTION_BTN_MANIFEST_URL = "assets/ui/pad-buttons/pad-buttons.json";

const ACTION_BTN_DIR = "assets/ui/pad-buttons";

export type ActionFace = "punch" | "kick";
export type ActionPose = "up" | "down";

export function actionButtonKey(face: ActionFace, pose: ActionPose): string {
  return `pad_btn_${face}_${pose}`;
}

export interface ActionButtonManifest {
  punchUp?: string | null;
  punchDown?: string | null;
  kickUp?: string | null;
  kickDown?: string | null;
  files?: string[];
}

function listedActionFiles(raw: unknown): Set<string> {
  const files = new Set<string>();
  if (!raw || typeof raw !== "object") return files;
  const m = raw as ActionButtonManifest;
  if (Array.isArray(m.files)) {
    for (const file of m.files) if (typeof file === "string" && !/contact/i.test(file)) files.add(file);
  }
  for (const value of [m.punchUp, m.punchDown, m.kickUp, m.kickDown]) {
    if (typeof value === "string") files.add(value);
  }
  return files;
}

function plateFile(face: ActionFace, pose: ActionPose): string {
  return `${face}_${pose}.png`;
}

/** Only queue punch/kick PNGs the export manifest says are on disk. */
export function actionButtonQueueFromManifest(raw: unknown): { key: string; url: string }[] {
  const files = listedActionFiles(raw);
  const queue: { key: string; url: string }[] = [];
  for (const face of ["punch", "kick"] as const) {
    for (const pose of ["up", "down"] as const) {
      const file = plateFile(face, pose);
      if (!files.has(file)) continue;
      queue.push({ key: actionButtonKey(face, pose), url: `${ACTION_BTN_DIR}/${file}` });
    }
  }
  return queue;
}

export function optionalActionButtonKeys(): string[] {
  const keys = [ACTION_BTN_MANIFEST_KEY];
  for (const face of ["punch", "kick"] as const) {
    for (const pose of ["up", "down"] as const) keys.push(actionButtonKey(face, pose));
  }
  return keys;
}

function textureReady(scene: Phaser.Scene, key: string): boolean {
  try {
    if (!scene.textures.exists(key)) return false;
    const src = scene.textures.get(key).getSourceImage() as { width?: number };
    return Boolean(src?.width && src.width > 1);
  } catch {
    return false;
  }
}

export function actionButtonTexture(scene: Phaser.Scene, face: ActionFace, pose: ActionPose): string | null {
  const preferred = actionButtonKey(face, pose);
  if (textureReady(scene, preferred)) return preferred;
  if (pose === "down") {
    const up = actionButtonKey(face, "up");
    if (textureReady(scene, up)) return up;
  }
  return null;
}

export function hasActionButtonArt(scene: Phaser.Scene, face: ActionFace): boolean {
  return actionButtonTexture(scene, face, "up") !== null || actionButtonTexture(scene, face, "down") !== null;
}
