# Web art export

Playable sprites are **copied** from the native catalog. Do not hand-edit files under `web/public/assets/` — they are generated.

| Web file | Source |
| --- | --- |
| `web/public/assets/<name>.png` | `SenseiMoosesDojo/Assets.xcassets/<name>.imageset/<name>.png` |

`npm run export-assets` (also run by `dev` / `build`) copies:

- Title moose: `moose_title_*`
- Starter portraits / idles: `fighter_<id>_portrait`, `fighter_<id>_idle_00`
- Boss portraits / idles: `boss_<id>_portrait`, `boss_<id>_idle_00`
- Arcade stages: `stage1_*`, `stage2_*`, `stage3_*` (sky / far / mid / master / near)
- Ultimate frames: `ult_<id>_00`, plus Austin `ult_austin_00`…`14` and Sensei Moose extras

**Not copied (art parked, not on the arcade ladder):** extra NN landmark stages (`stage_oysterpoint_*`, `stage_phmall_*`, …). Native catalog still holds them.

**Sensei Moose** has no `boss_senseiMoose_*` imageset yet. The web game uses `moose_title_idle` as portrait/idle, matching the SpriteKit fallback.

A `manifest.json` listing copied filenames is written next to the PNGs (gitignored).
