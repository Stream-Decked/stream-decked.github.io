---
title: AI Stance
description: Transparency about the use of generative AI.
---

# AI Stance

As much as I despise using generative AI for programming, it was used for this
project because there are no up-to-date Java libraries for Stream Decks. Most of the ones
examined were last updated in 2017 and are unmaintained.

The following libraries were used as references:

- [abcminiuser/python-elgato-streamdeck](https://github.com/abcminiuser/python-elgato-streamdeck)
- [OpenActionAPI/rust-elgato-streamdeck](https://github.com/OpenActionAPI/rust-elgato-streamdeck)
- [Julusian/node-elgato-stream-deck](https://github.com/Julusian/node-elgato-stream-deck)

As a rule of thumb, I have always reviewed the generated code and made changes as
needed. The mod is not fully AI-generated. Generative AI was used only for the hardware
API and no other repository within StreamDecked, and only after I attempted the
work myself first.

How generative AI was used:
- Reading the referenced, unmaintained Stream Deck libraries
- Writing some classes
- Bug fixing
