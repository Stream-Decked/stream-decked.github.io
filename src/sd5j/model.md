---
prev:
  text: Connecting
  link: /sd5j/connecting

next:
  text: Events
  link: /sd5j/events

title: Deck Model
description: How decks are described and matched by display name.
---

# Deck Model

`DeckModel` is an enum of supported decks: columns, rows, key and screen geometry, encoder and
touchpoint counts, plus the `ImageSpec` describing how key and screen images are encoded (size,
rotation, BMP or JPEG).

Models are matched by display name. The app reports a device and `DeckModel.fromDisplayName`
maps it onto the known entry; an unknown model is ignored until the library grows a table entry
for it. `DeckModel.keyIndex(column, row)` converts grid positions to the flat key indices the
wire protocol uses.

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
key.mode();      // BMP or JPEG
key.width();     // 96 on the XL and Neo, 120 on the Plus
key.height();
```

## Grid positions

Keys are addressed as a flat index in the same right-to-left, down-the-columns order the app
uses. Convert between forms freely:

```java
model.keyIndex(3, 1);   // flat index for column 3, row 1
model.columnOf(11);     // 3
model.rowOf(11);        // 1

// Fill the notch on the Plus and Neo: an LED strip under the keys.
if (model.hasScreen()) {
    DeckImage strip = DeckImage.filled(model.screenImage().width(),
            model.screenImage().height(), 0xFF223344);
    deck.setScreenImage(strip);
}
```

## Enumerating known decks

```java
for (DeckModel known : DeckModel.values()) {
    System.out.println(known.displayName() + "  " + known.columns() + "x" + known.rows());
}
```

A layout that needs a touchscreen or encoders can test a model before committing to it, e.g.
skip models without key screens and bail out on the Pedal, which has none.