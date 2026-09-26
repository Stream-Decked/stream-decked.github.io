---
prev:
  text: Depending on StreamDecked
  link: /streamdecked/mod-developers/depending

next:
  text: Example Plugin
  link: /streamdecked/mod-developers/example

title: Writing a Plugin
description: Implement a StreamDeckedPlugin and declare it.
---

# Writing a Plugin

A plugin is a class that StreamDecked instantiates once and asks for layouts. There is exactly
one method to implement:

```java
public class MyPlugin implements StreamDeckedPlugin {
    @Override
    public void registerLayouts(DeckLayoutRegistry registry) {
        registry.register(
                ResourceLocation.fromNamespaceAndPath("mydeck", "main"),
                ICON,
                surface -> surface.setButton(0, DeckButton.of(ICON, this::doSomething)));
    }

    private void doSomething() {
    }
}
```

[Example Plugin](/streamdecked/mod-developers/example) walks through the whole thing, including
the texture loading and the descriptor file.

## Declaring the plugin

Add `streamdecked.plugin.json` to your mod's resources directory. One file can declare several
plugins:

```json
{
  "plugins": [
    {
      "class": "com.example.mydeck.MyPlugin",
      "required_mods": ["example_mod"]
    }
  ]
}
```

- `class` is required. It must implement `StreamDeckedPlugin`, and the path has to match the
  class in the jar.
- `required_mods` is optional. The plugin is skipped unless all those mods are loaded,
  which lets one file register plugins for different optional integrations.
- A `class` that cannot be resolved is skipped and logged as
  `Plugin class in ... not found, skipping`, not treated as an error. A wrong class path
  shows up as a layout that is simply missing.

Registering the same id twice throws, so an id is a real unique key. Pick your own namespace
to avoid colliding with another mod.
