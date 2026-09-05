# Sensei Moose's Dojo — Batch 2 pose-bar sheets (raw chroma)

**Batch:** Boss Batch 2 (johnk, finley, hudson, michael, kasey) — Misty pose-bar LOCKED (PR #10)  
**Do not touch:** matt, misty, batch1 (lucas / chris / christiano / dakota)  
**IDs:** johnk, finley, hudson, michael, kasey  
**Style:** Street Fighter II arcade + 64-bit N64 low-poly facets  
**Facing:** RIGHT  
**Gi:** Closed white karate gi, **BLACK belt**, barefoot  
**Background:** Solid magenta chroma `#FF00FF`  
**Layout:** One horizontal 16:9 sheet per animation. 4 panels for idle / punch / kick / jump / sweep. 2 panels for block / crouch.  
**Generator:** Cursor native `GenerateImage` (whole sheets only; no sliced frames)  
**Likeness:** Locked to catalog portrait + idle (`boss_<id>_portrait`, `boss_<id>_idle_00`) on every generate  
**Pose refs:** Matching Misty peak from locked pose-bar redo (PR #10) for punch / kick / jump / block / crouch / sweep (silhouette only, not likeness)

Total: **35 sheets** (5 fighters × 7 anims).

| Anim | Panels | Peak bar |
| --- | --- | --- |
| idle | 4 | Ready guard only; subtle breath bob; not attacking |
| punch | 4 | Chamber → launch → **PEAK fist locked out to the RIGHT** → recover |
| kick | 4 | Knee chamber → launch → **PEAK kicking leg fully extended RIGHT, one-legged** → recover |
| jump | 4 | Crouch load → rising → **PEAK both feet airborne** → descending |
| block | 2 | High X cross-guard in front of face/chest |
| crouch | 2 | Deep squat, thighs nearly parallel, full body visible |
| sweep | 4 | Drop → spin → **PEAK low, hand on ground, sweeping leg along floor RIGHT** → recover |

## johnk
Bowl-cut dark bangs, freckles, warm light-brown skin, smirk. Belt: **black**. Chest: yellow **pagoda** patch.
- `dojo-art-raw/fighters/johnk/raw_johnk_idle_sheet.png`
- `dojo-art-raw/fighters/johnk/raw_johnk_punch_sheet.png`
- `dojo-art-raw/fighters/johnk/raw_johnk_kick_sheet.png`
- `dojo-art-raw/fighters/johnk/raw_johnk_jump_sheet.png`
- `dojo-art-raw/fighters/johnk/raw_johnk_block_sheet.png`
- `dojo-art-raw/fighters/johnk/raw_johnk_crouch_sheet.png`
- `dojo-art-raw/fighters/johnk/raw_johnk_sweep_sheet.png`

## finley
Wavy medium brown hair, thin mustache / stubble. Belt: **black**. Chest: black patch with yellow **5-petal flower**.
- `dojo-art-raw/fighters/finley/raw_finley_idle_sheet.png`
- `dojo-art-raw/fighters/finley/raw_finley_punch_sheet.png`
- `dojo-art-raw/fighters/finley/raw_finley_kick_sheet.png`
- `dojo-art-raw/fighters/finley/raw_finley_jump_sheet.png`
- `dojo-art-raw/fighters/finley/raw_finley_block_sheet.png`
- `dojo-art-raw/fighters/finley/raw_finley_crouch_sheet.png`
- `dojo-art-raw/fighters/finley/raw_finley_sweep_sheet.png`

## hudson
Brown quiff / fade, blue eyes, tan, wide smile, stubble. Belt: **black**. Chest: gold/black **fist + laurel** (yellow dojo) patch.
- `dojo-art-raw/fighters/hudson/raw_hudson_idle_sheet.png`
- `dojo-art-raw/fighters/hudson/raw_hudson_punch_sheet.png`
- `dojo-art-raw/fighters/hudson/raw_hudson_kick_sheet.png`
- `dojo-art-raw/fighters/hudson/raw_hudson_jump_sheet.png`
- `dojo-art-raw/fighters/hudson/raw_hudson_block_sheet.png`
- `dojo-art-raw/fighters/hudson/raw_hudson_crouch_sheet.png`
- `dojo-art-raw/fighters/hudson/raw_hudson_sweep_sheet.png`

## michael
Dense short black afro, tan, thick brows. **DISTINCT large mole on left cheek (viewer's right) every frame.** Belt: **black**. Chest: **red 4-petal flower** patch.
- `dojo-art-raw/fighters/michael/raw_michael_idle_sheet.png`
- `dojo-art-raw/fighters/michael/raw_michael_punch_sheet.png`
- `dojo-art-raw/fighters/michael/raw_michael_kick_sheet.png`
- `dojo-art-raw/fighters/michael/raw_michael_jump_sheet.png`
- `dojo-art-raw/fighters/michael/raw_michael_block_sheet.png`
- `dojo-art-raw/fighters/michael/raw_michael_crouch_sheet.png`
- `dojo-art-raw/fighters/michael/raw_michael_sweep_sheet.png`

## kasey
Dense dark curly afro, medium-tan, smirk. Belt: **black**. Chest: gold/black **fist / eagle crest**. Mid-forearm sleeves OK.
- `dojo-art-raw/fighters/kasey/raw_kasey_idle_sheet.png`
- `dojo-art-raw/fighters/kasey/raw_kasey_punch_sheet.png`
- `dojo-art-raw/fighters/kasey/raw_kasey_kick_sheet.png`
- `dojo-art-raw/fighters/kasey/raw_kasey_jump_sheet.png`
- `dojo-art-raw/fighters/kasey/raw_kasey_block_sheet.png`
- `dojo-art-raw/fighters/kasey/raw_kasey_crouch_sheet.png`
- `dojo-art-raw/fighters/kasey/raw_kasey_sweep_sheet.png`

## Notes
- Raw sheets are game-pipeline inputs (chroma magenta, not sliced). Downstream slice / import is a later step.
- Artifact copies: `/opt/cursor/artifacts/assets/raw_<id>_<anim>_sheet.png` and `/opt/cursor/artifacts/batch2-pose/<id>/`.
- Self-reject rule: punch≈idle, kick≈idle, or jump feet on ground at peak → regen.
- Locked pose standard: Misty pose-bar redo (PR #10). This batch does not modify matt, misty, or batch1.
