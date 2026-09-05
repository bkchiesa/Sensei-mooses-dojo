# Web art export

Playable sprites are **copied** from the native catalog. Do not hand-edit files under `web/public/assets/` — they are generated.

| Web file | Source |
| --- | --- |
| `web/public/assets/<name>.png` | `SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png` |
| `web/public/assets/fighters/<id>/<anim>_00.png` | Idle placeholder from catalog, or Pixel frames from `web/fighter-sheets/<id>/` |

`npm run export-assets` (also run by `dev` / `build`) copies:

- Title moose: `moose_title_*`
- Starter portraits / idles: `fighter_<id>_portrait`, `fighter_<id>_idle_00`
- Boss portraits / idles: `boss_<id>_portrait`, `boss_<id>_idle_00`
- **All wired stages, full parallax:** `stage1_*`, `stage2_*`, `stage3_*`, and `stage_<landmark>_*` (`sky` / `far` / `mid` / `master` / `near`) for Batch A–C (Oyster Point … Poquoson, including Busch / Hampton / Poquoson)
- Ultimate frames: `ult_<id>_00`, plus Austin `ult_austin_00`…`14` and Sensei Moose extras
- Fighter anim folders + `fighters/index.json` (idle placeholders until Pixel sheets land)

FightScene loads the current stage’s layers on demand (not the whole catalog). Background `sky` / `far` / `mid` parallax with the camera; **`master` / `near` stay pinned** so the fight floor does not slide.

**Sensei Moose** has no `boss_senseiMoose_*` imageset yet. The web game uses `moose_title_idle` as portrait/idle, matching the SpriteKit fallback.

## Fighter animation drop-in (Pixel)

Expected layout (either committed under `web/fighter-sheets/` or listed in the generated `index.json`):

```
web/fighter-sheets/<id>/
  idle_00.png
  punch_00.png
  kick_00.png
  jump_00.png
  block_00.png
  crouch_00.png
  sweep_00.png
```

Number extra frames `_01`, `_02`, … The Phaser anim system (`web/src/game/anims.ts`) loads whatever `index.json` lists and falls back to a scaled idle for missing anims.

**Sensei Moose:** if `web/fighter-sheets/senseiMoose/idle_00.png` exists, export uses it (not `moose_title_idle`) and also writes `boss_senseiMoose_idle_00.png` so fight/select load the pose-bar idle. Remaining Moose frames are copied into `fighters/senseiMoose/` and listed in `index.json`. Magenta chroma is left as Pixel delivered it.

## PLAYER SELECT map

`dojo-art/finals/ui/select/hampton-roads-map.svg` is a geo-faithful placeholder (same lon/lat UV as the dots). Pixel’s `hampton-roads-map.png` replaces it. Export copies the plate to `web/public/assets/ui/select/` and writes `plate.json` so the game swaps the under-image without moving dots.

Contract: north-up, lon −76.76…−76.28, lat 36.955…37.30, **1111×1000** (aspect ≈ 1.111), UV 0,0 = NW. Full image = full bounds — no padding. See `dojo-art/finals/ui/select/README.md`.

A `manifest.json` listing copied filenames is written next to the PNGs (gitignored).
