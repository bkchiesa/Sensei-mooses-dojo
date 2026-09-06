# Victory screen (stub)

Canvas: **1280×800** (same as title / stage HUD frame).

## Files
- `victory_bg_dojo.png` — dojo backdrop (copied from `finals/ui/title/title_bg_dojo.png`; stub until a dedicated victory plate locks)
- `victory_layout_guide.png` — labeled slot guide over the same bg

## Layout (dynamic assembly by web)
| Slot | Role | Approx region |
|------|------|----------------|
| Hero standing | Winner pose (idle / victory) | Center-back, ~y **120–520**, ~280×400 guide |
| D1–D8 | Defeated laydowns | Front arc along ~y 580–700; up to **8** fighters |

### Asset wiring (when ready)
- Winner: prefer a victory/idle standing frame for the active fighter
- Defeated: `fighter_<id>_defeat_00.png` (laydown) when available; fall back to a darkened idle crop until defeat frames land
- Order D1…D8 left→right along the arc; omit unused slots rather than stretching

### Notes
- No Capcom/SF logos
- Do **not** bake roster into a locked composite yet — web composites slots over `victory_bg_dojo.png`
- See `victory_layout_guide.png` for visual placement
