---
prev:
  text: Getting Started
  link: /streamdecked/users/getting-started

next:
  text: The SD5J Library
  link: /sd5j/

title: How It Works
description: The library, the mod, and the Stream Deck plugin.
---

# How It Works

StreamDecked is three pieces that cooperate instead of fighting over the hardware:

- **The library** (`dev.wolfieboy09.sd5j:sd5j`) is a pure-Java SDK. It
  defines the deck model, buttons, textures, and a remote transport that talks to the
  Stream Deck app over a local WebSocket.
- **The mod** embeds that library (jar-in-jar) and wires it into NeoForge: plugin
  discovery, the layout registry, events, and texture reloads.
- **The Stream Deck plugin** runs inside the Stream Deck software. It hosts a small
  WebSocket server on `127.0.0.1` and writes a pairing file (`~/.streamdecked/pairing.json`)
  holding the port and a handshake token; the library connects to it as a client. One server,
  many clients: every Minecraft instance (or any other JVM embedding the library) is a
  separate client.

## Modspace, and why a profile is needed

The plugin ships a profile named Modspace, and the deck has to be on that profile before
anything can be drawn. A Stream Deck app plugin can only switch the deck to a profile it
ships; it cannot create one at runtime, and it cannot take a deck over from another profile.
So the first time a client connects, the plugin asks the app to switch to Modspace, and the
app shows the user an install prompt.

That is the one piece of user interaction in the whole design. Accept the prompt and the
plugin is in Modspace, and the library is free to write key images; decline it and the switch
fails, the plugin logs it, and the deck stays on whatever profile the user already had.
Nothing is drawn and the user's own keys are untouched, which is the intended failure mode.

The Modspace root page carries an **Exit** key. Pressing it sends an `exit` frame to the
client, which asks the plugin to switch back to the profile that was active before takeover.
A re-paint that arrives after the switch is dropped, so the user is not raced by a stale
image.

## Why a plugin at all

A Stream Deck without the Stream Deck software is a broken product; the app is always
running, so StreamDecked leans on it instead of opening the HID device itself. That removes
the two native libraries (hid4java + JNA) from what the mod ships, and it removes the
conflict where the mod and the app both drew over the same keys.

## What runs where

Rendering stays in the instance that owns the button: a button's `render()` runs on a
driver thread in the mod, produces a `DeckImage`, and the PNG bytes go over the wire to the
plugin, which relays them straight to the app's `setImage`. Input comes back the same way:
the app reports `keyDown`/`keyUp`, the plugin forwards them to the owning client, and the
existing NeoForge events fire unchanged.

Decks are described by matching the app-reported device name against the library's model
table; dimensions are not read over HID anymore. An unknown model is ignored until the table
gains an entry for it.

The protocol is deliberately narrow right now. The client sends `hello`, key images, a `surface`
reply and `exit`; the app sends deck connect and disconnect, key down and up, encoder down, up
and rotation, screen taps and holds, and surface requests. Screens, brightness and device reset
are app-owned, and gestures such as swipes and Neo capacitive touchpoints are not in the API at
all, because Elgato's plugin SDK does not deliver them.

## One server, many clients

People can have several Minecraft instances open at once, but only one Stream Deck app. The
plugin owns the socket and every library embedding connects in. Each connected client is
bound to a free deck; a client that connects when every deck is busy waits until one frees
up. With a single deck and two instances, the first one gets the deck and the second queues.