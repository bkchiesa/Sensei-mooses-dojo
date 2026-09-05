# Character select UI — LOCKED

Brandon lock via Guido: 2026-09-05 (map plate C + screen C)

## Files
- `select-screen-C.png` / `select_screen.png` — full select screen (SF2-homage layout; Lower Peninsula oval; stand-in portraits)
- `select-map-plate-C.png` / `select_map_plate.png` — PLAYER SELECT map plate (OSM-faithful coastline, painted stage dots)
- `select-map-plate-C-sidebyside.png` — OSM | concept review aid (not exported to the web game)
- `hampton-roads-map.svg` — geo-faithful fallback if the PNG plate is missing

## Web wiring
`web/scripts/export-assets.mjs` prefers the **C** filenames, publishes them to `web/public/assets/ui/select/`, and writes `plate.json`. SelectScene loads screen C as the wash and plate C as the oval map. Code dots use WGS84 (`web/src/data/peninsula.ts`); on the framed 1920×1080 plate they project through `PLATE_C_MAP_RECT`. Live roster busts / grid cover the stand-in portraits.

## Notes
- No Capcom/SF logos
- Stage dots: geo lat/lon (Todd Stadium = local stadium / `stadium`)
- Portraits on screen C are stand-ins — web overlays the locked roster
- Concepts remain under `dojo-art/concepts/ui/select/`
