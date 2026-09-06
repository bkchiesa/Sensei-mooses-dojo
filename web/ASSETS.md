# Web art export

Playable sprites are **copied** from the native catalog. Do not hand-edit files under `web/public/assets/` — they are generated.

| Web file | Source |
| --- | --- |
| `web/public/assets/<name>.png` | `SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png` |
| `web/public/assets/fighters/<id>/<anim>_NN.png` | Pixel frames from `dojo-art/finals/fighters/<id>/` (and `web/fighter-sheets/<id>/` overlay) |
| `web/public/assets/ultimates/<id>/ult_<id>_NN.png` | Locked splash from `dojo-art/finals/ultimates/<id>/` (overwrites catalog `ult_<id>_00`) |
| `web/public/assets/ultimates/<id>/fx/ult_<id>_fx_NN.png` | Austin / Sensei Moose fullscreen FX |

`npm run export-assets` (also run by `dev` / `build`) copies:

- Title moose: `moose_title_*`
- Starter portraits / idles: `fighter_<id>_portrait`, `fighter_<id>_idle_00`
- Boss portraits / idles: `boss_<id>_portrait`, `boss_<id>_idle_00`
- **All wired stages, full parallax:** `stage1_*`, `stage2_*`, `stage3_*`, and `stage_<landmark>_*` (`sky` / `far` / `mid` / `master` / `near`) for Batch A–C (Oyster Point … Poquoson, including Busch / Hampton / Poquoson)
- Ultimate splash: `ultimates/<id>/ult_<id>_00`… (12f where present) + `ultimates/index.json`. `ult_<id>_00` is also copied to the assets root so Boot’s existing key resolves
- Austin / Sensei Moose fullscreen FX: `ultimates/<id>/fx/ult_<id>_fx_00`…
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

Locked **map plate C** (`dojo-art/finals/ui/select/select-map-plate-C.png`) is the peninsula. Select UI is **live unlocked portraits** — do not display `select-screen-C.png` as the picker (stand-in heads are baked into that plate).

`export-assets` prefers `select-map-plate-C.png` and writes `plate.json`. The SVG placeholder remains a fallback. Landmark dots stay on real lon/lat (`PLATE_C_MAP_RECT` on the framed 1920×1080 plate).

## Title splash (locked)

Locked files in `dojo-art/finals/ui/title/` (copied to `web/public/assets/ui/title/`):

- `title_bg_dojo.png` → `title_bg_dojo` (full-bleed interior)
- `title_logo_00.png` … `title_logo_07.png` → glow/breathe loop
- `title_logo_hero.png` → static fallback / first-frame stand-in

`export-assets` writes `title.json` listing files that exist. Boot only preloads those URLs so iPad Safari does not 404 on missing frames. Legacy `dojo-interior.png` / `logo.png` load only if the locked names are absent and those files are present.

## Ultimate splash (locked)

Locked 12-frame sheets in `dojo-art/finals/ultimates/<id>/` (copied to `web/public/assets/ultimates/<id>/`):

- `ult_<id>_00.png` … `ult_<id>_11.png` → FightScene splash playback (~512h)
- Austin / Sensei Moose: `fx/ult_austin_fx_00`… / `fx/ult_senseiMoose_fx_00`… fullscreen overlays (1280×800)
- Moose folder is an alias for `senseiMoose`

`export-assets` writes `ultimates/index.json` listing frames that exist. Boot preloads each roster `_00`. FightScene loads the remaining splash (+ FX) for the two combatants only.

## Ult button HUD (locked)

Locked files in `dojo-art/finals/ui/ult-button/` (copied to `web/public/assets/ui/ult-button/`):

- `ult_btn_idle.png` → calm gold bolt (charging / empty)
- `ult_btn_ready_00.png` … `ult_btn_ready_07.png` → overcharged jitter/glow loop
- `ult_btn_bolt_00.png` … `ult_btn_bolt_01.png` → optional activate flash overlays

`export-assets` writes `ult-button.json` listing files that exist. Boot only preloads those URLs so iPad Safari does not 404 on missing frames. Fight HUD falls back to the purple ★ ULT circle if the art is absent.

## Audio

`export-assets` copies Tempo’s pack from `/workspace/dojo-audio/{sfx,bgm,vo}` when present, else `dojo-art/finals/audio/`. Each stem is written under `web/public/assets/audio/<kind>/` with `.ogg` + `.mp3` (Safari). Missing mp3s are transcoded from ogg when ffmpeg is available.

`assets/audio/manifest.json` lists only files that exist. Boot preloads those keys — never speculative audio URLs (iPad Safari 404s). Cue names: `dojo-art/finals/audio/INDEX.md`.

iPad unlock: first title tap / any input resumes `sound.locked` and the WebAudio context, then SFX and BGM play.

| Scene | BGM |
| --- | --- |
| Title / Top 10 | `title_attract_loop` |
| Select + Fight | `fight_a_loop` |
| Match win / lose | `victory` / `defeat` stings |

A `manifest.json` listing copied PNG filenames is written next to the PNGs (gitignored).
