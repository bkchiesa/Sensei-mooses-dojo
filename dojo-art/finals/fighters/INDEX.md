# Fighter action FINALS (Pixel drop-in)

Sliced frames for the Phaser anim system. `npm run export-assets` copies them to `web/public/assets/fighters/<id>/<anim>_NN.png` and lists them in `index.json`.

## Naming

```
dojo-art/finals/fighters/<id>/fighter_<id>_<anim>_NN.png
```

`anim` ∈ `idle` | `punch` | `kick` | `jump` | `block` | `crouch` | `sweep`

| Anim | Frames |
| --- | --- |
| idle, punch, kick, jump, sweep | `_00` … `_03` |
| block, crouch | `_00` `_01` |

Face **right**. Display height in-game is **420px** (Brandon 2×). Source art is ~512px tall (Matt’s current set is 256px tall; Phaser scales to 420 either way).

Portraits stay in the native catalog (`fighter_<id>_portrait`). Do **not** commit contact sheets here.

Optional overlay that wins on re-export: `web/fighter-sheets/<id>/<anim>_NN.png`.

## Wired

| Id | Status |
| --- | --- |
| matt, simon, rich, amanda, jb | 24 action frames |
| senseiMoose / moose | incoming — ~666px, display 1.3× (`MOOSE_HEIGHT_SCALE`). Ultimates unchanged. |
| misty | incoming — drop-in `web/fighter-sheets/misty/<anim>_NN.png` (overlay wins) |
| lucas | incoming — drop-in `web/fighter-sheets/lucas/<anim>_NN.png` (overlay wins) |
| chris | incoming — drop-in `web/fighter-sheets/chris/<anim>_NN.png` (overlay wins) |
| other bosses | incoming — catalog idle fallback until their folders land |
