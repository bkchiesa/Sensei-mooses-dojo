#!/usr/bin/env node
/**
 * Copy playable PNGs from the native asset catalog into web/public/assets.
 *
 * Source of truth: SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png
 * Arcade + landmark stages copy full parallax (sky / far / mid / master / near).
 * Fighter folders: catalog idle, then dojo-art/finals/fighters, then web/fighter-sheets overlay.
 */
import { spawnSync } from "node:child_process";
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
const uiTitleSrc = path.join(root, "dojo-art/finals/ui/title");
const uiTitleOut = path.join(out, "ui/title");
const uiUltSrc = path.join(root, "dojo-art/finals/ui/ult-button");
const uiUltOut = path.join(out, "ui/ult-button");
const uiPadSrc = path.join(root, "dojo-art/finals/ui/pad-buttons");
const uiPadOut = path.join(out, "ui/pad-buttons");
const uiVictorySrc = path.join(root, "dojo-art/finals/ui/victory");
const uiVictoryOut = path.join(out, "ui/victory");
const audioSrc = path.join(root, "dojo-art/finals/audio");
const audioShared = "/workspace/dojo-audio";
const audioOut = path.join(out, "audio");
const AUDIO_EXTS = [".ogg", ".mp3", ".wav", ".m4a"];
const AUDIO_ALIAS = {
  punch: "punch_miss",
  kick: "kick_miss",
  punch_whoosh: "punch_miss",
  kick_whoosh: "kick_miss",
  whoosh: "punch_miss",
  impact: "hit_light",
  smash: "hit_heavy",
  hit: "hit_light",
  land_thud: "land",
  ult: "ult_activate",
  ultimate: "ult_activate",
  ult_ready: "ult_ready_charge",
  ultimate_ready: "ult_ready_charge",
  ultimate_activate: "ult_activate",
  ultimate_impact: "ult_impact",
  ko_sting: "ko",
  announce_fight: "announcer_fight",
  countdown: "fight_countdown_1",
  ui_move: "menu_move",
  ui_confirm: "menu_confirm",
  menu: "menu_confirm",
  select: "character_select",
  char_select: "character_select",
  locked: "character_locked",
  char_locked: "character_locked",
  win: "match_win",
  lose: "match_lose",
  next: "next_fight_button",
  next_fight: "next_fight_button",
  unlock: "unlock_boss",
  fight_a: "fight_a_loop",
  fight_b: "fight_b_loop",
  fight_c: "fight_c_loop",
  title: "title_attract_loop",
  title_attract: "title_attract_loop",
  title_loop: "title_attract_loop",
  victory: "victory_sting",
  defeat: "defeat_sting",
  welcome: "splash_welcome",
  vo_welcome: "splash_welcome",
  vo_fight: "announcer_fight",
};
const BGM_LOOPS = new Set(["title_attract_loop", "fight_a_loop", "fight_b_loop", "fight_c_loop"]);
const BGM_STEMS = new Set([...BGM_LOOPS, "victory_sting", "defeat_sting"]);
const SKIP_AUDIO_DIRS = new Set(["masters", "listen", "__pycache__"]);
const SKIP_AUDIO_STEMS = new Set(["select_loop"]); // Brandon lock: play fight_a_loop, not this byte copy
const dojoFightersSrc = path.join(root, "dojo-art/finals/fighters");
const dojoUltsSrc = path.join(root, "dojo-art/finals/ultimates");
const ultsOut = path.join(out, "ultimates");
const mooseSheetIdle = path.join(fighterSheets, "senseiMoose", "idle_00.png");

const CORE_ANIM_NAMES = ["idle", "punch", "kick", "jump", "block", "crouch", "sweep"];
const OPTIONAL_ANIM_NAMES = ["hit", "defeat", "defeated"];
const ANIM_NAMES = [...CORE_ANIM_NAMES, ...OPTIONAL_ANIM_NAMES];
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
  const prefixed = new RegExp(
    `^(?:fighter|boss)_${id}_(idle|punch|kick|jump|block|crouch|sweep|hit|defeat|defeated)_(\\d+)\\.png$`,
    "i",
  );
  const short = /^(idle|punch|kick|jump|block|crouch|sweep|hit|defeat|defeated)_(\d+)\.png$/i;
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
  // Catalog `_00` only — locked splash sheets overlay from dojo-art/finals/ultimates.
  if (/^ult_[a-z0-9]+_00\.png$/i.test(filename)) return true;
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
  pixelStatus: ROSTER_IDS.every((id) => CORE_ANIM_NAMES.every((anim) => (fighters[id]?.[anim]?.length ?? 0) > 0))
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

Full roster (starters + bosses + Sensei Moose) ships idle/punch/kick/jump/block/crouch/sweep from fighter-sheets and dojo-art finals. Optional hit / defeat / defeated frames copy when present. Missing anims stretch idle.
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
const plateCandidates = [
  "select-map-plate-C.png",
  "select_map_plate.png",
  "select-map-plate.png",
  "hampton-roads-map.png",
  "hampton-roads-map.svg",
];
const screenCandidates = ["select-screen-C.png", "select_screen.png", "select-screen.png"];
const plateFile = plateCandidates.find((name) => fs.existsSync(path.join(uiSelectOut, name))) ?? null;
const screenFile = screenCandidates.find((name) => fs.existsSync(path.join(uiSelectOut, name))) ?? null;
const framedPlate = Boolean(
  plateFile && /select-map-plate-C|select_map_plate|select-map-plate/i.test(plateFile) && plateFile.endsWith(".png"),
);
if (fs.existsSync(path.join(uiSelectSrc, "select-map-plate-C.png")) && plateFile === "hampton-roads-map.svg") {
  console.error("Locked select-map-plate-C.png exists but export chose the SVG placeholder.");
  process.exit(1);
}
fs.writeFileSync(
  path.join(uiSelectOut, "plate.json"),
  JSON.stringify(
    {
      file: plateFile,
      screen: screenFile,
      variant: plateFile === "select-map-plate-C.png" || screenFile === "select-screen-C.png" ? "C" : null,
      framed: framedPlate,
      selection: "interactive-portraits",
      bounds: { lonMin: -76.76, lonMax: -76.28, latMin: 36.955, latMax: 37.3 },
      projection: "equirectangular",
      standardParallelDeg: 37.1275,
      platePx: framedPlate ? { width: 1920, height: 1080 } : { width: 1111, height: 1000 },
      mapRectPx: framedPlate ? { x: 476.65, y: 152.15, w: 976.62, h: 864.18 } : null,
      uv: "u=(lon-lonMin)/(lonMax-lonMin) west→east; v=1-(lat-latMin)/(latMax-latMin) north→south",
      note: "Map plate C is the peninsula. Select UI is live unlocked portraits — not select-screen-C. Code draws geo dots.",
    },
    null,
    2,
  ),
);
console.log(`Select UI → plate=${plateFile ?? "none"} (portraits are live slots; screen C is not the select UI)`);

fs.rmSync(uiTitleOut, { recursive: true, force: true });
if (fs.existsSync(uiTitleSrc)) {
  fs.mkdirSync(uiTitleOut, { recursive: true });
  for (const file of fs.readdirSync(uiTitleSrc)) {
    if (file === "README.md" || file === "title.json") continue;
    fs.copyFileSync(path.join(uiTitleSrc, file), path.join(uiTitleOut, file));
  }
}
const titlePngs = fs.existsSync(uiTitleOut)
  ? fs.readdirSync(uiTitleOut).filter((file) => file.endsWith(".png")).sort()
  : [];
const titleFrames = [];
for (let i = 0; i < 8; i += 1) {
  const name = `title_logo_${String(i).padStart(2, "0")}.png`;
  if (titlePngs.includes(name)) titleFrames.push(name);
}
const titleBg = titlePngs.includes("title_bg_dojo.png")
  ? "title_bg_dojo.png"
  : titlePngs.includes("dojo-interior.png")
    ? "dojo-interior.png"
    : null;
const titleHero = titlePngs.includes("title_logo_hero.png")
  ? "title_logo_hero.png"
  : titlePngs.includes("logo.png")
    ? "logo.png"
    : null;
if (fs.existsSync(uiTitleOut)) {
  fs.writeFileSync(
    path.join(uiTitleOut, "title.json"),
    JSON.stringify(
      {
        bg: titleBg,
        hero: titleHero,
        frames: titleFrames,
        files: titlePngs,
        note: "Locked splash filenames. Boot only preloads keys listed here.",
      },
      null,
      2,
    ),
  );
}
console.log(`Title UI → bg=${titleBg ?? "none"} hero=${titleHero ?? "none"} frames=${titleFrames.length}`);

fs.rmSync(uiUltOut, { recursive: true, force: true });
if (fs.existsSync(uiUltSrc)) {
  fs.mkdirSync(uiUltOut, { recursive: true });
  for (const file of fs.readdirSync(uiUltSrc)) {
    if (file === "README.md" || file === "ult-button.json" || /contact/i.test(file)) continue;
    if (file.endsWith(".png")) fs.copyFileSync(path.join(uiUltSrc, file), path.join(uiUltOut, file));
  }
}
const ultPngs = fs.existsSync(uiUltOut)
  ? fs.readdirSync(uiUltOut).filter((file) => file.endsWith(".png")).sort()
  : [];
const ultReady = [];
for (let i = 0; i < 8; i += 1) {
  const name = `ult_btn_ready_${String(i).padStart(2, "0")}.png`;
  if (ultPngs.includes(name)) ultReady.push(name);
}
const ultBolt = [];
for (let i = 0; i < 2; i += 1) {
  const name = `ult_btn_bolt_${String(i).padStart(2, "0")}.png`;
  if (ultPngs.includes(name)) ultBolt.push(name);
}
const ultIdle = ultPngs.includes("ult_btn_idle.png") ? "ult_btn_idle.png" : null;
if (fs.existsSync(uiUltOut)) {
  fs.writeFileSync(
    path.join(uiUltOut, "ult-button.json"),
    JSON.stringify(
      {
        idle: ultIdle,
        ready: ultReady,
        bolt: ultBolt,
        files: ultPngs,
        note: "Locked HUD filenames. Boot only preloads keys listed here.",
      },
      null,
      2,
    ),
  );
}
console.log(`Ult button UI → idle=${ultIdle ?? "none"} ready=${ultReady.length} bolt=${ultBolt.length}`);

// Punch/kick 3D unpressed/pressed pairs (Pixel lock). Skip contact sheets.
fs.rmSync(uiPadOut, { recursive: true, force: true });
if (fs.existsSync(uiPadSrc)) {
  fs.mkdirSync(uiPadOut, { recursive: true });
  for (const file of fs.readdirSync(uiPadSrc)) {
    if (file === "README.md" || file === "pad-buttons.json" || /contact/i.test(file)) continue;
    if (file.endsWith(".png")) fs.copyFileSync(path.join(uiPadSrc, file), path.join(uiPadOut, file));
  }
}
const padPngs = fs.existsSync(uiPadOut)
  ? fs.readdirSync(uiPadOut).filter((file) => file.endsWith(".png")).sort()
  : [];
const punchUp = padPngs.includes("punch_up.png") ? "punch_up.png" : null;
const punchDown = padPngs.includes("punch_down.png") ? "punch_down.png" : null;
const kickUp = padPngs.includes("kick_up.png") ? "kick_up.png" : null;
const kickDown = padPngs.includes("kick_down.png") ? "kick_down.png" : null;
if (fs.existsSync(uiPadOut)) {
  fs.writeFileSync(
    path.join(uiPadOut, "pad-buttons.json"),
    JSON.stringify(
      {
        punchUp,
        punchDown,
        kickUp,
        kickDown,
        files: padPngs,
        note: "Locked punch/kick up/down plates. Boot only preloads keys listed here.",
      },
      null,
      2,
    ),
  );
}
console.log(`Pad buttons UI → punch=${punchUp ?? "none"}/${punchDown ?? "none"} kick=${kickUp ?? "none"}/${kickDown ?? "none"}`);

// Victory dojo plate — bg only; never copy layout_guide / README.
fs.rmSync(uiVictoryOut, { recursive: true, force: true });
if (fs.existsSync(uiVictorySrc)) {
  fs.mkdirSync(uiVictoryOut, { recursive: true });
  for (const file of fs.readdirSync(uiVictorySrc)) {
    if (file === "README.md" || file === "victory.json" || /guide|contact/i.test(file)) continue;
    if (file === "victory_bg_dojo.png") fs.copyFileSync(path.join(uiVictorySrc, file), path.join(uiVictoryOut, file));
  }
}
const victoryPngs = fs.existsSync(uiVictoryOut)
  ? fs.readdirSync(uiVictoryOut).filter((file) => file.endsWith(".png")).sort()
  : [];
const victoryBg = victoryPngs.includes("victory_bg_dojo.png") ? "victory_bg_dojo.png" : null;
if (fs.existsSync(uiVictoryOut)) {
  fs.writeFileSync(
    path.join(uiVictoryOut, "victory.json"),
    JSON.stringify(
      {
        bg: victoryBg,
        files: victoryPngs,
        note: "Victory backdrop only. Layout guide is artist-only and is not exported.",
      },
      null,
      2,
    ),
  );
}
console.log(`Victory UI → bg=${victoryBg ?? "none"}`);

function kindForStem(stem) {
  if (BGM_STEMS.has(stem) || /_loop$/.test(stem) || /_sting$/.test(stem)) return "bgm";
  if (stem.startsWith("vo_") || stem.startsWith("grunt_") || stem.startsWith("announcer_") || stem === "splash_welcome") {
    return "vo";
  }
  return "sfx";
}

function cueStemFromPath(full, ext) {
  const parts = full.split(path.sep);
  const base = path.basename(full, ext);
  const gi = parts.lastIndexOf("grunts");
  if (gi >= 0 && parts[gi + 1]) {
    const flavor = parts[gi + 1];
    const action = base.replace(/^grunt_/, "");
    return `grunt_${flavor}_${action}`;
  }
  return AUDIO_ALIAS[base] ?? base;
}

function collectAudioFiles(dir, into) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (!SKIP_AUDIO_DIRS.has(name) && !name.startsWith(".")) collectAudioFiles(full, into);
      continue;
    }
    const ext = path.extname(name).toLowerCase();
    if (!AUDIO_EXTS.includes(ext)) continue;
    const canon = cueStemFromPath(full, ext);
    if (SKIP_AUDIO_STEMS.has(canon) || SKIP_AUDIO_STEMS.has(path.basename(name, ext))) continue;
    const kind = kindForStem(canon);
    const rec = into.get(canon) ?? { kind, files: new Map() };
    rec.kind = kind;
    rec.files.set(ext, full);
    into.set(canon, rec);
  }
}

function transcodeMp3(from, dest) {
  try {
    const result = spawnSync("ffmpeg", ["-y", "-i", from, "-c:a", "libmp3lame", "-b:a", "96k", dest], {
      stdio: "ignore",
    });
    return result.status === 0 && fs.existsSync(dest);
  } catch {
    return false;
  }
}

function ingestAudio() {
  fs.rmSync(audioOut, { recursive: true, force: true });
  fs.mkdirSync(audioOut, { recursive: true });
  const collected = new Map();
  // Tempo shared box wins, then in-repo finals (and a flat finals/audio drop).
  collectAudioFiles(audioSrc, collected);
  collectAudioFiles(audioShared, collected);
  const cues = {};
  let copiedAudio = 0;
  let source = fs.existsSync(audioShared) ? audioShared : "dojo-art/finals/audio";
  if (fs.existsSync(audioShared)) source = `${audioShared} overlaying dojo-art/finals/audio`;

  for (const [stem, rec] of [...collected.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const destDir = path.join(audioOut, rec.kind);
    fs.mkdirSync(destDir, { recursive: true });
    const urls = [];
    for (const [ext, from] of rec.files) {
      const destName = `${stem}${ext}`;
      fs.copyFileSync(from, path.join(destDir, destName));
      copiedAudio += 1;
      urls.push(`assets/audio/${rec.kind}/${destName}`);
    }
    if (!rec.files.has(".mp3")) {
      const src = rec.files.get(".ogg") ?? rec.files.get(".wav") ?? rec.files.get(".m4a");
      if (src) {
        const dest = path.join(destDir, `${stem}.mp3`);
        if (transcodeMp3(src, dest)) {
          copiedAudio += 1;
          urls.push(`assets/audio/${rec.kind}/${stem}.mp3`);
        }
      }
    }
    urls.sort((a, b) => {
      const rank = (u) => (u.endsWith(".ogg") ? 0 : u.endsWith(".mp3") ? 1 : 2);
      return rank(a) - rank(b);
    });
    cues[stem] = { kind: rec.kind, loop: BGM_LOOPS.has(stem), urls };
  }

  fs.writeFileSync(
    path.join(audioOut, "manifest.json"),
    JSON.stringify(
      {
        source,
        note: "Boot only preloads cues listed here. Safari uses mp3 when ogg is unavailable.",
        cues,
      },
      null,
      2,
    ),
  );
  console.log(`Audio → ${Object.keys(cues).length} cues (${copiedAudio} files) from ${source}`);
}

function ingestUltimates() {
  fs.rmSync(ultsOut, { recursive: true, force: true });
  fs.mkdirSync(ultsOut, { recursive: true });
  const skip = /contact|prelock|pre_splash|_key|sheet/i;
  const listed = {};
  let splashCount = 0;
  let fxCount = 0;

  for (const id of ROSTER_IDS) {
    const aliases = id === "senseiMoose" ? ["moose", "senseiMoose"] : [id];
    const destDir = path.join(ultsOut, id);
    fs.mkdirSync(destDir, { recursive: true });
    const frames = new Map();
    const fx = new Map();

    for (const alias of aliases) {
      const srcDir = path.join(dojoUltsSrc, alias);
      if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) continue;
      const splashRe = new RegExp(`^ult_${alias}_(\\d+)\\.png$`, "i");
      for (const file of fs.readdirSync(srcDir)) {
        if (!file.endsWith(".png") || skip.test(file)) continue;
        const match = splashRe.exec(file);
        if (!match) continue;
        frames.set(`ult_${id}_${match[1]}.png`, path.join(srcDir, file));
      }
      const fxDir = path.join(srcDir, "fx");
      if (!fs.existsSync(fxDir) || !fs.statSync(fxDir).isDirectory()) continue;
      const fxRe = new RegExp(`^ult_${alias}_fx_(\\d+)\\.png$`, "i");
      for (const file of fs.readdirSync(fxDir)) {
        if (!file.endsWith(".png") || skip.test(file)) continue;
        const match = fxRe.exec(file);
        if (!match) continue;
        fx.set(`ult_${id}_fx_${match[1]}.png`, path.join(fxDir, file));
      }
    }

    const frameFiles = [...frames.keys()].sort();
    for (const name of frameFiles) {
      fs.copyFileSync(frames.get(name), path.join(destDir, name));
      splashCount += 1;
      if (/_00\.png$/i.test(name)) {
        const rootName = `ult_${id}_00.png`;
        fs.copyFileSync(frames.get(name), path.join(out, rootName));
        if (!copied.includes(rootName)) copied.push(rootName);
      }
    }

    const fxFiles = [...fx.keys()].sort();
    if (fxFiles.length) {
      const fxDest = path.join(destDir, "fx");
      fs.mkdirSync(fxDest, { recursive: true });
      for (const name of fxFiles) {
        fs.copyFileSync(fx.get(name), path.join(fxDest, name));
        fxCount += 1;
      }
    }

    listed[id] = { frames: frameFiles, fx: fxFiles };
  }

  fs.writeFileSync(
    path.join(ultsOut, "index.json"),
    JSON.stringify(
      {
        convention: "web/public/assets/ultimates/<id>/ult_<id>_NN.png",
        note: "Locked 12f splash from dojo-art/finals/ultimates. Austin + Moose also ship fx/ overlays. Boot preloads _00; Fight loads the rest for the two combatants.",
        fighters: listed,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(ultsOut, "README.md"),
    `# Ultimate splash drop-in

Generated from \`dojo-art/finals/ultimates/<id>/\`.

- Splash: \`ult_<id>_00.png\` … (12f @~512h when present)
- Fullscreen FX (Austin / Sensei Moose): \`fx/ult_<id>_fx_NN.png\`
- \`ult_<id>_00.png\` is also copied to \`web/public/assets/\` so Boot’s existing key still resolves
`,
  );
  console.log(`Ultimates → ${splashCount} splash + ${fxCount} fx across ${Object.keys(listed).length} ids`);
}

ingestAudio();
ingestUltimates();

copied.sort();
fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      source: "SenseiMoosesDojo/Assets.xcassets",
      note: "Exported by web/scripts/export-assets.mjs. Names match imageset PNG filenames. Locked ult splash lives under ultimates/.",
      count: copied.length,
      files: copied,
      fighters: Object.keys(fighters),
    },
    null,
    2,
  ),
);

const hitIds = Object.entries(fighters)
  .filter(([, listed]) => (listed.hit?.length ?? 0) > 0)
  .map(([id]) => id);
const defeatIds = Object.entries(fighters)
  .filter(([, listed]) => (listed.defeat?.length ?? 0) > 0 || (listed.defeated?.length ?? 0) > 0)
  .map(([id]) => id);
console.log(`Optional hit frames → ${hitIds.length ? hitIds.join(", ") : "none"}`);
console.log(`Optional defeat frames → ${defeatIds.length ? defeatIds.join(", ") : "none (hooks only)"}`);
console.log(`Exported ${copied.length} PNGs + ${Object.keys(fighters).length} fighter folders → web/public/assets`);
