# Web art export

Playable sprites are **copied** from the native catalog. Do not hand-edit files under `web/public/assets/` — they are generated.

| Web file | Source |
| --- | --- |
| `web/public/assets/<name>.png` | `SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png` |
| `web/public/assets/fighters/<id>/<anim>_NN.png` | Pixel frames from `dojo-art/finals/fighters/<id>/` (and `web/fighter-sheets/<id>/` overlay) |

`npm run export-assets` (also run by `dev` / `build`) copies:

- Title moose: `moose_title_*`
- Starter portraits / idles: `fighter_<id>_portrait`, `fighter_<id>_idle_00`
- Boss portraits / idles: `boss_<id>_portrait`, `boss_<id>_idle_00`
- **All wired stages, full parallax:** `stage1_*`, `stage2_*`, `stage3_*`, and `stage_<landmark>_*` (`sky` / `far` / `mid` / `master` / `near`) for Batch A–C (Oyster Point … Poquoson, including Busch / Hampton / Poquoson)
- Ultimate frames: `ult_<id>_00`, plus Austin `ult_austin_00`…`14` and Sensei Moose extras
- Fighter anim folders + `fighters/index.json` (starters have full punch/kick/jump/block/crouch/sweep; bosses/Moose still idle-fallback)

FightScene loads the current stage’s layers on demand (not the whole catalog). Background `sky` / `far` / `mid` parallax with the camera; **`master` / `near` stay pinned** so the fight floor does not slide.

**Sensei Moose** has no `boss_senseiMoose_*` imageset yet. The web game uses `moose_title_idle` as portrait/idle, matching the SpriteKit fallback.

## Fighter animation drop-in (Pixel)

Pixel FINALS live in `dojo-art/finals/fighters/<id>/fighter_<id>_<anim>_NN.png` (see `INDEX.md` there). Optional overlay:

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

Number extra frames `_01`, `_02`, … Phaser (`web/src/game/anims.ts`) loads whatever `index.json` lists and falls back to a scaled idle for missing anims. Display height is `FIGHTER_HEIGHT` 420 (2×).

**Sensei Moose:** if `web/fighter-sheets/senseiMoose/idle_00.png` exists, export uses it (not `moose_title_idle`) and also writes `boss_senseiMoose_idle_00.png` so fight/select load the pose-bar idle. Remaining Moose frames are copied into `fighters/senseiMoose/` and listed in `index.json`. Magenta chroma is left as Pixel delivered it.

## PLAYER SELECT map

Locked Brandon finals (2026-09-05):

- `dojo-art/finals/ui/select/select-screen-C.png` (alias `select_screen.png`) — full SF2-homage select wash
- `dojo-art/finals/ui/select/select-map-plate-C.png` (alias `select_map_plate.png`) — framed 1920×1080 Lower Peninsula oval

`export-assets` prefers the **C** names, writes `web/public/assets/ui/select/plate.json`, and fails if C exists but the SVG placeholder would ship instead. SelectScene / Boot load those PNGs so iPad Safari shows screen C + plate C, not the SVG alone.

`hampton-roads-map.svg` stays as a geo-faithful fallback (same lon/lat UV). Code draws landmark dots; on framed plate C they project through `PLATE_C_MAP_RECT`. Concepts may live in `dojo-art/concepts/ui/select/` until finals copy.

Contract: north-up, lon −76.76…−76.28, lat 36.955…37.30. Raw placeholder **1111×1000** (aspect ≈ 1.111), UV 0,0 = NW. Framed plate C is 1920×1080 with the geo box inset. See `dojo-art/finals/ui/select/README.md`.

A `manifest.json` listing copied filenames is written next to the PNGs (gitignored).
