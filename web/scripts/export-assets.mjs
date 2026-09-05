#!/usr/bin/env node
/**
 * Copy playable PNGs from the native asset catalog into web/public/assets.
 *
 * Source of truth: SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png
 * Extra NN landmark stages (Batch A–C) stay native-only for now — arcade uses stage1–3.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = path.join(root, "SenseiMoosesDojo/Assets.xcassets");
const out = path.join(root, "web/public/assets");

function keep(filename) {
  return (
    filename.startsWith("moose_") ||
    filename.startsWith("fighter_") ||
    filename.startsWith("boss_") ||
    filename.startsWith("stage1_") ||
    filename.startsWith("stage2_") ||
    filename.startsWith("stage3_") ||
    /^ult_.+_00\.png$/.test(filename) ||
    filename.startsWith("ult_austin_") ||
    filename.startsWith("ult_senseiMoose_")
  );
}

if (!fs.existsSync(catalog)) {
  console.error("Missing asset catalog:", catalog);
  process.exit(1);
}

fs.mkdirSync(out, { recursive: true });
for (const name of fs.readdirSync(out)) {
  if (name.endsWith(".png") || name === "manifest.json") {
    fs.unlinkSync(path.join(out, name));
  }
}

const copied = [];
for (const dir of fs.readdirSync(catalog)) {
  if (!dir.endsWith(".imageset")) continue;
  const folder = path.join(catalog, dir);
  if (!fs.statSync(folder).isDirectory()) continue;
  for (const file of fs.readdirSync(folder)) {
    if (!file.endsWith(".png") || !keep(file)) continue;
    fs.copyFileSync(path.join(folder, file), path.join(out, file));
    copied.push(file);
  }
}

copied.sort();
fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      source: "SenseiMoosesDojo/Assets.xcassets",
      note: "Exported by web/scripts/export-assets.mjs. Names match imageset PNG filenames.",
      count: copied.length,
      files: copied,
    },
    null,
    2,
  ),
);

console.log(`Exported ${copied.length} PNGs from Assets.xcassets → web/public/assets`);
