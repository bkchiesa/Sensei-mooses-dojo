# Pixel fighter sheets (drop-in)

Commit finished animation frames here. `npm run export-assets` copies them over the idle placeholders into `web/public/assets/fighters/<id>/`.

```
web/fighter-sheets/<id>/
  idle_00.png
  punch_00.png
  kick_00.png
  jump_00.png
  block_00.png
  crouch_00.png
  sweep_00.png
```

Extra frames: `punch_01.png`, `punch_02.png`, … Roster ids match the catalog (`matt`, `simon`, `misty`, `senseiMoose`, …).

Until a file exists for an anim, the web game stretches that fighter’s idle pose.
