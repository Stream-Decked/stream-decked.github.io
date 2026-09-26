---
prev:
  text: SD5J
  link: /sd5j/

next:
  text: Deck Model
  link: /sd5j/model

title: Connecting
description: The transport seam, the WebSocket transport and the driver.
---

# Connecting

## DeckTransport

`DeckTransport` is the seam every driver in the library talks through. It represents the
connection to the app session, which is bound to at most one deck:

- `connect()`, `close()`, `isClosed()`
- `isConnected()` (true once the plugin accepts the hello handshake)
- `boundDeckId()`, `boundModel()` (null while queued or disconnected)
- `setKeyImage(int key, byte[] encoded)`, `setScreenImage(byte[])`, `setBrightness(int)`,
  `reset()`
- `exit()`, which asks the plugin to leave Modspace and hand the deck back to the profile
  that was active before StreamDecked took over. It is ignored while disconnected.
- `setListener(Listener)` with `Listener.onEvent(DeckEvent)` and
  `Listener.onError(Throwable)`

## RemoteDeckTransport

`RemoteDeckTransport` is the shipped implementation. It opens a WebSocket client to the local
plugin server and turns the stream into `DeckEvent`s. Connection facts come from the pairing
file the plugin writes, by default `~/.streamdecked/pairing.json` (port and handshake token).
The token is the first frame sent (`hello`); the plugin closes the socket on a mismatch.

While the server is unreachable it logs "no Stream Deck server found" and retries with capped
backoff, re-reading the pairing file on every attempt so a plugin restart (new port and token)
is picked up without restarting the client.

Frames it sends: `hello`, `setImage` (one key image as base64, matching the model's spec),
`surface` (the full key image map, in reply to a surface request) and `exit`.
Frames it handles: `helloOk` (may bind the client to a deck), `deckConnect`, `deckDisconnect`,
`keyDown`, `keyUp`, `encoderDown`, `encoderUp`, `encoderRotate`, `screenTap`, `surface`
(a request to re-push) and `error`.

Input frames all carry `deckId`, so the plugin routes them without guessing which deck they
belong to. `encoderRotate` carries a `ticks` count, positive clockwise and negative
counter-clockwise, and the transport drops a zero rather than reporting a detent that did not
happen. `screenTap` carries `x`, `y` and a `hold` flag in whole-strip pixels, and the library
splits it into `ScreenTap` and `ScreenHold` on the flag.

Screens, brightness and device reset are app-owned today, so `setScreenImage`,
`setBrightness` and `reset` are no-ops on this transport. The client is also key-image only:
everything it paints goes to page 0, and there is no title or remove-button frame, even
though the plugin's protocol understands them.

::: warning Exiting Modspace
`exit()` is the call that makes the deck usable again. Calling it hands the panel back to
the user's previous profile, so only call it when you actually mean to stop drawing, for
example from a button that is meant to close a menu.
:::

## StreamDeckManager

`StreamDeckManager` owns a transport and gives every client thread a safe handle on the decks.

- Lifecycle: `start()`, `close()`, `isRunning()`
- State: `connectedDecks()` returning `List<DeckInfo>` where `DeckInfo(id, model)`, plus
  `hasDeck()`
- Work: `submit(String deckId, DeckTask)`, `submitAll(DeckTask)` and `submit(Runnable)` to run
  on the driver thread where `DeckTask.run(StreamDeck deck)` receives the open deck
- Events: `on(type, handler)` / `off(type, handler)` typed dispatch plus `drainEvents()`,
  `addListener`, `removeListener`, `addErrorHandler`
- Connection settings: `setDefaultBrightness(percent)`, `setResetOnConnect(boolean)`

`createDefault()` is shorthand for `new StreamDeckManager(new RemoteDeckTransport())`; pass
any other `DeckTransport` to the constructor when you do not want the shipped default.

Call `start()` once and drain or listen from your own loop; transport events are not delivered
on your thread.

## A working embedding

Register per-event handlers, start the manager, then drain the queue from your existing loop.

```java
StreamDeckManager manager = StreamDeckManager.createDefault();
manager.setDefaultBrightness(60);
manager.setResetOnConnect(true);
manager.addErrorHandler(t -> LOGGER.error("Stream Deck driver error", t));

manager.on(DeckEvent.Connected.class, this::onConnected);
manager.on(DeckEvent.KeyDown.class, this::onKeyDown);

manager.start();

// Run this from whatever loop your application already has; handlers fire from here.
manager.drainEvents();
```

Handlers read best as named methods, one per event:

```java
void onConnected(DeckEvent.Connected c) {
    LOGGER.info("bound to deck {}: {}", c.deckId(), c.model());
    manager.submit(c.deckId(), deck -> {
        DeckModel.ImageSpec key = c.model().keyImage();
        if (key == null) return;
        deck.setKeyImage(0, DeckImage.black(key.width(), key.height()));
    });
}

void onKeyDown(DeckEvent.KeyDown down) {
    manager.submit(down.deckId(), deck -> {
        DeckModel.ImageSpec key = down.model().keyImage();
        if (key == null) return;
        deck.setKeyImage(down.key(), DeckImage.black(key.width(), key.height()));
    });
}
```

`on(...)` never makes you match over the sealed `DeckEvent` type; each handler is only called
with its own record. `drainEvents` hands the queued transport events to the registered
handlers on your thread, and `submit(deckId, ...)` returns the work to the driver thread,
which is the only place the deck's state is touched. When your application shuts down:

```java
manager.close();   // closes the transport and stops the driver threads
```

## Using the transport directly

The seam stays usable on its own when you do not want the manager's threading:

```java
RemoteDeckTransport transport = new RemoteDeckTransport("my-app");
transport.setListener(new DeckTransport.Listener() {
    @Override public void onEvent(DeckEvent event) { handle(event); }
    @Override public void onError(Throwable throwable) { LOGGER.error("transport error", throwable); }
});
transport.connect();
if (transport.isConnected()) {
    transport.setKeyImage(0, DeckImageCodec.encodeKey(DeckModel.MK2, panel));
}
```

A bare transport binds to a deck only when the plugin assigns one; the pairing file is still
the source of the port and token. The manager exists to make that wiring safe from several
threads, so prefer it unless you have one thread and one job.