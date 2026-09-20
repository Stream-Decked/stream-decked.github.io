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
shortcuts.

## DeckInputEvent
Fired on the game event bus on the client thread during the tick, before the assigned
button sees the hardware. Cancelling stops the button callback.

- `Key`: `getKey()`, `isPressed()`, and `getColumn()`/`getRow()`.
- `TouchPoint` (Neo): `getPoint()`, `isPressed()`.
- `Encoder` (Plus): built via `Encoder.turned(...)` or `Encoder.pushed(...)`;
  `isTurn()`/`isPush()`, `getEncoder()`, `getDelta()` (detents, negative counter-clockwise).
- `Screen` (touch strip): `Kind` is `TAP`, `HOLD` or `SWIPE`, with start and end
  coordinates in strip pixels.

```java
@SubscribeEvent
public static void onKey(DeckInputEvent.Key event) {
    if (event.isPressed() && event.getKey() == 0) {
        doSomething();
    }
}
```

## DeckLifecycleEvent
Fired on the game event bus during the tick.

- `Connected` (cancellable): a deck was opened and a surface built, before registered
  layouts run. Cancel to keep the layout system off that panel entirely.
- `Ready`: layouts have run and the panel is drawn. A deck-wide finishing touch.
- `Disconnected`: the deck went away. The surface is already detached; do not queue work
  on it.

## StreamDeckSetupEvent
Fired on the mod event bus once, right after the driver thread starts and before any deck
is opened. The place to adjust driver-wide settings.

```java
public static void deckSetupEvent(StreamDeckSetupEvent event) {
    event.setDefaultBrightness(60);
    event.setResetOnConnect(true);
    event.setAllowedDeckIds(List.of("ABC12345"));
}
```

- `setDefaultBrightness(int percent)` (0 to 100) applied as each deck connects. Last
  listener to set it wins, so treat it as a default rather than a user setting.
- `setResetOnConnect(boolean)` blanks and resets a connecting deck before layouts run
  (on by default).
- `setAllowedDeckIds(Collection<String>)` restricts the driver to the listed serial
  numbers; every other attached device is left for the official software.
- `getManager()` is the live driver. Queue work on it when you need something outside
  the layout system.

Addons that only want to put buttons on a panel should implement `StreamDeckedPlugin`
instead of reacting on the mod bus.