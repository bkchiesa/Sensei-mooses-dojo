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

## Pipeline

- `dojo-art-raw/fighters/jb/process_jb_sheets.py` — magenta / near-black / blue chroma-key, equal-panel split with overlap, bottom-align to 512, jump air preserved, contact sheet.
