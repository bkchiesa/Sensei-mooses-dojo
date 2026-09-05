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
| **TitleScene** | Animated title *Sensei Moose’s Dojo*, Sensei Moose closed-gi jump (pose B) with a bob. Tap anywhere. |
| **CharacterSelectScene** | Five slots: **Matt, Simon, Rich, Amanda, JB** (`matt` / `simon` / `rich` / `amanda` / `jb`). Tap a fighter to start. |
| **FightScene** | Stage 1 **Lions Bridge** mood B. You vs a CPU dummy (another roster fighter). Health bars. On-screen **◀ ▶**, **JUMP**, **PUNCH**, **KICK**. Round ends at 0 HP → **Rematch** or **Character Select**. |

## Roster

| Display | id | Portrait asset | Idle asset |
| --- | --- | --- | --- |
| Matt | `matt` | `fighter_matt_portrait` | `fighter_matt_idle_00` |
| Simon | `simon` | `fighter_simon_portrait` | `fighter_simon_idle_00` |
| Rich | `rich` | `fighter_rich_portrait` | `fighter_rich_idle_00` |
| Amanda | `amanda` | `fighter_amanda_portrait` | `fighter_amanda_idle_00` |
| JB | `jb` | `fighter_jb_portrait` | `fighter_jb_idle_00` |

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
  Game/                         roster, art loader, fighters, pad, routing
  Scenes/                       TitleScene, CharacterSelectScene, FightScene
  Assets.xcassets/              named drop-in imagesets
scripts/                        placeholder + project generators, structural check
```

Code loads sprites with `UIImage(named:)` / `SKTexture(imageNamed:)` using the exact names above. Missing art falls back to a labeled colored sprite so the loop still plays.
