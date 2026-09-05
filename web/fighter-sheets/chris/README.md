# Chris pose-bar FINALS

Pixel locked frames. Filenames must stay:

```
idle_00.png … idle_03.png
punch_00.png … punch_03.png
kick_00.png … kick_03.png
jump_00.png … jump_03.png
block_00.png block_01.png
crouch_00.png crouch_01.png
sweep_00.png … sweep_03.png
```

Do not commit the contact sheet here. Magenta chroma stays as-is. No rescale/recolor.
`npm run export-assets` copies these over the catalog idle placeholder (`web/fighter-sheets/<id>/` wins).
