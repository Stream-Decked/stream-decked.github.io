---
prev:
  text: Depending on StreamDecked
  link: /streamdecked/mod-developers/depending

next:
  text: Registering Layouts
  link: /streamdecked/mod-developers/registry

title: Writing a Plugin
description: Implement a StreamDeckedPlugin and declare it.
---

# Writing a Plugin

A plugin is a class that StreamDecked instantiates once and asks for layouts.

```java
public class MyPlugin implements StreamDeckedPlugin {
    private static final DeckImage ICON = DeckImage.filled(96, 96, 0xFF000000);

    @Override
    public void registerLayouts(DeckLayoutRegistry registry) {
        registry.register(
                ResourceLocation.fromNamespaceAndPath("mydeck", "main"),
                ICON,
                surface -> surface.setButton(0, DeckButton.of(ICON, this::iDoSomething)));
    }

    private void iDoSomething() {
    }
}
```

## Declaring the plugin

Add `streamdecked.plugin.json` to the resources directory.

Multiple plugins can be defined

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

- `class` is required. It must implement `StreamDeckedPlugin`.
- `required_mods` is optional. The plugin is skipped unless all those mods are loaded,
  which lets one file register plugins for different optional integrations.
- A `class` that cannot be resolved is skipped and logged.
