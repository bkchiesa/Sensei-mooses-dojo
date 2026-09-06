# Casper fighter art pack (newpack)

Fighter: `casper`  
Kind: new pack (not promoted to roster / `Assets.xcassets`)  
Style: Street Fighter II arcade sprite + 64-bit N64 low-poly flat-shaded facets  
Facing: **RIGHT** on every standing / action frame  
Background: solid magenta `#FF00FF` chroma (transparent-ready)  
Content height: ~512px (jump peaks keep an air gap under the feet)  
Defeat: content width ≈512, frame aspect ≈1.7  
Generator: Cursor native `GenerateImage` + `process_casper.py`  
**Do not overwrite `fighter_casper_idle_00`** — this drop starts at `idle_01`.

## Locked look

- Young boy (~9–11), child proportions (not teen / not adult)
- Sandy blond chunky spiked hair
- White **closed** gi, **black belt at the waist**, barefoot
- Optional small gold certificate / dojo accent on the chest
- Ref: `dojo-art-raw/newpacks/casper/refs/casper_locked_look.png`

Pose language matches Misty Pass-3 clarity (windup → peak → recovery).

## QA contact sheets

- `casper_pose_contact.png` — labeled pose-bar grid
- `casper_ult_contact.png` — 12-frame certificate / rank splash

## Pose-bar frames

### idle ×3 (breathe only — no idle_00)

- `fighter_casper_idle_01.png`
- `fighter_casper_idle_02.png`
- `fighter_casper_idle_03.png`

### punch ×4

- `fighter_casper_punch_00.png` chamber
- `fighter_casper_punch_01.png` launch
- `fighter_casper_punch_02.png` **peak — fist extended**
- `fighter_casper_punch_03.png` recover

### kick ×4

- `fighter_casper_kick_00.png` knee chamber
- `fighter_casper_kick_01.png` launch
- `fighter_casper_kick_02.png` **peak — leg out**
- `fighter_casper_kick_03.png` recover

### jump ×4

- `fighter_casper_jump_00.png` crouch-load
- `fighter_casper_jump_01.png` airborne
- `fighter_casper_jump_02.png` **peak — both feet off the ground**
- `fighter_casper_jump_03.png` descend

### block ×2

- `fighter_casper_block_00.png` X-guard
- `fighter_casper_block_01.png` high guard

### crouch ×2

- `fighter_casper_crouch_00.png` deep squat, full body
- `fighter_casper_crouch_01.png` squat shift

### sweep ×4

- `fighter_casper_sweep_00.png` drop
- `fighter_casper_sweep_01.png` hand down
- `fighter_casper_sweep_02.png` **peak — low leg + hand on ground**
- `fighter_casper_sweep_03.png` recover

### hit / defeat

- `fighter_casper_hit_00.png` recoil stun
- `fighter_casper_defeat_00.png` laying KO

## Ultimate splash — Certificate / Rank (12f)

Family-friendly scroll / certificate energy, rank celebration. Same likeness, face RIGHT-ish.

- `ult_casper_00.png` … `ult_casper_11.png`

No Capcom IP, no licensed marks, no HUD text.
