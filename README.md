# Sensei Moose’s Dojo

Browser street-fighter. **The playable product is the web game** — open it on iPad/iPhone Safari (landscape) or any desktop browser. No Mac, Xcode, or App Store required.

Playable loop: **Title → Arcade or Free Play select → Fight**. Fights are **best of 3** (first to 2 rounds) with a **3 → 2 → 1 → FIGHT!** countdown. Arcade shows **Next Fight** after a match win and continues into the next boss after a short beat. Health bars, round pips, ULT meters (landed hits), and a **★ ULT** button.

Native **Swift + SpriteKit** stays in the repo as a deferred prototype. Do **not** App Store submit it.

## Play in the browser (main)

### Live URL (GitHub Pages)

After Pages is enabled (once):

**https://bkchiesa.github.io/Sensei-mooses-dojo/**

Until that deploy exists, run locally (below) or use **Actions → Deploy web game to GitHub Pages → Run workflow**.

### Run locally

Needs Node 20+ (no Mac):

```bash
cd web
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`). On a phone/iPad on the same Wi‑Fi, use the LAN URL Vite prints (`Network: http://<your-ip>:5173`).

```bash
cd web
npm run build          # static files → web/dist
npm run preview        # serve the production build
```

`npm run build` also copies art from `SenseiMoosesDojo/Assets.xcassets` into `web/public/assets` (see `web/ASSETS.md`).

### Enable GitHub Pages so Brandon can tap a URL

1. Merge this repo’s default branch (`main`) once the web app is in.
2. GitHub → **Settings → Pages**.
3. **Build and deployment → Source:** *GitHub Actions* (not “Deploy from a branch”).
4. Push to `main` or run the **Deploy web game to GitHub Pages** workflow (**Actions** tab → Run workflow).
5. The live URL is `https://bkchiesa.github.io/Sensei-mooses-dojo/`.

The workflow is `.github/workflows/deploy-pages.yml`. It runs `cd web && npm ci && npm run build` and publishes `web/dist`.

### Controls (iPad Safari + keyboard)

| | Touch | Keyboard |
| --- | --- | --- |
| Move / crouch | Circular **thumbstick** (down = crouch) | A/D or arrows · S / ↓ crouch |
| Jump | **Stick up** | W / ↑ / Space |
| Punch / Kick | **PUNCH** / **KICK** (stick down + kick = sweep) | J/Z · K/X |
| Ultimate | **★ ULT** gold bolt (idle while charging; ready loop when full) | U / Enter |

Rotate to **landscape**. Eight taps on the title text unlocks every boss (debug). `?unlock=all` does the same. `?debug=1` makes your punches/kicks very heavy so you can check best-of-3 and Arcade continue quickly. `?win=1` auto-KOs the CPU after each countdown so you can walk Arcade to Victory. `?select=arcade` opens player select. `?arcade=11` (optional `&fighter=misty`) jumps Arcade to that 1-based stage — `11` is always Austin, `12` is always Sensei Moose. `?arcade=victory` opens the clear screen. `?vs=senseiMoose` jumps into a Free Play fight against that id (home stage). `?fighter=austin` (with `?vs=`) picks the player. `?ult=1` starts each round with a full player ultimate meter so splash playback and the charged gold-bolt HUD loop can be checked immediately. `?victory=1` (or `?victory=misty`) opens the Arcade victory collage for layout QA.

### Ported vs still stubbed

| Ported | Still stubbed / native-only |
| --- | --- |
| Title, Arcade, Free Play (you → opponent → stage), Fight | Game Center (web uses this-browser Top 10) |
| Staff roster on Select (Ryan starts locked; Austin + Sensei Moose are open) | Alley / rooftop stages (not locked yet) |
| Best of 3, countdown, Next Fight (auto-continues after a short beat) | Native SpriteKit project (kept, not the play path) |
| Unique arcade stage per boss (all locked landmarks) | `boss_senseiMoose_*` art (falls back to title moose) |
| Progressive arcade difficulty + 2× roster / Moose +30% | App Store / signing |
| Unique ultimates, 30% HP, meter from landed hits (~6), locked 12f splash + Austin/Moose FX | Pixel **full anim sheets** (punch/kick/jump/block/crouch/sweep) |
| Parallax BG + locked floor + light ambient loops | Air punch / kick (separate) |
| Touch + keyboard, static GitHub Pages build | |

## Native Xcode prototype (deferred)

1. On a Mac, clone this repo and open **`SenseiMoosesDojo.xcodeproj`**.
2. Select the **SenseiMoosesDojo** scheme (shared).
3. In Signing & Capabilities, pick your **Development Team** (bundle id `com.bkchiesa.SenseiMoosesDojo`).
4. Run on an **iPhone simulator or device**. The game is landscape-only.
5. Do **not** App Store submit this prototype.

This Linux/cloud checkout cannot compile with `xcodebuild`. Structural project + source checks live in `scripts/check_project.py`.

## How to play

| Scene | What happens |
| --- | --- |
| **TitleScene** | Animated title *Sensei Moose’s Dojo*. **Arcade**, **Free Play**, or **TOP 10**. |
| **CharacterSelectScene** | SF2-homage **PLAYER SELECT** (no Capcom IP): full staff roster (tap an unlocked slot to pick). Ryan stays greyed until beaten; Austin and Sensei Moose are open. 1P/2P busts + Hampton Roads map plate C with landmark dots. Arcade and Free Play share the same roster; Free Play then taps a map dot for the stage. Scratch starters (Matt / Simon / Rich / Amanda / JB) are not selectable. |
| **FightScene** | Best of 3, countdown, health + **round pips** + **ULT** meters, on-screen **thumbstick** (up = jump) / **PUNCH** / **KICK** (Pixel 3D up/down plates, ≥48px gap) / gold-bolt **★ ULT**. Arcade is **12 stages** (`STAGE 3/12` on the HUD and between fights); continues to the next boss after a short beat; tap **Next Fight** to skip. Landed hits fill the ultimate meter (~6 hits). Hit / defeat frames play when Pixel sheets exist. |
| **VictoryScene** | After a full Arcade clear: dojo backdrop, winner standing, defeated opponents laid down (D1–D8). Submit score / rematch last / character select. |
| **LeaderboardScene** | Top 10: rank, name, score. Game Center when signed in; otherwise this-device fallback. |

## Roster

Scratch starters (`matt`, `simon`, `rich`, `amanda`, `jb`) stay in the catalog for art / `?fighter=` debug. They are **not** on Select.

**Default playable** (unlocked at start): Misty, Lucas, Chris, Christiano, Dakota, John K., Finley, Hudson, Michael, Kasey, Jaylen, Amiyr, Shaun.

**Locked until beaten in Arcade:** Ryan (`ryan`). Austin and Sensei Moose are selectable in Arcade and Free Play.



### Extra stages Batch A (now on the arcade home-stage map)

Asset prefix `stage_<id>_`. Used as unique boss homes (see Stage mapping) and still pickable in Free Play.

| Stage | id | Prefix |
| --- | --- | --- |
| Oyster Point | `oysterpoint` | `stage_oysterpoint_*` |
| Patrick Henry Mall | `phmall` | `stage_phmall_*` |
| Newport News Shipyard | `shipyard` | `stage_shipyard_*` |
| Hilton Village | `hiltonvillage` | `stage_hiltonvillage_*` |

### Extra stages Batch B (art parked; optional)

| Stage | id | Prefix |
| --- | --- | --- |
| Mariners' Museum | `mariners` | `stage_mariners_*` |
| Warwick Blvd shop strip | `subwaywarwick` | `stage_subwaywarwick_*` |
| Newport News Park | `nnpark` | `stage_nnpark_*` |
| James River Bridge | `jrbridge` | `stage_jrbridge_*` |

### Extra stages Batch C (art parked)

| Stage | id | Prefix |
| --- | --- | --- |
| Colonial Capitol | `colonial` | `stage_colonial_*` |
| Local Stadium | `stadium` | `stage_stadium_*` |
| Busch Gardens | `busch` | `stage_busch_*` |
| Hampton Waterfront | `hampton` | `stage_hampton_*` |
| Poquoson Waterfront | `poquoson` | `stage_poquoson_*` |

Alley / rooftop still not locked. Web exports **full parallax** for arcade + landmark stages (`web/ASSETS.md`). Arcade assigns a unique home landmark to each boss (see Stage mapping).

## Unlock on defeat (design)

Select shows the **full staff roster**. Scratch starters are gone. Locked finals are greyed and not tappable until unlocked.

| Rule | Detail |
| --- | --- |
| Default pool | All bosses except Ryan — unlocked at start (Austin + Sensei Moose included) |
| Locked | `ryan` — greyed until you beat Ryan in Arcade |
| Unlock | Defeat Ryan in Arcade → persist via `localStorage` (`dojo.unlockedBossIDs`) |
| Persistence | Same key as before; `?unlock=all` and eight title taps still grant every boss |
| Art | Unlocked portraits reuse `boss_<id>_portrait` / `boss_<id>_idle_00` |

Arcade is **12 fights**. Stages 1–10 shuffle the remaining staff (exclude your fighter and the two finales; no repeats when the pool allows). **Stage 11 is always Austin. Stage 12 is always Sensei Moose.** HUD shows `STAGE N/12`. After stage 12 the Victory scene opens.

Beating a locked final writes their id into `dojo.unlockedBossIDs` and they become selectable on Select. `?fighter=` / `?vs=` still accept any catalog id (including retired starters) for playtest.

### Stage mapping (one landmark per opponent)

Each boss has a **unique** home stage from the locked landmark set (arcade 1–3 + Batch A/B/C). Free Play can still pick any stage; if you skip that pick, the opponent’s home stage is the default.

| Opponent | Stage | Asset prefix |
| --- | --- | --- |
| Misty | Lions Bridge | `stage1_*` |
| Lucas | Hilton Village | `stage_hiltonvillage_*` |
| Chris | Oyster Point | `stage_oysterpoint_*` |
| Christiano | Patrick Henry Mall | `stage_phmall_*` |
| Dakota | Newport News Shipyard | `stage_shipyard_*` |
| John K. | Hilton Elementary | `stage2_*` |
| Finley | Mariners' Museum | `stage_mariners_*` |
| Hudson | Warwick Blvd | `stage_subwaywarwick_*` |
| Michael | Newport News Park | `stage_nnpark_*` |
| Kasey | James River Bridge | `stage_jrbridge_*` |
| Jaylen | Colonial Capitol | `stage_colonial_*` |
| Amiyr | Busch Gardens | `stage_busch_*` |
| Shaun | Hampton Waterfront | `stage_hampton_*` |
| Ryan | Poquoson Waterfront | `stage_poquoson_*` |
| Austin | Local Stadium | `stage_stadium_*` |
| Sensei Moose | Axsom Martial Arts Dojo | `stage3_*` |

Ids live on `FighterDef.stageId` in `web/src/data/catalog.ts`. Background `sky` / `far` / `mid` keep parallax; **the fight floor (`master` / `near`) does not move**. Stages also run a light ambient loop (clouds, water shimmer, boat rock) when the plate supports it.

Pixel finals for Stage 1 / title / starter roster / Hilton / Dojo / boss batches 1–3 / Batch A–C landmarks are in `SenseiMoosesDojo/Assets.xcassets/`.

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

FightScene loads the current stage’s `sky` / `far` / `mid` / `master` / `near` on demand. Background layers parallax; the floor (`master` / `near`) stays pinned. Title prefers `moose_title_idle`; if that is missing it composes `moose_title_body` + `moose_title_head`.

### Stages

Web fight systems live in `web/src/` (Phaser). Native `Game/Stage.swift` is deferred.

### Best of 3 + countdown

- Each fight is **first to 2 round wins**. Round pips sit on each health plate; the center HUD shows `ROUND N · P – C · BEST OF 3`.
- **3 → 2 → 1 → FIGHT!** locks the pad until the last beat. The same countdown plays before every round.
- Arcade continues to the next boss after a short beat (same as native). Tap **Next Fight** (or the win panel) to skip. Overlay buttons sit on the canvas; continue uses a Phaser-clock restart so iPad Safari cannot drop the transition.

### Character scale

Previous body height was 210px. All fighters are **2×** (`FIGHTER_HEIGHT = 420`). **Sensei Moose is 30% bigger than the other characters** (`420 × 1.3`). Hitboxes scale with body height.

### Progressive difficulty

`web/src/game/difficulty.ts` — index **-1** is the intro dummy; **0…15** follow the boss ladder (Misty → Sensei Moose). Each step is strictly harder. Free Play uses the opponent’s ladder index when they are a boss.

| Index | Who | Attack CD | Approach | Block | CPU dmg dealt | CPU dmg taken | ULT use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| -1 | Intro dummy | 1.45s | 140px | 2% | 0.55× | 1.35× | low |
| 0 | Misty | 0.92s | 118px | 8% | 0.82× | 1.08× | 0.45 |
| 7 | Hudson (mid) | ~0.60s | ~93px | ~27% | ~1.10× | ~0.88× | ~0.70 |
| 15 | Sensei Moose | 0.28s | 68px | 46% | 1.38× | 0.68× | 0.95 |

Curves lerp monotonically on `t = index / 15`. Dummy is a fixed easy profile below Misty.

### PLAYER SELECT (SF2 homage, no Capcom IP)

Arcade and Free Play share one layout in `web/src/scenes/SelectScene.ts`:

- Large **1P / 2P** busts left and right (live roster portraits)
- Center **map plate C** (`select-map-plate-C.png`) with landmark dots
- Dots on real landmark lon/lat (`web/src/data/peninsula.ts`)
- **PLAYER SELECT** label
- Bottom **full staff roster** — unlocked portraits are colored and tappable. Ryan starts greyed until beaten in Arcade. Austin and Sensei Moose are selectable. Scratch starters are not listed.

Do **not** use `select-screen-C.png` as the select UI (baked-in stand-in heads). Map plate C stays as the peninsula. Title splash uses locked `title_bg_dojo` plus the `title_logo_00`–`07` glow loop (`web/src/game/titleArt.ts`). Audio: Title plays `title_attract_loop`; Select/Fight play `fight_a_loop`. SFX/BGM load from `assets/audio/manifest.json` after the first tap unlocks iPad Safari.

### Fighter anim sheets (Pixel)

**Starters** (`matt`, `simon`, `rich`, `amanda`, `jb`) have full action sets in `dojo-art/finals/fighters/<id>/` (`fighter_<id>_idle_00` … `sweep_03`). Export copies them into `web/public/assets/fighters/<id>/` so punch/kick/jump/block/crouch/sweep play in Phaser. Display height stays `FIGHTER_HEIGHT` 420 (2×).

**Sensei Moose pose-bar FINALS** drop in `web/fighter-sheets/senseiMoose/` (`idle_00` … `sweep_03`). Export prefers that idle over `moose_title_idle` and writes `boss_senseiMoose_idle_00` for fight/select. Height stays `MOOSE_HEIGHT_SCALE` 1.3. Ultimates unchanged.

Bosses still **stretch each idle** until their folders land. Overlay more sheets here and re-export:

```
web/fighter-sheets/<id>/idle_00.png
web/fighter-sheets/<id>/punch_00.png
web/fighter-sheets/<id>/kick_00.png
web/fighter-sheets/<id>/jump_00.png
web/fighter-sheets/<id>/block_00.png
web/fighter-sheets/<id>/crouch_00.png
web/fighter-sheets/<id>/sweep_00.png
```

See `web/ASSETS.md` and `web/src/game/anims.ts`. Extra frames: `_01`, `_02`, …

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
| Art | Locked 12-frame splash `ult_<id>_00`…`11` (FightScene). Austin + Sensei Moose also play fullscreen `ult_*_fx_*` overlays. Missing sheets fall back to colorized idle + flavor motion |

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

### Ultimate art (locked splash)

`dojo-art/finals/ultimates/<id>/` — 12 frames @~512h for starters and bosses. Austin and Sensei Moose also ship 10-frame fullscreen FX under `fx/`. `export-assets` copies them to `web/public/assets/ultimates/` and overwrites catalog `ult_<id>_00`. FightScene plays the sheet (not the old single-frame stand-in); Austin / Moose add the FX overlay.


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
web/                            MAIN playable game (Phaser 3 + TypeScript + Vite)
  src/scenes/                   Title, Select, Fight, Leaderboard
  src/game/                     fighter, controls, arcade, local unlocks / Top 10
  scripts/export-assets.mjs     copy PNGs from Assets.xcassets
  ASSETS.md                     where web art comes from
.github/workflows/deploy-pages.yml
SenseiMoosesDojo.xcodeproj/     native iPhone project (deferred)
SenseiMoosesDojo/
  Game/                         roster, bosses, arcade ladder, unlocks, art, fight
  Scenes/                       Title, Select, Fight, Leaderboard
  Assets.xcassets/              named drop-in imagesets (source of web art)
scripts/                        placeholder + project generators, structural check
```

Code loads sprites with `UIImage(named:)` / `SKTexture(imageNamed:)` using the exact names above. Missing art falls back to a labeled colored sprite so the loop still plays.
