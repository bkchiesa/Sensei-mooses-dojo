# JB action sprite sheets (HARD REDO)

Fighter: `jb`  
Style: Street Fighter II arcade sprite + 64-bit N64 low-poly flat-shaded facets  
Facing: **RIGHT** on every frame  
Background (raw sheets): solid magenta `#FF00FF` chroma  
Processed frames: transparent PNG, canvas 512px tall, content ~500px, 12px bottom margin  
Generator: Cursor native `GenerateImage`  
Not promoted into `SenseiMoosesDojo/Assets.xcassets` finals.

Likeness lock:

- `dojo-art-raw/fighters/jb/refs/fighter_jb_portrait.png`
- `dojo-art-raw/fighters/jb/refs/fighter_jb_idle_00.png`

Young man, light skin, short spiky black hair with jagged fringe. White karate gi with teal trim on collar, cuffs, and pant hems. Teal/black belt, teal wristbands, barefoot. Short wooden bo staff with teal-capped tips.

## QA contact sheet

- `dojo-art-raw/fighters/jb/jb_contact_sheet.png` — labeled rows idle/punch/kick/jump/block/crouch/sweep, checker under sprites.

## Processed transparent frames (~512px)

Saved under `dojo-art-raw/fighters/jb/frames/`:

### idle ×4
- `fighter_jb_idle_00.png`
- `fighter_jb_idle_01.png`
- `fighter_jb_idle_02.png`
- `fighter_jb_idle_03.png`

### punch ×4
- `fighter_jb_punch_00.png`
- `fighter_jb_punch_01.png`
- `fighter_jb_punch_02.png`
- `fighter_jb_punch_03.png`

### kick ×4
- `fighter_jb_kick_00.png`
- `fighter_jb_kick_01.png`
- `fighter_jb_kick_02.png`
- `fighter_jb_kick_03.png`

### jump ×4
- `fighter_jb_jump_00.png`
- `fighter_jb_jump_01.png`
- `fighter_jb_jump_02.png`
- `fighter_jb_jump_03.png`

### block ×2
- `fighter_jb_block_00.png`
- `fighter_jb_block_01.png`

### crouch ×2
- `fighter_jb_crouch_00.png`
- `fighter_jb_crouch_01.png`

### sweep ×4
- `fighter_jb_sweep_00.png`
- `fighter_jb_sweep_01.png`
- `fighter_jb_sweep_02.png`
- `fighter_jb_sweep_03.png`

## Raw horizontal sheets (16:9)

- `raw_jb_idle_sheet.png` — ready stance, open-palm lead, staff at hip
- `raw_jb_punch_sheet.png` — chamber → launch → fist locked right → recover
- `raw_jb_kick_sheet.png` — knee chamber → unfold → leg locked out → recover
- `raw_jb_jump_sheet.png` — squat load → rise → both feet airborne → descend
- `raw_jb_block_sheet.png` — crossed X-guard
- `raw_jb_crouch_sheet.png` — deep squat
- `raw_jb_sweep_sheet.png` — drop → plant → palm + low leg → rise

## Pipeline

- `dojo-art-raw/fighters/jb/process_jb_sheets.py` — magenta / near-black / blue chroma-key, equal-panel split + core-flood ownership, 500px idle content / 512 canvas / 12px bottom, jump air preserved, labeled contact sheet with checker under sprites.
