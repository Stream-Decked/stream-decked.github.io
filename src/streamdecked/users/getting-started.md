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

Start the game with the app open and a deck plugged in. The mod connects to the plugin, the
plugin binds it to a free deck, and every registered layout runs. Each mod that registered
layouts shows up as a folder on the deck; inside that folder are the mod's buttons.

Nothing on the deck needs configuration. Dimensions come from matching the app-reported model
against the library's model table; a brand-new deck model needs a library update before it is
recognised. If the mod isn't picked up, check the plugin's log for the connection state.