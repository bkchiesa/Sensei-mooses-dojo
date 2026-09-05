#!/usr/bin/env node
/**
 * Copy playable PNGs from the native asset catalog into web/public/assets.
 *
 * Source of truth: SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png
 * Arcade + landmark stages copy full parallax (sky / far / mid / master / near).
 * Fighter drop-in folders get idle placeholders until Pixel delivers full sheets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = path.join(root, "SenseiMoosesDojo/Assets.xcassets");
const out = path.join(root, "web/public/assets");
const fightersOut = path.join(out, "fighters");
const fighterSheets = path.join(root, "web/fighter-sheets");
const uiSelectSrc = path.join(root, "dojo-art/finals/ui/select");
const uiSelectOut = path.join(out, "ui/select");
const mooseSheetIdle = path.join(fighterSheets, "senseiMoose", "idle_00.png");

const ANIM_NAMES = ["idle", "punch", "kick", "jump", "block", "crouch", "sweep"];

function keep(filename) {
  if (filename.startsWith("moose_") || filename.startsWith("fighter_") || filename.startsWith("boss_")) return true;
  if (filename.startsWith("stage1_") || filename.startsWith("stage2_") || filename.startsWith("stage3_")) return true;
  if (filename.startsWith("stage_")) return true;
  if (/^ult_.+_00\.png$/.test(filename) || filename.startsWith("ult_austin_") || filename.startsWith("ult_senseiMoose_")) {
    return true;
  }
  return false;
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
fs.rmSync(fightersOut, { recursive: true, force: true });
fs.mkdirSync(fightersOut, { recursive: true });

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

const fighterIds = new Set();
for (const file of copied) {
  const starter = /^fighter_([a-z0-9]+)_idle_00\.png$/i.exec(file);
  const boss = /^boss_([a-z0-9]+)_idle_00\.png$/i.exec(file);
  if (starter) fighterIds.add(starter[1]);
  if (boss) fighterIds.add(boss[1]);
}
fighterIds.add("senseiMoose");

const fighters = {};
for (const id of [...fighterIds].sort()) {
  const destDir = path.join(fightersOut, id);
  fs.mkdirSync(destDir, { recursive: true });
  const source =
    id === "senseiMoose"
      ? fs.existsSync(mooseSheetIdle)
        ? mooseSheetIdle
        : path.join(out, "moose_title_idle.png")
      : fs.existsSync(path.join(out, `fighter_${id}_idle_00.png`))
        ? path.join(out, `fighter_${id}_idle_00.png`)
        : path.join(out, `boss_${id}_idle_00.png`);
  const dest = path.join(destDir, "idle_00.png");
  if (fs.existsSync(source)) fs.copyFileSync(source, dest);
  if (id === "senseiMoose" && fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(out, "boss_senseiMoose_idle_00.png"));
    copied.push("boss_senseiMoose_idle_00.png");
  }

  const overlay = path.join(fighterSheets, id);
  if (fs.existsSync(overlay) && fs.statSync(overlay).isDirectory()) {
    for (const file of fs.readdirSync(overlay)) {
      if (!file.endsWith(".png")) continue;
      fs.copyFileSync(path.join(overlay, file), path.join(destDir, file));
    }
  }

  const listed = {};
  if (fs.existsSync(destDir)) {
    const files = fs.readdirSync(destDir).filter((f) => f.endsWith(".png")).sort();
    for (const anim of ANIM_NAMES) {
      const frames = files.filter((f) => new RegExp(`^${anim}_\\d+\\.png$`).test(f));
      if (frames.length) listed[anim] = frames;
    }
  }
  fighters[id] = listed;
}

const index = {
  convention: "web/public/assets/fighters/<id>/<anim>_00.png",
  anims: ANIM_NAMES,
  note: "Placeholders until Pixel drops punch/kick/jump/block/crouch/sweep sheets. Number frames _00, _01, … and re-export.",
  pixelStatus: "waiting",
  fighters,
};

fs.writeFileSync(path.join(fightersOut, "index.json"), JSON.stringify(index, null, 2));
fs.writeFileSync(
  path.join(fightersOut, "README.md"),
  `# Fighter animation drop-in

Pixel: drop frames here, then run \`npm run export-assets\` (or just keep files that match this layout if you change the exporter).

\`\`\`
web/public/assets/fighters/<id>/
  idle_00.png
  punch_00.png
  kick_00.png
  jump_00.png
  block_00.png
  crouch_00.png
  sweep_00.png
\`\`\`

Ids match the roster (\`matt\`, \`misty\`, \`senseiMoose\`, …). Extra frames: \`<anim>_01.png\`, \`_02\`, … listed in \`index.json\`.

Until those files exist, the web game stretches the idle pose for every anim.
`,
);

fs.rmSync(uiSelectOut, { recursive: true, force: true });
fs.mkdirSync(uiSelectOut, { recursive: true });
if (fs.existsSync(uiSelectSrc)) {
  for (const file of fs.readdirSync(uiSelectSrc)) {
    if (file === "README.md" || file === "plate.json") continue;
    fs.copyFileSync(path.join(uiSelectSrc, file), path.join(uiSelectOut, file));
  }
}
const plateCandidates = ["hampton-roads-map.png", "select_map_plate.png", "hampton-roads-map.svg"];
const plateFile = plateCandidates.find((name) => fs.existsSync(path.join(uiSelectOut, name))) ?? null;
fs.writeFileSync(
  path.join(uiSelectOut, "plate.json"),
  JSON.stringify(
    {
      file: plateFile,
      bounds: { lonMin: -76.76, lonMax: -76.28, latMin: 36.955, latMax: 37.3 },
      projection: "equirectangular",
      standardParallelDeg: 37.1275,
      platePx: { width: 1111, height: 1000 },
      uv: "u=(lon-lonMin)/(lonMax-lonMin) west→east; v=1-(lat-latMin)/(latMax-latMin) north→south",
      note: "Full image = full bounds, no padding. Code draws landmark dots. PNG replaces the SVG placeholder without moving dots. Keep in sync with web/src/data/peninsula.ts.",
    },
    null,
    2,
  ),
);

copied.sort();
fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      source: "SenseiMoosesDojo/Assets.xcassets",
      note: "Exported by web/scripts/export-assets.mjs. Names match imageset PNG filenames.",
      count: copied.length,
      files: copied,
      fighters: Object.keys(fighters),
    },
    null,
    2,
  ),
);

console.log(`Exported ${copied.length} PNGs + ${Object.keys(fighters).length} fighter folders → web/public/assets`);
