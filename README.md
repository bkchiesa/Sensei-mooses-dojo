# Sensei Moose’s Dojo

iPhone street-fighter prototype. Native **Swift + SpriteKit** — no Unity, no Godot, no paid dependencies.

Playable loop: **Title → Arcade or Free Play select → Fight**. Arcade auto-advances the boss ladder after each win.

## Open in Xcode

1. On a Mac, clone this repo and open **`SenseiMoosesDojo.xcodeproj`**.
2. Select the **SenseiMoosesDojo** scheme (shared).
3. In Signing & Capabilities, pick your **Development Team** (bundle id `com.bkchiesa.SenseiMoosesDojo`).
4. Run on an **iPhone simulator or device**. The game is landscape-only.
5. Do **not** App Store submit this prototype.

This Linux/cloud checkout cannot compile with `xcodebuild`. Structural project + source checks live in `scripts/check_project.py`.

## How to play

| Scene | What happens |
| --- | --- |
| **TitleScene** | Animated title *Sensei Moose’s Dojo*. **Arcade**, **Free Play**, or **TOP 10**. Tap elsewhere starts Arcade. |
| **CharacterSelectScene** | Arcade: starters only (Matt / Simon / Rich / Amanda / JB). Free Play: starters plus any unlocked bosses. |
| **FightScene** | Health bars + **ULT** meters, on-screen **◀ ▶** / **JUMP** / **PUNCH** / **KICK** / **★ ULT**. Arcade ladder unchanged. Landed hits fill the ultimate meter (~6 hits). |
| **LeaderboardScene** | Top 10: rank, name, score. Game Center when signed in; otherwise this-device fallback. |

## Roster

| Display | id | Portrait asset | Idle asset |
| --- | --- | --- | --- |
| Matt | `matt` | `fighter_matt_portrait` | `fighter_matt_idle_00` |
| Simon | `simon` | `fighter_simon_portrait` | `fighter_simon_idle_00` |
| Rich | `rich` | `fighter_rich_portrait` | `fighter_rich_idle_00` |
| Amanda | `amanda` | `fighter_amanda_portrait` | `fighter_amanda_idle_00` |
| JB | `jb` | `fighter_jb_portrait` | `fighter_jb_idle_00` |



### Extra stages Batch A (art parked; optional)

Not on the arcade ladder yet — Free Play / future rotation. Asset prefix `stage_<id>_`.

| Stage | id | Prefix |
| --- | --- | --- |
| Oyster Point | `oysterpoint` | `stage_oysterpoint_*` |
| Patrick Henry Mall | `phmall` | `stage_phmall_*` |
| Newport News Shipyard | `shipyard` | `stage_shipyard_*` |
| Hilton Village | `hiltonvillage` | `stage_hiltonvillage_*` |

### Extra stages Batch B (art parked; optional)

| Stage | id | Prefix |
| --- | --- | --- |
| Mariners Museum | `mariners` | `stage_mariners_*` |
| Warwick Subway | `subwaywarwick` | `stage_subwaywarwick_*` |
| Newport News Park | `nnpark` | `stage_nnpark_*` |
| James River Bridge | `jrbridge` | `stage_jrbridge_*` |

## Unlock on defeat (design)

Clearing a boss unlocks them as a **playable** character on Character Select.

| Rule | Detail |
| --- | --- |
| Starters | Matt / Simon / Rich / Amanda / JB — always available |
| Unlock | Defeat boss → unlock that boss on Select |
| Persistence | Local `UserDefaults` via `Game/UnlockStore.swift` (Game Center sync optional later) |
| Art | Unlocked bosses reuse `boss_<id>_portrait` / `boss_<id>_idle_00` |
| Finals | Austin / Sensei Moose use the same unlock-on-clear rule unless Brandon changes it |

Arcade order (after the Stage 1 starter dummy fight):

**Misty → Lucas → Chris → Christiano → Dakota → John K. (`johnk`) → Finley → Hudson → Michael → Kasey → Jaylen → Amiyr → Shaun → Ryan → Austin → Sensei Moose (`senseiMoose`)**

A win unlocks that boss on Free Play Select (`UserDefaults` via `UnlockStore`). `boss_senseiMoose_*` is not in-tree yet; Fight/Select fall back to `moose_title_idle` for Sensei Moose.

### Stage mapping

| Stage | Mood | Who fights here |
| --- | --- | --- |
| Stage 1 Lions Bridge (`stage1_*`) | B | Intro starter dummy + batch 1 (Misty–Dakota) |
| Stage 2 Hilton Elementary (`stage2_*`) | B waterfront + building | Batch 2 (John K.–Kasey) |
| Stage 3 Axsom Martial Arts Dojo (`stage3_*`) | B exterior dusk | Batch 3 (Jaylen–Austin) + Sensei Moose |

Pixel finals for Stage 1 / title / starter roster / Hilton / Dojo / boss batches 1–3 are in `SenseiMoosesDojo/Assets.xcassets/`.

### Boss batch 1 (art parked)

| Display | id | Portrait | Idle |
| --- | --- | --- | --- |
| Misty | `misty` | `boss_misty_portrait` | `boss_misty_idle_00` |
| Lucas | `lucas` | `boss_lucas_portrait` | `boss_lucas_idle_00` |
| Chris | `chris` | `boss_chris_portrait` | `boss_chris_idle_00` |
| Christiano | `christiano` | `boss_christiano_portrait` | `boss_christiano_idle_00` |
| Dakota | `dakota` | `boss_dakota_portrait` | `boss_dakota_idle_00` |

### Boss batch 2 (art parked)

| Display | id | Portrait | Idle |
| --- | --- | --- | --- |
| John K. | `johnk` | `boss_johnk_portrait` | `boss_johnk_idle_00` |
| Finley | `finley` | `boss_finley_portrait` | `boss_finley_idle_00` |
| Hudson | `hudson` | `boss_hudson_portrait` | `boss_hudson_idle_00` |
| Michael | `michael` | `boss_michael_portrait` | `boss_michael_idle_00` |
| Kasey | `kasey` | `boss_kasey_portrait` | `boss_kasey_idle_00` |

### Boss batch 3 (art parked)

| Display | id | Portrait | Idle |
| --- | --- | --- | --- |
| Jaylen | `jaylen` | `boss_jaylen_portrait` | `boss_jaylen_idle_00` |
| Amiyr | `amiyr` | `boss_amiyr_portrait` | `boss_amiyr_idle_00` |
| Shaun | `shaun` | `boss_shaun_portrait` | `boss_shaun_idle_00` |
| Ryan | `ryan` | `boss_ryan_portrait` | `boss_ryan_idle_00` |
| Austin | `austin` | `boss_austin_portrait` | `boss_austin_idle_00` |

## Drop-in art (no code changes)

Pixel finals can replace the colored placeholders. Keep the **imageset folder name** and the **PNG filename** the same.

Catalog root: **`SenseiMoosesDojo/Assets.xcassets/`**

| Role | Asset name | Path |
| --- | --- | --- |
| Title moose (pose B jump) | `moose_title_idle` | `SenseiMoosesDojo/Assets.xcassets/moose_title_idle.imageset/moose_title_idle.png` |
| Optional title body | `moose_title_body` | `SenseiMoosesDojo/Assets.xcassets/moose_title_body.imageset/moose_title_body.png` |
| Optional title head | `moose_title_head` | `SenseiMoosesDojo/Assets.xcassets/moose_title_head.imageset/moose_title_head.png` |
| Stage plate | `stage1_master` | `SenseiMoosesDojo/Assets.xcassets/stage1_master.imageset/stage1_master.png` |
| Parallax sky | `stage1_sky` | `SenseiMoosesDojo/Assets.xcassets/stage1_sky.imageset/stage1_sky.png` |
| Parallax far | `stage1_far` | `SenseiMoosesDojo/Assets.xcassets/stage1_far.imageset/stage1_far.png` |
| Parallax mid | `stage1_mid` | `SenseiMoosesDojo/Assets.xcassets/stage1_mid.imageset/stage1_mid.png` |
| Parallax near | `stage1_near` | `SenseiMoosesDojo/Assets.xcassets/stage1_near.imageset/stage1_near.png` |
| Fighter portrait / idle | `fighter_<id>_portrait` / `fighter_<id>_idle_00` | matching `.imageset` folders for each roster id |

FightScene loads `stage1_master` plus any of `stage1_sky` / `far` / `mid` / `near` that exist, and shifts them for a light parallax. Title prefers `moose_title_idle`; if that is missing it composes `moose_title_body` + `moose_title_head`.

### Stages

`Game/Stage.swift` is a **catalog table** (`StageConfig.catalog`). Add later NN landmarks / generics as a new row (`assetPrefix` `stage4+`); do not assume only three stages. Current arcade rows:

| Stage | id | Status | Art prefix |
| --- | --- | --- | --- |
| Lions Bridge (mood B) | `lionsBridge` | Wired | `stage1_*` |
| Hilton Elementary (mood B waterfront) | `hiltonElementary` | Wired for batch 2 | `stage2_*` |
| Axsom Martial Arts Dojo (mood B dusk) | `axsomDojo` | Wired for batch 3 + Sensei | `stage3_*` |

## Ultimate moves

Every playable (starters, unlocked bosses, Sensei Moose) has a unique ultimate in `Game/UltimateMove.swift`. Each entry has its own name, summary, and placeholder motion (`UltimateFlavor`); optional Pixel frames are `ult_<id>_00`.

| Rule | Detail |
| --- | --- |
| Button | **★ ULT** on the virtual pad (dimmed until the meter is full) |
| Meter | Separate bar under each health bar. Fills only from **landed** punches/kicks |
| Charge | **6** successful hits fill the meter (`UltimateMove.hitsToFill`, range 4–8) |
| Damage | **30%** of the opponent’s max HP, applied once |
| After use | Meter empties; charge again from hits |
| Art | Optional `ult_<id>_00` imageset; otherwise colorized idle + motion |

Locked signatures: **Austin — Tornado Kick** (spinning kick barrage homage). **Sensei Moose — Figure-Four Lock** (figure-4 leglock homage).

| Fighter | Ultimate | Flavor |
| --- | --- | --- |
| Matt | Rising Fang | Dragon-punch leap |
| Simon | Spirit Wave | Fireball-style palm lunge |
| Rich | Grove Lock | Command-grab slam |
| Amanda | Violet Flash | Flip kick |
| JB | Gold Rush | Clothesline charge |
| Misty | Pink Mist Dive | Dash-through cross |
| Lucas | Blue Barrage | Rapid fists |
| Chris | Redwood Lariat | Spinning clothesline |
| Christiano | Emerald Spear | Flying dropkick |
| Dakota | Prairie Suplex | Snap suplex |
| John K. | K-Bomb | Sit-out powerbomb |
| Finley | Clover Rana | Headscissors flip |
| Hudson | Timber Elbow | Elbow drop |
| Michael | Tide Spear | Tackle spear |
| Kasey | Rose Moonsault | Backflip splash |
| Jaylen | Cyan Fang | Tiger-uppercut homage |
| Amiyr | Void Step | Blink strike |
| Shaun | Iron Driver | Piledriver homage |
| Ryan | Red Cutter | Jumping cutter homage |
| Austin | Tornado Kick | Spinning kick barrage (locked) |
| Sensei Moose | Figure-Four Lock | Figure-4 leglock (locked) |

Names are stylized homages — no licensed move names, logos, or VFX.

### Ultimate art (placeholders parked)

Catalog: `ult_<id>_00` (+ extra frames where provided). Austin sheet `ult_austin_00`…`14`; Sensei Moose `ult_senseiMoose_00`/`01` (from Pixel `moose/`). Other roster ids have pose or idle stand-in placeholders — not final likeness. Brandon still votes Austin/Moose pose concepts before polish swap.


## Top 10 leaderboard

`Game/LeaderboardService.swift` + `Scenes/LeaderboardScene.swift`. Does not block Title → Select → Fight.

| Path | Behavior |
| --- | --- |
| **Primary** | Apple Game Center (`GameKit`). `GKLocalPlayer` auth, submit score, load global top 10. |
| **Leaderboard ID** | `com.sensiemoose.dojo.top10` (`LeaderboardConfig.gameCenterID`) — placeholder until App Store Connect. |
| **Fallback** | Device-only `UserDefaults` JSON (`name`, `score`, `date`). Used when Game Center is unavailable or not signed in so the prototype always demos. |
| **Score** | Remaining HP × 10 on a win. Prompt asks for a display name, then submits and opens Top 10. |

Optionally add the **Game Center** capability in Xcode Signing & Capabilities and create that leaderboard ID in App Store Connect. No custom backend. Do **not** App Store submit this prototype. Until GC is configured, local Top 10 still works on simulator and device.

To regenerate **placeholders only** (overwrites PNGs):

```bash
python3 scripts/generate_placeholders.py
```

## Project layout

```
SenseiMoosesDojo.xcodeproj/     native iPhone project + shared scheme
SenseiMoosesDojo/
  AppDelegate.swift
  SceneDelegate.swift
  GameViewController.swift      SKView, landscape, TitleScene
  Game/                         roster, bosses, arcade ladder, unlocks, art, fight, leaderboard
  Scenes/                       Title, Select, Fight, Leaderboard
  Assets.xcassets/              named drop-in imagesets
scripts/                        placeholder + project generators, structural check
```

Code loads sprites with `UIImage(named:)` / `SKTexture(imageNamed:)` using the exact names above. Missing art falls back to a labeled colored sprite so the loop still plays.
