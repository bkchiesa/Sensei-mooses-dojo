# Matt action sprite sheets (HARD REDO)

Fighter: `matt`  
Style: Street Fighter II arcade sprite + 64-bit N64 low-poly flat-shaded facets  
Facing: **RIGHT** on every frame  
Background (raw sheets): solid magenta `#FF00FF` chroma  
Processed frames: transparent PNG, ~512px tall, bottom-aligned (jump peak keeps air gap)  
Generator: Cursor native `GenerateImage`  
Not promoted into `SenseiMoosesDojo/Assets.xcassets` finals.

Likeness lock (from catalog refs copied here):

- `dojo-art-raw/fighters/matt/refs/fighter_matt_portrait.png`
- `dojo-art-raw/fighters/matt/refs/fighter_matt_idle_00.png`

Young man, tan skin, short spiky brown hair, thick dark eyebrows, confident smirk. White karate gi (deep V-neck, mid-forearm sleeves), blue/black two-tone belt, blue fingerless gloves, barefoot.

## QA contact sheet

- `dojo-art-raw/fighters/matt/matt_contact_sheet.png` — labeled grid, one row per anim, frames left-to-right on a dark background. Use this to confirm **punch ≠ idle ≠ kick ≠ jump**.

## Raw horizontal sheets (16:9)

| File | Anim | Panels | Pose language |
| --- | --- | --- | --- |
| `dojo-art-raw/fighters/matt/raw_matt_idle_sheet.png` | idle | 4 | Ready stance, fists up, planted feet, breath cycle. Not an attack. |
| `dojo-art-raw/fighters/matt/raw_matt_punch_sheet.png` | punch | 4 | Chamber → launch → **arm locked out RIGHT** → recover |
| `dojo-art-raw/fighters/matt/raw_matt_kick_sheet.png` | kick | 4 | Knee chamber → launch → **leg locked out RIGHT** → recover |
| `dojo-art-raw/fighters/matt/raw_matt_jump_sheet.png` | jump | 4 | Crouch-load → rise → **both feet off the ground** → descend |
| `dojo-art-raw/fighters/matt/raw_matt_block_sheet.png` | block | 2 | Crossed / high guard in front of face and chest |
| `dojo-art-raw/fighters/matt/raw_matt_crouch_sheet.png` | crouch | 2 | Deep squat, full body (head to feet) visible |
| `dojo-art-raw/fighters/matt/raw_matt_sweep_sheet.png` | sweep | 4 | Drop low → hand on ground + low arc → **peak sweep** → recover |

## Processed transparent frames (~512px)

### idle ×4

- `dojo-art-raw/fighters/matt/fighter_matt_idle_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_idle_01.png`
- `dojo-art-raw/fighters/matt/fighter_matt_idle_02.png`
- `dojo-art-raw/fighters/matt/fighter_matt_idle_03.png`

### punch ×4

- `dojo-art-raw/fighters/matt/fighter_matt_punch_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_punch_01.png`
- `dojo-art-raw/fighters/matt/fighter_matt_punch_02.png`
- `dojo-art-raw/fighters/matt/fighter_matt_punch_03.png`

### kick ×4

- `dojo-art-raw/fighters/matt/fighter_matt_kick_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_kick_01.png`
- `dojo-art-raw/fighters/matt/fighter_matt_kick_02.png`
- `dojo-art-raw/fighters/matt/fighter_matt_kick_03.png`

### jump ×4

- `dojo-art-raw/fighters/matt/fighter_matt_jump_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_jump_01.png`
- `dojo-art-raw/fighters/matt/fighter_matt_jump_02.png`
- `dojo-art-raw/fighters/matt/fighter_matt_jump_03.png`

### block ×2

- `dojo-art-raw/fighters/matt/fighter_matt_block_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_block_01.png`

### crouch ×2

- `dojo-art-raw/fighters/matt/fighter_matt_crouch_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_crouch_01.png`

### sweep ×4

- `dojo-art-raw/fighters/matt/fighter_matt_sweep_00.png`
- `dojo-art-raw/fighters/matt/fighter_matt_sweep_01.png`
- `dojo-art-raw/fighters/matt/fighter_matt_sweep_02.png`
- `dojo-art-raw/fighters/matt/fighter_matt_sweep_03.png`

## Pipeline

- `dojo-art-raw/fighters/matt/process_matt_sheets.py` — chroma-key, core-flood slice (keeps overflowed limbs), scale to ~512, build contact sheet.
