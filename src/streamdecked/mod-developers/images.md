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

## Minecraft textures

`DeckTextures` is the mod-side helper, and it is the one to reach for in a mod because it
already knows where the game keeps its textures.

```java
DeckImage block = DeckTextures.block(Blocks.STONE);
DeckImage item = DeckTextures.item(Items.DIAMOND);
DeckImage stack = DeckTextures.item(stack);          // respects components
DeckImage custom = DeckTextures.load(id);            // any ResourceLocation
```

`item(Item)`, `item(ItemStack)` and `block(Block)` are **nullable**: they return null when the
texture is not on disk, and `item` falls back from `textures/item/...` to
`textures/block/...` for block items. `registry.register` rejects a null icon, so check it.

`pixelScale(source, w, h)` and `pixelFit(...)` scale nearest-neighbour for anything that is
not already a `DeckImage` from `DeckTextures`. `invalidate()` drops the cache and is called
for you on a resource reload.

## Pixel art

Minecraft textures are 16x16 and must stay crisp. `pixelResize` and `pixelFitInto` use
nearest neighbour, while `resize` and `fitInto` are bilinear and better for scaled or
photographic art.

```java
img.pixelResize(96, 96);   // blocky, correct for items and blocks
img.resize(96, 96);        // smooth, correct for anything else
```

The button factories pixel-fit the icon for you, so handing `DeckButton.of` a raw 16x16
texture already does the right thing. Reach for `fitInto` only when the art is not pixel art.

## Text

`DeckText` is the only class that touches AWT fonts. The driver warms AWT up on its own
thread at startup, so on macOS the game's main thread never claims it. Keep using it only
from render code, which runs on the driver thread.

```java
DeckImage label = DeckText.label(width, height, "Warp", 0xFF7FFFD4, 0xFF000000);
```

`label` centres the text and shrinks the font until it fits. `drawWrapped` stamps
word-wrapped text into a box on an existing image. `iconWithCaption` draws an icon with a
caption strip and is what the captioned buttons use.

## Quick button factories

- `DeckButton.of(image, onPress)` fixed image, action on press
- `DeckButton.text(label, textArgb, backgroundArgb, onPress)` text on a solid background
- `DeckButton.labelled(icon, label, onPress)` icon with a caption strip along the bottom
- `DeckButton.named(name, icon, caption, onPress)` a `NamedButton` you can look up later
- `DeckButton.folder`, `back`, `nextPage`, `previousPage` for navigation

A blank or null caption gives the icon the whole key, so `of` and `labelled` with an empty
label are the same picture. See [Surfaces and Buttons](/sd5j/surfaces) for named buttons.

`onPress` (and `onDown`/`onUp` override points) run on the client tick, so they may touch
game state freely.