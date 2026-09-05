# PLAYER SELECT UI (Pixel drop-in)

Homage layout (no Capcom IP): large 1P / 2P portraits, **Virginia Lower Peninsula / Hampton Roads** map in the center, `PLAYER SELECT` label, fighter headshot grid along the bottom.

Drop finals here. `npm run export-assets` copies them to `web/public/assets/ui/select/`.

| File | Role |
| --- | --- |
| `hampton-roads-map.png` (or `.svg`) | Center map plate. Dots are drawn in code on top so they stay interactive. |
| `select-panel.png` | Optional portrait frame |
| `select-dot.png` | Optional location pip |

Until these exist, the web game draws a labeled placeholder peninsula (real geography UVs in `web/src/data/peninsula.ts`).

Do **not** include Street Fighter wordmarks, globe, or character likenesses.
