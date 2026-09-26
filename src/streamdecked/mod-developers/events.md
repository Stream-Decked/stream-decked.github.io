---
prev:
  text: Images and Text
  link: /streamdecked/mod-developers/images

next: false

title: Events
description: React to hardware and deck lifecycle.
---

# Events

Every event carries a surface: `getSurface()`, or the `getDeckId()` and `getModel()`
shortcuts. Input and lifecycle now arrive over the WebSocket from the Stream Deck app; the
NeoForge events below are exactly as before, just fed by the plugin instead of local HID.

## DeckInputEvent
Fired on the game event bus on the client thread during the tick, before the assigned
button sees the hardware. Cancelling stops the button callback.

- `Key`: `getKey()`, `isPressed()`, and `getColumn()`/`getRow()`.
- `Encoder` (Plus): `isTurn()`/`isPush()` tells the two apart. `getEncoder()` is the dial index
  from 0, `getDelta()` is detents since the last event and negative counter-clockwise (zero on a
  push), and `isPressed()` is only meaningful on a push, where it separates press from release.
- `Screen` (touch strip): `getKind()` is `TAP` or `HOLD`, with `getX()`/`getY()` in whole-strip
  pixels, so `x` already spans every dial on a Plus XL and you do not divide by the strip width
  yourself.

```java
@SubscribeEvent
public static void onKey(DeckInputEvent.Key event) {
    if (event.isPressed() && event.getKey() == 0) {
        doSomething();
    }
}

@SubscribeEvent
public static void onEncoder(DeckInputEvent.Encoder event) {
    if (event.isPush() && event.isPressed()) {
        mute(event.getEncoder());   // released on the matching !isPressed()
    } else if (event.isTurn()) {
        volume(event.getDelta());
    }
}
```

Swipes and Neo capacitive touchpoints are not events here. Elgato's plugin SDK does not deliver
them, so there is no `SWIPE` kind and no `TouchPoint` class to subscribe to.

## DeckLifecycleEvent
Fired on the game event bus during the tick.

- `Connected` (cancellable): the app reported a deck and a surface was built for it,
  before registered layouts run. Cancel to keep the layout system off that panel entirely.
- `Ready`: layouts have run and the panel is drawn. A deck-wide finishing touch.
- `Disconnected`: the deck went away. The surface is already detached; do not queue work
  on it.

## StreamDeckSetupEvent
Fired on the mod event bus once, at startup before the connection loop begins and before any
deck is bound. The place to adjust connection-wide settings.

```java
public static void deckSetupEvent(StreamDeckSetupEvent event) {
    event.setDefaultBrightness(60);
    event.setResetOnConnect(true);
}
```

- `setDefaultBrightness(int percent)` (0 to 100) applied as each deck connects. Last
  listener to set it wins, so treat it as a default rather than a user setting.
- `setResetOnConnect(boolean)` blanks and resets a connecting deck before layouts run
  (on by default).
- `getManager()` is the live driver. Queue work on it when you need something outside
  the layout system.

Addons that only want to put buttons on a panel should implement `StreamDeckedPlugin`
instead of reacting on the mod bus.

## Reaching the driver

`StreamDeckDriver` holds the live state, for the cases the layout system does not cover:

- `surfaces()` and `surface(deckId)` for the panels currently open
- `manager()` for the `StreamDeckManager`, if you need to submit work yourself
- `layouts()` for the registered layout entries
- `rerenderAll()` to force a redraw, `resetAllDecks()` to blank everything
- `exitModspace()` to hand the deck back to the user's profile from anywhere

`exitModspace` is the same call the Exit button makes. It is safe when nothing is connected
and it does nothing the second time, so a mod can call it on a "close" button without
tracking whether takeover is active.