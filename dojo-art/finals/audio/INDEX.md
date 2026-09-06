# Dojo audio cue index

Web-ready stems for Sensei Moose’s Dojo. Prefer Tempo’s shared pack at
`/workspace/dojo-audio/{sfx,bgm,vo}` when present; this folder is the
in-repo fallback (`export-assets` copies whichever exists).

Boot only preloads keys listed in `web/public/assets/audio/manifest.json`.
Each cue ships `.ogg` plus `.mp3` (Safari). iPad unlocks on the first tap.

## SFX (`sfx/`)

| File stem | Game event |
| --- | --- |
| `punch_miss` | Punch swing (ground or air) |
| `punch_hit` | Punch connects |
| `kick_miss` | Kick swing (ground or air) |
| `kick_hit` | Kick connects |
| `sweep` | Sweep swing |
| `block` | Block absorbs a hit |
| `hit` | Generic connect (fallback) |
| `jump` | Leave the ground |
| `land` | Touch down |
| `crouch` | Enter crouch |
| `ult_ready` | Meter fills |
| `ult_activate` | Ult fires / splash starts |
| `ult_impact` | Ult connects |
| `ko` | Fighter KO |
| `fight_banner` | “FIGHT!” |
| `countdown` | ROUND / 3 / 2 / 1 |
| `menu_move` | Menu / roster hover |
| `menu_confirm` | Menu confirm (Arcade / Free Play / Top 10) |
| `char_select` | Portrait picked |
| `char_locked` | Locked slot (if shown) |
| `round_win` | Round win banner |
| `round_lose` | Round lose banner |
| `match_win` | Match win |
| `match_lose` | Match lose |
| `next_fight` | Next Fight |
| `unlock` | Boss unlock / 8-tap title unlock |

Short aliases Tempo may use (`punch`, `kick`, `ult`, `menu`, `select`, …)
are remapped to the stems above at export.

## BGM (`bgm/`)

| File stem | Where |
| --- | --- |
| `title_attract_loop` | Title (after first tap unlock) |
| `fight_a_loop` | Select **and** Fight |
| `fight_b_loop` | Reserved (not auto-played) |
| `fight_c_loop` | Reserved (not auto-played) |
| `victory` | Match-win sting |
| `defeat` | Match-lose sting |

## VO (`vo/`) — optional

| File stem | Where |
| --- | --- |
| `vo_welcome` | Title after unlock |
| `vo_round` | Round banner |
| `vo_fight` | “FIGHT!” |
| `vo_ko` | KO |
