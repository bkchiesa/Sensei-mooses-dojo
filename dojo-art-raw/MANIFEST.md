# Sensei Moose's Dojo — Batch 1 REST pose-bar redo (raw chroma sheets)

**Batch:** Boss Batch 1 REST (lucas, chris, christiano, dakota) — Misty pose-bar LOCKED  
**Do not touch:** matt, misty  
**IDs:** lucas, chris, christiano, dakota  
**Style:** Street Fighter II arcade + 64-bit N64 low-poly facets  
**Facing:** RIGHT  
**Gi:** Closed white karate gi, barefoot  
**Background:** Solid magenta chroma `#FF00FF`  
**Layout:** One horizontal 16:9 sheet per animation. 4 panels for idle / punch / kick / jump / sweep. 2 panels for block / crouch.  
**Generator:** Cursor native `GenerateImage` (whole sheets only; no sliced frames)  
**Likeness:** Locked to catalog portrait + idle (`boss_<id>_portrait`, `boss_<id>_idle_00`) on every generate  
**Pose refs:** Matching Misty peak from locked pose-bar redo (PR #10) for punch / kick / jump / block / crouch / sweep (silhouette only, not likeness)

Total: **28 sheets** (4 fighters × 7 anims).

| Anim | Panels | Peak bar |
| --- | --- | --- |
| idle | 4 | Ready guard only; subtle breath bob; not attacking |
| punch | 4 | Chamber → launch → **PEAK fist locked out to the RIGHT** → recover |
| kick | 4 | Knee chamber → launch → **PEAK kicking leg fully extended RIGHT, one-legged** → recover |
| jump | 4 | Crouch load → rising → **PEAK both feet airborne** → descending |
| block | 2 | High X cross-guard in front of face/chest |
| crouch | 2 | Deep squat, thighs nearly parallel, full body visible |
| sweep | 4 | Drop → spin → **PEAK low, hand on ground, sweeping leg along floor RIGHT** → recover |

## lucas
Young boy ~8–12, round face, big smile, short messy dark brown hair. Belt: **green**. Chest: yellow circular **black-fist** patch. Child proportions; full body fills frame.
- `dojo-art-raw/fighters/lucas/raw_lucas_idle_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_punch_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_kick_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_jump_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_block_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_crouch_sheet.png`
- `dojo-art-raw/fighters/lucas/raw_lucas_sweep_sheet.png`

## chris
Young Black man, short neat fade, friendly smile, athletic. Belt: **purple**. Chest: **red/gold** dojo patch (gold border, red field, black symbol).
- `dojo-art-raw/fighters/chris/raw_chris_idle_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_punch_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_kick_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_jump_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_block_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_crouch_sheet.png`
- `dojo-art-raw/fighters/chris/raw_chris_sweep_sheet.png`

## christiano
Curly/wavy dark brown hair styled up. **Thick black-rimmed glasses on every frame.** Belt: **brown**. Chest: **gold fist/moose** patch.
- `dojo-art-raw/fighters/christiano/raw_christiano_idle_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_punch_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_kick_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_jump_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_block_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_crouch_sheet.png`
- `dojo-art-raw/fighters/christiano/raw_christiano_sweep_sheet.png`

## dakota
Tan skin, dark hair volume swept with forehead clumps. Belt: **orange** (locked — not brown). Chest: yellow **fist** patch.
- `dojo-art-raw/fighters/dakota/raw_dakota_idle_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_punch_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_kick_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_jump_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_block_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_crouch_sheet.png`
- `dojo-art-raw/fighters/dakota/raw_dakota_sweep_sheet.png`

## Notes
- Raw sheets are game-pipeline inputs (chroma magenta, not sliced). Downstream slice / import is a later step.
- Artifact copies: `/opt/cursor/artifacts/assets/raw_<id>_<anim>_sheet.png` and `/opt/cursor/artifacts/batch1-rest-pose-redo/<id>/`.
- Self-reject rule: punch≈idle, kick≈idle, or jump feet on ground at peak → regen.
- Locked pose standard: Misty pose-bar redo (PR #10). This redo does not modify matt or misty.
