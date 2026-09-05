#!/usr/bin/env node
/**
 * Copy playable PNGs from the native asset catalog into web/public/assets.
 *
 * Source of truth: SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png
 * Arcade + landmark stages copy full parallax (sky / far / mid / master / near).
 * Fighter folders: catalog idle, then dojo-art/finals/fighters, then web/fighter-sheets overlay.
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
const uiSelectConcepts = path.join(root, "dojo-art/concepts/ui/select");
const uiSelectOut = path.join(out, "ui/select");
const dojoFightersSrc = path.join(root, "dojo-art/finals/fighters");
const mooseSheetIdle = path.join(fighterSheets, "senseiMoose", "idle_00.png");

const ANIM_NAMES = ["idle", "punch", "kick", "jump", "block", "crouch", "sweep"];
const STARTER_IDS = ["matt", "simon", "rich", "amanda", "jb"];
const BOSS_IDS = [
  "misty",
  "lucas",
  "chris",
  "christiano",
  "dakota",
  "johnk",
  "finley",
  "hudson",
  "michael",
  "kasey",
  "jaylen",
  "amiyr",
  "shaun",
  "ryan",
  "austin",
  "senseiMoose",
];
const ROSTER_IDS = [...STARTER_IDS, ...BOSS_IDS];

function listPixelFrames(dir, id) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const frames = [];
  const prefixed = new RegExp(`^(?:fighter|boss)_${id}_(idle|punch|kick|jump|block|crouch|sweep)_(\\d+)\\.png$`, "i");
  const short = /^(idle|punch|kick|jump|block|crouch|sweep)_(\d+)\.png$/i;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".png") || /contact/i.test(file)) continue;
    const match = prefixed.exec(file) || short.exec(file);
    if (!match) continue;
    frames.push({ destName: `${match[1].toLowerCase()}_${match[2]}.png`, from: path.join(dir, file) });
  }
  return frames;
}

function ingestPixelFrames(id, destDir) {
  const aliases = id === "senseiMoose" ? ["moose", "senseiMoose"] : [id];
  const latest = new Map();
  for (const alias of aliases) {
    for (const dir of [
      path.join(dojoFightersSrc, alias),
      path.join(dojoFightersSrc, alias, "frames"),
      path.join(fighterSheets, alias),
    ]) {
      for (const frame of listPixelFrames(dir, alias)) latest.set(frame.destName, frame.from);
    }
  }
  for (const [destName, from] of latest) {
    fs.copyFileSync(from, path.join(destDir, destName));
  }
  return latest;
}

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
for (const id of ROSTER_IDS) fighterIds.add(id);

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
  const pixel = ingestPixelFrames(id, destDir);
  const idleOut = path.join(destDir, "idle_00.png");
  if (fs.existsSync(idleOut)) {
    if (id === "senseiMoose") {
      fs.copyFileSync(idleOut, path.join(out, "boss_senseiMoose_idle_00.png"));
      copied.push("boss_senseiMoose_idle_00.png");
    } else if (pixel.has("idle_00.png")) {
      const catalogName = fs.existsSync(path.join(out, `fighter_${id}_idle_00.png`))
        ? `fighter_${id}_idle_00.png`
        : `boss_${id}_idle_00.png`;
      fs.copyFileSync(idleOut, path.join(out, catalogName));
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
  note: "Pixel frames from dojo-art/finals/fighters/<id>/ (fighter_<id>_<anim>_NN.png) and web/fighter-sheets/<id>/<anim>_NN.png. Missing anims stretch idle.",
  pixelStatus: ROSTER_IDS.every((id) => ANIM_NAMES.every((anim) => (fighters[id]?.[anim]?.length ?? 0) > 0))
    ? "full-roster"
    : STARTER_IDS.every((id) => (fighters[id]?.punch?.length ?? 0) > 0)
      ? "starters"
      : "partial",
  fighters,
};

fs.writeFileSync(path.join(fightersOut, "index.json"), JSON.stringify(index, null, 2));
fs.writeFileSync(
  path.join(fightersOut, "README.md"),
  `# Fighter animation drop-in

Generated. Sources, in overlay order:

1. Catalog idle placeholder
2. \`dojo-art/finals/fighters/<id>/fighter_<id>_<anim>_NN.png\`
3. \`web/fighter-sheets/<id>/<anim>_NN.png\` (wins)

Full roster (starters + bosses + Sensei Moose) ships idle/punch/kick/jump/block/crouch/sweep from fighter-sheets and dojo-art finals. Missing anims stretch idle.
`,
);

fs.rmSync(uiSelectOut, { recursive: true, force: true });
fs.mkdirSync(uiSelectOut, { recursive: true });
function copySelectDir(src) {
  if (!fs.existsSync(src)) return;
  for (const file of fs.readdirSync(src)) {
    if (file === "README.md" || file === "plate.json") continue;
    fs.copyFileSync(path.join(src, file), path.join(uiSelectOut, file));
  }
}
copySelectDir(uiSelectConcepts);
copySelectDir(uiSelectSrc);
const plateCandidates = ["hampton-roads-map.png", "select_map_plate.png", "select-map-plate.png", "hampton-roads-map.svg"];
const screenCandidates = ["select_screen.png", "select-screen.png"];
const plateFile = plateCandidates.find((name) => fs.existsSync(path.join(uiSelectOut, name))) ?? null;
const screenFile = screenCandidates.find((name) => fs.existsSync(path.join(uiSelectOut, name))) ?? null;
fs.writeFileSync(
  path.join(uiSelectOut, "plate.json"),
  JSON.stringify(
    {
      file: plateFile,
      screen: screenFile,
      bounds: { lonMin: -76.76, lonMax: -76.28, latMin: 36.955, latMax: 37.3 },
      projection: "equirectangular",
      standardParallelDeg: 37.1275,
      platePx: { width: 1111, height: 1000 },
      uv: "u=(lon-lonMin)/(lonMax-lonMin) west→east; v=1-(lat-latMin)/(latMax-latMin) north→south",
      note: "Finals in dojo-art/finals/ui/select overwrite concepts. Code draws landmark dots. PNG plate replaces the SVG placeholder without moving dots.",
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
