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

::: warning SD5J needs the Stream Deck plugin
SD5J is a client, not a driver. It does not open the deck itself: it connects to a small
WebSocket server that the **StreamDecked plugin** runs inside the Stream Deck app, and that
server is what holds the panel. With the app closed, or the plugin not installed, nothing binds,
every key stays black, and the library has no fallback to the USB device because taking the USB
device is exactly what it avoids.

So installing the library is only half of it. Install the plugin too, from the plugin list in
the Stream Deck app: [Stream Deck plugin](https://example.org/streamdecked-plugin).
:::

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

- `dev.wolfieboy09.sd5j.deck`: `DeckModel`, the `StreamDeck` session and `StreamDeckManager`.
- `dev.wolfieboy09.sd5j.layout`: what a layout is written against, `DeckLayout`, `DeckSurface`,
  `DeckPaginator` and `DeckNavStyle`.
- `dev.wolfieboy09.sd5j.button`: `DeckButton`, `NamedButton` and `DeckText`.
- `dev.wolfieboy09.sd5j.event`: `DeckEvent` and the wire-level `DeckInput`.
- `dev.wolfieboy09.sd5j.image`: `DeckImage` and `DeckImageCodec`.
- `dev.wolfieboy09.sd5j.transport`: the `DeckTransport` seam.
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