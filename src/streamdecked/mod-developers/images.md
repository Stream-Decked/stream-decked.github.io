---
prev:
  text: Registering Layouts
  link: /streamdecked/mod-developers/registry

next:
  text: Events
  link: /streamdecked/mod-developers/events

title: Images and Text
description: Drawing on keys with DeckImage and DeckText.
---

# Images and Text

`DeckImage` is a plain ARGB pixel buffer. It is mutable and not thread safe: build one,
hand it to the API, and the driver thread will do the rest.

```java
DeckImage img = DeckImage.black(96, 96);
img.draw(logo, 4, 4);
img.tint(0x80FFFFFF);
```

## Creating

- `filled(width, height, argb)` and `black(width, height)`
- `wrap(width, height, int[])` to own a pixel array
- `decode(InputStream|byte[])` for PNG, JPEG, GIF and BMP bytes
- `fromBufferedImage(BufferedImage)`

## Transforming

Some methods mutate in place (`fill`, `fillRect`, `draw`, `tint`, `flatten`); the rest
return a new image:

- `resize` (bilinear) and `pixelResize` (nearest neighbor, keeps pixel art crisp)
- `fitInto`, `pixelFitInto` (fit inside a box on a background) and `coverInto` (cover, crop overflow)
- `crop`, `mirrorX`, `mirrorY`, `rotate90`, `rotate180`, `rotate270`, `copy`

A `DeckButton.render(width, height)` receives the panel's native key size (72, 80, 96 or
120 square) and returns the `DeckImage` to show.

## Text

`DeckText` is the only class that touches AWT fonts. The driver warms AWT up on its own
thread at startup, so on macOS the game's main thread never claims it. Keep using it only
from render code, which runs on the driver thread.

```java
DeckImage label = DeckText.label(width, height, "Warp", 0xFF7FFFD4, 0xFF000000);
```

`label` centres the text and shrinks the font until it fits. `drawWrapped` stamps
word-wrapped text into a box on an existing image.

## Quick button factories

- `DeckButton.of(image, onPress)` fixed image, action on press
- `DeckButton.text(label, textArgb, backgroundArgb, onPress)` text on a solid background
- `DeckButton.labelled(icon, label, onPress)` icon with a caption strip along the bottom
- `DeckButton.folder`, `back`, `nextPage`, `previousPage` for navigation

`onPress` (and `onDown`/`onUp` override points) run on the client tick, so they may touch
game state freely.