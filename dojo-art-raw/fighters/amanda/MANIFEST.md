# Amanda action sprite sheets (HARD REDO)

Fighter: `amanda`  
Style: Street Fighter II arcade sprite + 64-bit N64 low-poly flat-shaded facets  
Facing: **RIGHT** on every frame  
Background (raw sheets): solid magenta `#FF00FF` chroma  
Processed frames: transparent PNG, ~512px tall, 12px bottom margin, bottom-aligned (jump peak keeps air gap)  
Generator: Cursor native `GenerateImage`  
Not promoted into `SenseiMoosesDojo/Assets.xcassets` finals.

Likeness lock (from catalog refs copied here):

- `dojo-art-raw/fighters/amanda/refs/fighter_amanda_portrait.png`
- `dojo-art-raw/fighters/amanda/refs/fighter_amanda_v3_fullbody.png`

Young woman, fair skin, long dark brown hair in layered low-poly spikes, large stylized blue/purple eyes. White karate gi, purple undershirt at the V-neck, purple sleeve/pant trim, thick purple belt, purple wristbands, barefoot. No chest patch. Not Misty (no blonde ponytail, no blue belt, no yellow pagoda).

## QA contact sheet

- `dojo-art-raw/fighters/amanda/amanda_contact_sheet.png` — labeled grid, one row per anim, frames left-to-right on checker under sprites. Confirm **punch ≠ idle ≠ kick ≠ jump**.

## Raw horizontal sheets (16:9)

| File | Anim | Panels | Pose language |
| --- | --- | --- | --- |
| `dojo-art-raw/fighters/amanda/raw_amanda_idle_sheet.png` | idle | 4 | Ready stance, open lead guard / rear fist at hip, planted feet, breath cycle. Not an attack. |
| `dojo-art-raw/fighters/amanda/raw_amanda_punch_sheet.png` | punch | 4 | Chamber → launch → **arm locked out RIGHT** → recover |
| `dojo-art-raw/fighters/amanda/raw_amanda_kick_sheet.png` | kick | 4 | Knee chamber → unfold → **leg locked out RIGHT** → recover |
| `dojo-art-raw/fighters/amanda/raw_amanda_jump_sheet.png` | jump | 4 | Crouch-load → rise → **both feet off the ground** → descend |
| `dojo-art-raw/fighters/amanda/raw_amanda_block_sheet.png` | block | 2 | Arms crossed in a big X in front of face and chest |
| `dojo-art-raw/fighters/amanda/raw_amanda_crouch_sheet.png` | crouch | 2 | Deep squat, full body (head to feet) visible |
| `dojo-art-raw/fighters/amanda/raw_amanda_sweep_sheet.png` | sweep | 4 | Drop low → hand plants → **palm on ground + low straight sweep** → rise |

## Processed transparent frames (~512px)

Saved under `dojo-art-raw/fighters/amanda/frames/`.

### idle ×4

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_idle_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_idle_01.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_idle_02.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_idle_03.png`

### punch ×4

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_punch_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_punch_01.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_punch_02.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_punch_03.png`

### kick ×4

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_kick_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_kick_01.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_kick_02.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_kick_03.png`

### jump ×4

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_jump_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_jump_01.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_jump_02.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_jump_03.png`

### block ×2

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_block_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_block_01.png`

### crouch ×2

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_crouch_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_crouch_01.png`

### sweep ×4

- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_sweep_00.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_sweep_01.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_sweep_02.png`
- `dojo-art-raw/fighters/amanda/frames/fighter_amanda_sweep_03.png`

## Pipeline

- `dojo-art-raw/fighters/amanda/process_amanda_sheets.py` — magenta / near-black / blue chroma-key, equal-panel split with overlap + core-flood (keeps overflowed limbs), scale idle content toward 500px on a 512 canvas with 12px bottom margin, build checker contact sheet.
