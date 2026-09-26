---
prev:
  text: StreamDecked
  link: /streamdecked/

next:
  text: How It Works
  link: /streamdecked/how-it-works

title: Getting Started
description: Install StreamDecked and plug in a deck.
---

# Getting Started

StreamDecked is a library. It ships with no gameplay of its own. The mods that integrate with
it put buttons on your deck, and those mods are what you experience.

## Requirements

- A Stream Deck app (the official Elgato software) with the DeckedOut MC plugin installed.
- The StreamDecked mod, with any mods you want on the deck.

The mod connects to the plugin inside the Stream Deck app over a local WebSocket, so the
app must be running.

## First launch

Start the game with the app open and a deck plugged in. The mod connects to the plugin and
binds to a free deck.

The first time this happens, the Stream Deck app asks whether it may install the plugin's
profile on your deck. **Accept it.** StreamDecked works by taking the deck over with a
shipped profile called Modspace, and it cannot draw anything until that profile is there. If
you decline, the app asks again the next time the mod connects.

The shipped profile covers every kind of deck at once. It fills the keys, and on a Stream Deck
+ or + XL it also fills the dials and touchscreen strip, which is what lets your mods react to
turning a dial and tapping the screen. A deck with no encoders ignores those slots.

Nothing on the deck needs configuration beyond that. Dimensions come from matching the
app-reported model against the library's model table; a brand-new deck model needs a library
update before it is recognised.

## Using Modspace

With the profile installed, Modspace is where your mods live. Open it, and each mod that
registered layouts appears as a folder; inside the folder are that mod's buttons. Press a
button to run the thing it is bound to.

The root page of Modspace carries an **Exit** key. Press it and the deck goes back to whatever
profile you were using before, so you are never stuck looking at a mod's buttons when you
want your streaming or audio setup back. Pressing a Modspace key again re-enters takeover.

## If nothing appears

- Check the Stream Deck app's plugin log for the connection state. A connection that never
  binds usually means the mod did not start, not that the deck is broken.
- "Profile not found" in the app means the profile was deleted or never installed. Reinstall
  the plugin from the Stream Deck app's plugin list, and accept the profile prompt.
- A mod that shows a folder but no keys usually logged a missing plugin class or a null
  texture; the game log has the line.
- Dials and the touchscreen do nothing on a Plus while you are on your own profile. That is
  expected; the plugin only hears from the deck while Modspace is the active profile.