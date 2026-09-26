---
prev:
  text: How It Works
  link: /streamdecked/how-it-works

next:
  text: Connecting
  link: /sd5j/connecting

title: SD5J
description: The pure-Java Stream Deck SDK under StreamDecked.
---

# SD5J

SD5J (`dev.wolfieboy09.sd5j:sd5j`) is the pure-Java library under StreamDecked. It knows deck
models, key images and input, and it reaches a real deck through the Stream Deck app instead of
claiming the USB device. No Minecraft code, no mod loader hooks, no natives and no JNI: the same
artifact runs inside the mod and inside any other JVM.

## Getting it

```groovy
repositories {
    mavenCentral()

    maven {
        name = "streamdecked"
        url = "https://dl.cloudsmith.io/public/wolfieboy09/stream-decked/maven/"
        content {
          includeGroup("dev.wolfieboy09.sd5j")
        }
    }
}

dependencies {
    implementation "dev.wolfieboy09.sd5j:sd5j:1.0.0"
}
```

At runtime the library needs slf4j-api and Gson. Minecraft already ships both; away from
Minecraft you provide them yourself.

## Packages

- `dev.wolfieboy09.sd5j.core`: deck model, transport seam, driver, events, buttons,
  surfaces and layouts.
- `dev.wolfieboy09.sd5j.core.image`: `DeckImage` and `DeckImageCodec`.
- `dev.wolfieboy09.sd5j.remote`: the WebSocket transport that talks to the Stream Deck app.

## A minimal embedding

```java
StreamDeckManager manager = StreamDeckManager.createDefault();
manager.start();
manager.addListener(event -> {
    if (event instanceof DeckEvent.Connected connected) {
        manager.submit(connected.deckId(), deck -> {
            deck.setKeyImage(0, DeckImage.filled(72, 72, 0xFF3366AA));
        });
    }
});
```

That drives raw key images. Most code never touches a deck directly: a `DeckSurface` holds a
`DeckButton` per key and a `DeckLayout` fills a surface, which is what the
[mod](/streamdecked/) builds on top of.

From here the rest of the section breaks the pieces apart:
[connecting](/sd5j/connecting) and driving decks, the [deck model](/sd5j/model),
[surfaces and buttons](/sd5j/surfaces), [events](/sd5j/events) and [images](/sd5j/images).