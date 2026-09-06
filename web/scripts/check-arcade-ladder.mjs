/**
 * Source + algorithm contract for the 12-stage Arcade ladder (no Phaser).
 * Run: node scripts/check-arcade-ladder.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arcadeSrc = fs.readFileSync(path.join(root, "src/game/arcade.ts"), "utf8");
const catalogSrc = fs.readFileSync(path.join(root, "src/data/catalog.ts"), "utf8");
const fightSrc = fs.readFileSync(path.join(root, "src/scenes/FightScene.ts"), "utf8");
const bootSrc = fs.readFileSync(path.join(root, "src/scenes/BootScene.ts"), "utf8");

assert.match(catalogSrc, /LOCKED_UNTIL_DEFEAT_IDS = \["ryan"\]/);
assert.match(arcadeSrc, /export const ARCADE_STAGE_COUNT = 12/);
assert.match(arcadeSrc, /export const ARCADE_AUSTIN_STAGE = 11/);
assert.match(arcadeSrc, /export const ARCADE_MOOSE_STAGE = 12/);
assert.match(arcadeSrc, /\[\.\.\.early, "austin", "senseiMoose"\]/);
assert.match(fightSrc, /arcadeStageHud/);
assert.match(fightSrc, /evictStaleFightTextures/);
assert.match(fightSrc, /ensureStagePlates/);
assert.match(bootSrc, /arcadeAtStage/);

const bossIds = [...catalogSrc.matchAll(/boss\("([a-zA-Z0-9]+)"/g)].map((m) => m[1]);
assert.ok(bossIds.includes("austin") && bossIds.includes("senseiMoose"));
assert.ok(bossIds.length >= 14);

function shuffled(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function build(playerId, rng) {
  const pool = bossIds.filter((id) => id !== playerId && id !== "austin" && id !== "senseiMoose");
  const early = shuffled(pool, rng).slice(0, 10);
  return [...early, "austin", "senseiMoose"];
}

let seq = 0;
const rng = () => {
  seq += 1;
  return (seq % 17) / 17;
};

const misty = build("misty", rng);
assert.equal(misty.length, 12);
assert.equal(misty[10], "austin");
assert.equal(misty[11], "senseiMoose");
assert.equal(new Set(misty.slice(0, 10)).size, 10);
assert.ok(!misty.slice(0, 10).includes("misty"));
assert.ok(!misty.slice(0, 10).includes("austin"));

const asAustin = build("austin", rng);
assert.equal(asAustin[10], "austin");
assert.ok(!asAustin.slice(0, 10).includes("austin"));

console.log("arcade ladder contract ok");
