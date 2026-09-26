---
prev:
  text: Events
  link: /sd5j/events

next:
  text: Depending on StreamDecked
  link: /streamdecked/mod-developers/depending

title: Images
description: DeckImage, text and the button and surface layer.
---

# Images

`DeckImage` is a plain ARGB pixel buffer (`filled`, `black`, `decode`, `fromBufferedImage`)
with transforms and text compositing applied in place. `DeckImageCodec.encodeKey(model,
image)` produces the bytes `setKeyImage` uploads. `DeckText` handles AWT font rendering and is
the only class that touches AWT.

## Building a key image

```java
// A solid panel, then stamp a decoded texture on top.
DeckImage panel = DeckImage.filled(96, 96, 0xFF111122);
DeckImage logo = DeckImage.decode(pngBytes);        // PNG, JPEG, GIF or BMP
panel.draw(logo, 8, 8);

// Fit the result to the deck, cropping overflow.
deck.setKeyImage(0, panel.coverInto(96, 96));
```

`DeckImage` is not thread safe: build the image off the driver thread and hand it over, or
build it inside the `DeckTask` you submit.

## Text labels

`DeckText.label` centres and font-fits a label, and is the one API that touches AWT:

```java
DeckImage warp = DeckText.label(96, 96, "Warp", 0xFF7FFFD4, 0xFF000000);
deck.setKeyImage(3, warp);

// Word-wrapped copy into a corner of an existing image.
DeckText.drawWrapped(panel, "Hold to arm", DeckText.DEFAULT_FONT, 0xFFFFFFFF,
        4, 60, panel.width() - 8, 32);
```

Call `DeckText.warmup()` once on a background thread so the first label does not pay the AWT
startup cost on the caller.

## Encode once, upload many

Encoding is the expensive half. `setKeyImageEncoded` skips it when the bytes are shared:

```java
byte[] logo = DeckImageCodec.encodeKey(model, splash);
for (int key : new int[] {0, 1, 2}) {
    deck.setKeyImageEncoded(key, logo);
}
// Or throw that key away:
deck.clearKey(4);   // uploads DeckImageCodec.blankKey(model)
```

## Icon plus caption

`DeckText.iconWithCaption` is the compositor behind `DeckButton.labelled` and
`NamedButton.setCaption`. It takes an icon, a caption and a caption colour, and returns the
image a key shows:

```java
DeckImage labelled = DeckText.iconWithCaption(speakerOn, "Mute", 96, 96, 0xFFFFFFFF);
```

A blank or `null` caption gives the icon the whole key, a `null` icon leaves the caption on a
solid panel, and both `null` is a blank key. Call it directly when a caption has to be drawn
on something that is not a button.

## Pixel art

Minecraft textures are the reason `pixel*` exists. `pixelResize` and `pixelFitInto` use
nearest neighbour, so a 16x16 block or item stays square instead of turning to mush, while
`resize` and `fitInto` are bilinear and better for photographic or scaled art.

```java
DeckImage icon = DeckImage.decode(pngBytes);        // a 16x16 block or item
surface.setButton(0, DeckButton.of(icon, onPress));
```

The button factories pixel-fit the icon for you, so `DeckButton.of` and `labelled` are safe
for a raw 16x16 texture. Reach for `fitInto` only when the art is not pixel art.

## Buttons and surfaces

The layout layer pairs a `DeckButton` (or `NamedButton`) with a `DeckSurface`. Buttons render
themselves, so you only declare what they show:

```java
surface.setButton(0, DeckButton.of(icon, () -> openMenu()));
surface.setButton(1, DeckButton.text("Hi", 0xFFFFFFFF, 0xFF4477AA, this::sayHi));
NamedButton mute = surface.putButton("mute", speakerOn, this::toggleMute);

// Mutating the returned instance redraws wherever it is placed.
mute.setIcon(mutedIcon);
mute.setCaption("Muted", 0xFFFF5555);
```

Build buttons from data the button already holds: `render(width, height)` runs on the driver
thread and must not touch game state. The same rule lands on `DeckText`, which is only safe
from render code. [Surfaces and buttons](/sd5j/surfaces) covers the rest.