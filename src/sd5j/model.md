---
prev:
  text: Connecting
  link: /sd5j/connecting

next:
  text: Surfaces and Buttons
  link: /sd5j/surfaces

title: Deck Model
description: How decks are described and matched by display name.
---

# Deck Model

`DeckModel` is a final class with one static constant per supported deck: columns, rows, key and
screen geometry, encoder and touchpoint counts, plus the `ImageSpec` describing how key and
screen images are encoded (size, rotation, mirroring, BMP or JPEG).

Models are matched by display name. The app reports a device and `DeckModel.fromDisplayName`
maps it onto the known entry; an unknown model is ignored until the library grows a table entry
for it. `DeckModel.keyIndex(column, row)` converts grid positions to the flat key indices the
wire protocol uses.

`encoderCount()` and `touchpointCount()` describe the hardware, not what the transport carries.
Encoders and screen taps do arrive, but `touchpointCount()` is a spec sheet number: there are no
touchpoint events to pair it with.

## Reading a model

```java
DeckModel model = DeckModel.fromDisplayName("Stream Deck XL");
if (model == null) {
    // The app reported a deck this build of the library does not know yet.
    return;
}

model.displayName();   // "Stream Deck XL"
model.columns();       // 8
model.rows();          // 4
model.keyCount();      // 32
model.encoderCount();  // 0 on the XL, 4 on the Plus
```

`keyImage()` and `screenImage()` describe the panel itself:

```java
DeckModel.ImageSpec key = model.keyImage();
key.mode();       // BMP or JPEG
key.width();      // 96 on the XL and Neo, 120 on the Plus, 80 on the Mini
key.height();
key.rotation();   // DeckModel.Rot, the quarter turn the panel expects
key.mirrorX();    // the Mini family draws mirrored on the Y axis, not the X axis
key.mirrorY();
```

`keyImage()` is `null` on the Pedal, which has pedals rather than keys, so guard it before
you draw.

## Grid positions

Keys are addressed as a flat index in the same right-to-left, down-the-columns order the app
uses. Convert between forms freely:

```java
model.keyIndex(3, 1);   // flat index for column 3, row 1
model.columnOf(11);     // 3
model.rowOf(11);        // 1
```

## Screens

A model that has a screen, the Plus and the Neo, reports its strip geometry:

```java
DeckModel.ImageSpec screen = model.screenImage();
if (screen != null) {
    int width = screen.width();   // 800 on the Plus, 100 on the Plus XL, 248 on the Neo
    int height = screen.height(); // 100 on the Plus, 1200 on the Plus XL, 58 on the Neo
}
```

The strip is turned on some models (`R180` on the Neo, `R270` on the Plus XL), so draw it
upright and let `DeckImageCodec` do the turning. `setScreenImage` is accepted by the API but
is a no-op on the remote transport, because the app draws the strip itself. Treat screens as a
future capability and do not build a layout that only makes sense with one.

## Enumerating known decks

There is no `values()`. `DeckModel` is a class, not an enum, so the supported decks are
reached through their constants:

```java
for (DeckModel known : List.of(DeckModel.MINI, DeckModel.MK2, DeckModel.PLUS,
        DeckModel.NEO, DeckModel.XL, DeckModel.PEDAL)) {
    System.out.println(known.displayName() + "  " + known.columns() + "x" + known.rows());
}
```

A layout that needs a touchscreen or encoders can test a model before committing to it, e.g.
skip models without key screens and bail out on the Pedal, which has none:

```java
if (model.hasKeyScreens() && model.encoderCount() > 0) { /* safe to use both */ }
```