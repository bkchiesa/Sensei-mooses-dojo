# Sensei Moose’s Dojo

iPhone street-fighter prototype. Native **Swift + SpriteKit** — no Unity, no Godot, no paid dependencies.

Playable v0 loop: **Title → Character Select → Fight → rematch or back to select**.

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
| **TitleScene** | Animated title *Sensei Moose’s Dojo*, Sensei Moose closed-gi jump (pose B) with a bob. Tap to play, or **TOP 10** for the leaderboard. |
| **CharacterSelectScene** | Five slots: **Matt, Simon, Rich, Amanda, JB** (`matt` / `simon` / `rich` / `amanda` / `jb`). Tap a fighter to start. |
| **FightScene** | Stage 1 **Lions Bridge** mood B. You vs a CPU dummy (another roster fighter). Health bars. On-screen **◀ ▶**, **JUMP**, **PUNCH**, **KICK**. Round ends at 0 HP → **Rematch** or **Character Select**. A win also offers **Submit Score**. |
| **LeaderboardScene** | Top 10: rank, name, score. Game Center when signed in; otherwise this-device fallback. |

## Roster

| Display | id | Portrait asset | Idle asset |
| --- | --- | --- | --- |
| Matt | `matt` | `fighter_matt_portrait` | `fighter_matt_idle_00` |
| Simon | `simon` | `fighter_simon_portrait` | `fighter_simon_idle_00` |
| Rich | `rich` | `fighter_rich_portrait` | `fighter_rich_idle_00` |
| Amanda | `amanda` | `fighter_amanda_portrait` | `fighter_amanda_idle_00` |
| JB | `jb` | `fighter_jb_portrait` | `fighter_jb_idle_00` |


## Unlock on defeat (design)

Clearing a boss unlocks them as a **playable** character on Character Select.

| Rule | Detail |
| --- | --- |
| Starters | Matt / Simon / Rich / Amanda / JB — always available |
| Unlock | Defeat boss → unlock that boss on Select |
| Persistence | Local `UserDefaults` via `Game/UnlockStore.swift` (Game Center sync optional later) |
| Art | Unlocked bosses reuse `boss_<id>_portrait` / `boss_<id>_idle_00` |
| Finals | Austin / Sensei Moose use the same unlock-on-clear rule unless Brandon changes it |

v0 fight loop still uses **Stage 1 + starter roster** only. `BossID` + `UnlockStore` are the hooks for ladder wiring; Select currently shows starters (`UnlockStore.starters`).

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

### Boss batch 3 (likeness locked; art pending)

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

### Later stages (hooks only)

`Game/Stage.swift` has a `StageID` / `StageConfig` table. **Only Stage 1 is playable.**

| Stage | id | Status | Reserved art prefix |
| --- | --- | --- | --- |
| Lions Bridge (mood B) | `lionsBridge` | Wired in FightScene | `stage1_*` |
| Hilton Elementary School | `hiltonElementary` | TODO stub | `stage2_*` |
| Axsom Martial Arts Dojo | `axsomDojo` | TODO stub | `stage3_*` |

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
  Game/                         roster, stages, art, fighters, pad, routing, leaderboard
  Scenes/                       Title, Select, Fight, Leaderboard
  Assets.xcassets/              named drop-in imagesets
scripts/                        placeholder + project generators, structural check
```

Code loads sprites with `UIImage(named:)` / `SKTexture(imageNamed:)` using the exact names above. Missing art falls back to a labeled colored sprite so the loop still plays.
