---
prev:
  text: Deck Model
  link: /sd5j/model

next:
  text: Images
  link: /sd5j/images

title: Events
description: The sealed event records the transport can emit.
---

# Events

`DeckEvent` is a sealed interface of records, each carrying `deckId()` and `model()`:
`Connected`, `Disconnected`, `KeyDown`, `KeyUp`, `TouchPointDown`, `TouchPointUp`,
`EncoderDown`, `EncoderUp`, `EncoderTurn` (with a detent `delta`), `ScreenTap`, `ScreenHold`,
`ScreenSwipe`.

## Routing events

Typed handlers keep the routing one line per event, with no match over the sealed type:

```java
manager.on(DeckEvent.Connected.class, c -> {
    logger.info("bound to deck {}: {}", c.deckId(), c.model());
    manager.submit(c.deckId(), deck -> deck.setBrightness(60));
});
manager.on(DeckEvent.Disconnected.class, d -> logger.info("deck {} is gone", d.deckId()));

// Keys
manager.on(DeckEvent.KeyDown.class, k -> press(k.key()));
manager.on(DeckEvent.KeyUp.class, u -> release(u.key()));

// The Plus: rotary encoders
manager.on(DeckEvent.EncoderTurn.class, t -> manager.submit(t.deckId(), deck -> zoomBy(t.delta())));
manager.on(DeckEvent.EncoderDown.class, e -> toggleMute(e.encoder()));

// Touch point on the Plus and Neo, or the Pedal strip
manager.on(DeckEvent.TouchPointDown.class, p -> press(p.point()));
manager.on(DeckEvent.TouchPointUp.class, p -> release(p.point()));

// Screen or strip gestures
manager.on(DeckEvent.ScreenTap.class, tap -> pickAt(tap.x(), tap.y()));
manager.on(DeckEvent.ScreenSwipe.class, s -> panTo(s.toX(), s.toY()));
```

Remove a handler with `off`, passing the same handler instance you registered:

```java
Consumer<DeckEvent.KeyDown> key = k -> press(k.key());
manager.on(DeckEvent.KeyDown.class, key);
manager.off(DeckEvent.KeyDown.class, key);
```

## Record pattern matching

Records are easy to match on too, when a handler is not the right shape:

```java
manager.addListener(event -> {
    if (event instanceof DeckEvent.EncoderTurn(int encoder, int delta)
            && delta != 0) {
        adjustVolume(encoder, delta);
    }
});
```

Handlers run on the thread that calls `drainEvents` or the listener's publication. Do the
actual drawing through `manager.submit(...)` so it lands on the driver thread with the deck's
state.