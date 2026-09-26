---
prev:
  text: Surfaces and Buttons
  link: /sd5j/surfaces

next:
  text: Images
  link: /sd5j/images

title: Events
description: The sealed event records the transport can emit.
---

# Events

`DeckEvent` is a sealed interface of records, each carrying `deckId()` and `model()`:
`Connected`, `Disconnected`, `KeyDown`, `KeyUp`, `EncoderDown`, `EncoderUp`, `EncoderTurn`
(with a detent `delta`), `ScreenTap` and `ScreenHold`.

::: tip What a real deck sends today
Keys, encoders and screen taps all arrive over the WebSocket transport. `EncoderTurn` only
fires for a real detent, so a rotation of zero ticks is dropped for you. `ScreenTap` and
`ScreenHold` are the same frame with a different `hold` flag, split into two records so
callbacks can differ.
:::

## What is not here

Swipes and Neo capacitive touchpoints have no records, because Elgato's plugin SDK does not
deliver them. There is nothing to subscribe to and no event you can wait on, so the mod API
omits them rather than carrying handlers that could never fire. If Elgato ships them later
they arrive as new records, which is a source-breaking change you will see in the changelog.

## Routing events

Typed handlers keep the routing one line per event, with no match over the sealed type:

```java
manager.on(DeckEvent.Connected.class, c -> {
    logger.info("bound to deck {}: {}", c.deckId(), c.model());
    manager.submit(c.deckId(), deck -> surface(c.deckId()).redrawAll());
});
manager.on(DeckEvent.Disconnected.class, d -> logger.info("deck {} is gone", d.deckId()));

// Keys
manager.on(DeckEvent.KeyDown.class, k -> press(k.key()));
manager.on(DeckEvent.KeyUp.class, u -> release(u.key()));

// The Plus: rotary encoders
manager.on(DeckEvent.EncoderTurn.class, t -> manager.submit(t.deckId(), deck -> zoomBy(t.delta())));
manager.on(DeckEvent.EncoderDown.class, e -> toggleMute(e.encoder()));
manager.on(DeckEvent.EncoderUp.class, e -> logger.info("dial {} released", e.encoder()));

// The touchscreen strip, as a tap or a hold
manager.on(DeckEvent.ScreenTap.class, tap -> pickAt(tap.x(), tap.y()));
manager.on(DeckEvent.ScreenHold.class, h -> pressAt(h.x(), h.y()));
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
    if (event instanceof DeckEvent.EncoderTurn(var deckId, var model, int encoder, int delta)
            && delta != 0) {
        adjustVolume(encoder, delta);
    }
});
```

A record pattern must name every component, in order, so the leading `deckId` and `model`
are there whether you use them or not.

Handlers run on the thread that calls `drainEvents` or the listener's publication. Do the
actual drawing through `manager.submit(...)` so it lands on the driver thread with the deck's
state.