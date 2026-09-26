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
needed. The project is not fully AI-generated. Generative AI was used only for the hardware
API and no other repository within StreamDecked, and only after I attempted the
work myself first. I wrote code myself, and when issues occured that I was unable to fix, AI was used to help guide me to a fix.

How generative AI was used:
- Some parts of the wiki
- SD5J
    - Fixing some bugs after migration
    - DeckImages and various other things
- Elgato plugin
    - Writing networking and some other things
    - Bug fixing
- Stream Decked Library
    - Communication with the elgato plugin
    - Some bug fixes