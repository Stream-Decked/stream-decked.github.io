---
prev:
  text: Writing a Plugin
  link: /streamdecked/mod-developers/plugin

next:
  text: Registering Layouts
  link: /streamdecked/mod-developers/registry

title: Example Plugin
description: A complete basic StreamDecked plugin, start to finish.
---

# Example Plugin

This is the whole thing: one class, one JSON file. It puts two keys on the deck, one of them
labelled, and a third that hands the deck back to the user. Copy it, rename the package, and
it works.

## The class

```java
package com.example.mydeck;

import dev.wolfieboy09.sd5j.core.DeckButton;
import dev.wolfieboy09.sd5j.core.DeckImage;
import dev.wolfieboy09.streamdecked.client.DeckTextures;
import dev.wolfieboy09.streamdecked.plugin.DeckLayoutRegistry;
import dev.wolfieboy09.streamdecked.plugin.StreamDeckedPlugin;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.Items;

public class MyDeckPlugin implements StreamDeckedPlugin {

    private static final ResourceLocation ID =
            ResourceLocation.fromNamespaceAndPath("mydeck", "main");

    @Override
    public void registerLayouts(DeckLayoutRegistry registry) {
        // The icon shown on the Modspace key that enters this layout.
        DeckImage icon = DeckTextures.item(Items.CRAFTING_TABLE);
        if (icon == null) {
            // The texture is missing, and register rejects a null icon. Bail out loudly
            // rather than crashing the plugin load.
            return;
        }

        registry.register(ID, icon, surface -> {
            surface.setButton(0, 1, DeckButton.text("Hi", 0xFFFFFFFF, 0xFF4477AA,
                    MyDeckPlugin::sayHi));
            surface.setButton(1, 1, DeckButton.named("lights",
                    DeckTextures.item(Items.REDSTONE_LAMP), "Lights",
                    MyDeckPlugin::toggleLights));
        });
    }

    private static void sayHi() {
        // Anything that has to happen on the client thread goes here.
    }

    private static void toggleLights() {
        // Your mod's own state. Callbacks run on the client thread, so game state is safe.
    }
}
```

Three things are worth calling out. The layout is a lambda because `DeckLayout` has exactly
one abstract method, `populate(DeckSurface)`. `DeckTextures` is nullable, because a texture
that is not on disk has no image, and a layout icon is not optional, so the null check is
mandatory rather than defensive. And the buttons pixel-fit whatever icon they are handed,
which is what keeps a raw 16x16 item from turning to blur on a 96x96 key.

## The descriptor

`src/main/resources/streamdecked.plugin.json` in your mod:

```json
{
  "plugins": [
    {
      "class": "com.example.mydeck.MyDeckPlugin"
    }
  ]
}
```

`class` is the only required field. Add `"required_mods": ["some_other_mod"]` and the entry
is skipped unless that mod is loaded, which is how one file describes plugins for several
optional integrations. A `class` that does not resolve is logged and skipped rather than
failing the load, so a typo shows up as a missing key, not a crash.

## Registering the mod dependency

Your `META-INF/neoforge.mods.toml` needs the StreamDecked dependency, client side, as in
[Depending on StreamDecked](/streamdecked/mod-developers/depending).

## Testing it

1. Start the game with a deck plugged in and Modspace open.
2. Press the `mydeck` key to enter the folder, then the entry you registered.

If nothing appears, the log is the fastest answer. A missing class shows as
`Plugin class in ... not found, skipping`, and an unresolvable id shows as a registration
error. `StreamDeckDriver.surfaces()` tells you what the driver currently has open, and
`StreamDeckDriver.rerenderAll()` forces a redraw after you change something in an attached
debugger.

## Where to go next

- [Registering Layouts](/streamdecked/mod-developers/registry) for priorities, folders and the
  `DeckSurface` API.
- [Images and Text](/streamdecked/mod-developers/images) for `DeckTextures` and captions.
- [Events](/streamdecked/mod-developers/events) to react to the deck instead of waiting for a
  press.
