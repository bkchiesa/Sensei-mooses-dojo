# Rich action sprite sheets (HARD REDO)

Fighter: `rich`  
Style: Street Fighter II arcade sprite + 64-bit N64 low-poly flat-shaded facets  
Facing: **RIGHT** on every frame  
Background (raw sheets): solid magenta `#FF00FF` chroma  
Processed frames: transparent PNG, 512×512, content scaled from idle (~500px), 12px bottom margin (jump peak keeps air gap)  
Generator: Cursor native `GenerateImage`  
Not promoted into `SenseiMoosesDojo/Assets.xcassets` finals.

Likeness lock (copied here):

- `dojo-art-raw/fighters/rich/refs/fighter_rich_portrait.png`
- `dojo-art-raw/fighters/rich/refs/fighter_rich_fullbody_likeness.png`

Young man, brown/dark skin, short black hair, thick black eyebrows, large dark eyes, determined intense expression. Bright red headband with long trailing tails. White karate gi (deep V-neck, mid-forearm sleeves), green martial arts belt, barefoot.

## QA contact sheet

- `dojo-art-raw/fighters/rich/rich_contact_sheet.png` — labeled rows idle / punch / kick / jump / block / crouch / sweep, checker under sprites.

## Raw horizontal sheets (16:9)

| File | Anim | Panels | Pose language |
| --- | --- | --- | --- |
| `dojo-art-raw/fighters/rich/raw_rich_idle_sheet.png` | idle | 4 | Ready stance, fists at chin-chest, planted feet, breath bob. Not an attack. |
| `dojo-art-raw/fighters/rich/raw_rich_punch_sheet.png` | punch | 4 | Chamber → launch → **arm locked out RIGHT** → recover |
| `dojo-art-raw/fighters/rich/raw_rich_kick_sheet.png` | kick | 4 | Knee chamber → unfold → **leg locked out RIGHT** → recover |
| `dojo-art-raw/fighters/rich/raw_rich_jump_sheet.png` | jump | 4 | Crouch-load → rise → **both feet airborne** → descend |
| `dojo-art-raw/fighters/rich/raw_rich_block_sheet.png` | block | 2 | Arms crossed in a big X in front of face/chest |
| `dojo-art-raw/fighters/rich/raw_rich_crouch_sheet.png` | crouch | 2 | Deep squat, hips near knees, full body visible |
| `dojo-art-raw/fighters/rich/raw_rich_sweep_sheet.png` | sweep | 4 | Drop low → hand plants → **palm on ground + low straight leg** → rise |

## Processed transparent frames (512×512)

Saved under `dojo-art-raw/fighters/rich/frames/`:

### idle ×4

- `fighter_rich_idle_00.png`
- `fighter_rich_idle_01.png`
- `fighter_rich_idle_02.png`
- `fighter_rich_idle_03.png`

### punch ×4

- `fighter_rich_punch_00.png`
- `fighter_rich_punch_01.png`
- `fighter_rich_punch_02.png`
- `fighter_rich_punch_03.png`

### kick ×4

- `fighter_rich_kick_00.png`
- `fighter_rich_kick_01.png`
- `fighter_rich_kick_02.png`
- `fighter_rich_kick_03.png`

### jump ×4

- `fighter_rich_jump_00.png`
- `fighter_rich_jump_01.png`
- `fighter_rich_jump_02.png`
- `fighter_rich_jump_03.png`

### block ×2

- `fighter_rich_block_00.png`
- `fighter_rich_block_01.png`

### crouch ×2

- `fighter_rich_crouch_00.png`
- `fighter_rich_crouch_01.png`

### sweep ×4

- `fighter_rich_sweep_00.png`
- `fighter_rich_sweep_01.png`
- `fighter_rich_sweep_02.png`
- `fighter_rich_sweep_03.png`

## Pipeline

- `dojo-art-raw/fighters/rich/process_rich_sheets.py` — magenta / near-black / blue chroma-key, equal-panel split with slight overlap, scale so idle content ≈ 500px, 512 canvas, 12px bottom margin, labeled checker contact sheet.
