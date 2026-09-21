---
prev:
  text: StreamDecked
  link: /streamdecked/

next: false

title: Getting Started
description: Install StreamDecked and plug in a deck.
---

# Getting Started
> [!WARNING]
> Due to conflicts with the Elgato Stream Deck software, you need to kill the process or somehow make the software forget the used Stream Decks.
> A way for this mod and the software to co-exist will be found one day.
> Currently, if the software and mod are present at the same time, they will both use the same buttons and draw the same buttons.


StreamDecked is a library mod. It ships with no gameplay of its own. The mods that integrate
with it put buttons on your deck, and those mods are what you experience.

## Requirements
- A supported Elgato Stream Deck (see below for supported decks)

## Supported Stream Decks
- Stream Deck
- Stream Deck Mini
- Stream Deck Mini MK.2
- Stream Deck Mini Discord
- Stream Deck Mini Module
- Stream Deck V2
- Stream Deck MK.2
- Stream Deck MK.2 Scissor
- Stream Deck MK.2 Module
- Stream Deck XL
- Stream Deck XL V2
- Stream Deck XL Module
- Stream Deck +
- Stream Deck + XL
- Stream Deck Neo
- Stream Deck Pedal

## First launch

Start the game and plug in your deck. StreamDecked opens it, runs every registered layout,
and draws the first page. Each mod that registered layouts shows up as a folder on the
deck; inside that folder are the mod's buttons.

Nothing on the deck needs configuration. If the deck isn't picked up, check the log for device-discovery issues.
