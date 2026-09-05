# Sensei Moose's Dojo — raw sprite sheets

**Batch:** Boss Batch 1 (unlockable fighters)  
**IDs:** misty, lucas, chris, christiano, dakota  
**Style:** Street Fighter II arcade fighter sprite + 64-bit N64 low-poly charm  
**Facing:** RIGHT  
**Gi:** Closed, family-friendly karate gi  
**Background:** Solid magenta chroma `#FF00FF`  
**Layout:** One horizontal sheet per animation (16:9). 4 panels for idle / punch / kick / jump / sweep. 2 panels for block / crouch.  
**Likeness:** Locked to catalog portrait + idle refs (`boss_<id>_portrait`, `boss_<id>_idle_00`).

Total: **35 sheets** (5 fighters × 7 anims).

## misty

Belt: **blue**. Chest: yellow circular pagoda patch.

- `dojo-art-raw/fighters/misty/raw_misty_idle_sheet.png`
- `dojo-art-raw/fighters/misty/raw_misty_punch_sheet.png`
- `dojo-art-raw/fighters/misty/raw_misty_kick_sheet.png`
- `dojo-art-raw/fighters/misty/raw_misty_jump_sheet.png`
- `dojo-art-raw/fighters/misty/raw_misty_block_sheet.png`
- `dojo-art-raw/fighters/misty/raw_misty_crouch_sheet.png`
- `dojo-art-raw/fighters/misty/raw_misty_sweep_sheet.png`

## lucas

Belt: **green**. Chest: yellow circular fist-icon patch.

- `dojo-art-raw/fighters/lucas/raw_lucas_idle_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_punch_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_kick_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_jump_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_block_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_crouch_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_sweep_sheet.png`

## chris

Belt: **purple**. Chest: red/gold circular martial-arts patch.

- `dojo-art-raw/fighters/chris/raw_chris_idle_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_punch_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_kick_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_jump_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_block_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_crouch_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_sweep_sheet.png`

## christiano

Belt: **brown**. Chest: yellow circular moose-head dojo patch. Black-rimmed glasses on every frame.

- `dojo-art-raw/fighters/christiano/raw_christiano_idle_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_punch_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_kick_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_jump_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_block_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_crouch_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_sweep_sheet.png`

## dakota

Belt: **orange** (override vs brown idle ref). Chest: gold circular emblem. Mid-forearm sleeves.

- `dojo-art-raw/fighters/dakota/raw_dakota_idle_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_punch_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_kick_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_jump_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_block_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_crouch_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_sweep_sheet.png`

## Notes

- Raw sheets are game-pipeline inputs (chroma magenta, not sliced). Downstream slice / import is a later step.
- Locked refs used for generation: `SenseiMoosesDojo/Assets.xcassets/boss_<id>_portrait.imageset` and `boss_<id>_idle_00.imageset`.
