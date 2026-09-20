---
prev:
  text: Writing a Plugin
  link: /streamdecked/mod-developers/plugin

next:
  text: Images and Text
  link: /streamdecked/mod-developers/images

title: Registering Layouts
description: The DeckLayoutRegistry and DeckLayout API.
---

# Registering Layouts

`DeckLayoutRegistry.register` is where an id, an icon, a priority and a layout come together.

```java
registry.register(id, icon, layout); // default priority
registry.register(id, icon, DeckLayoutRegistry.PRIORITY_LOWEST, layout);
registry.register(id, icon, DeckLayoutRegistry.PRIORITY_HIGHEST, layout);
```

- `id` is a `ResourceLocation`, unique per registry. Registering the same id twice throws.
- `icon` is the `DeckImage` shown on the deck for this layout.
- `priority` controls ordering. Lower numbers come first
  (`PRIORITY_LOWEST = -1000`, `PRIORITY_DEFAULT = 0`, `PRIORITY_HIGHEST = 1000`).

Registrations that share an id namespace are grouped into one auto-generated folder. The
folder's icon comes from the namespace, and entries inside it keep their relative order.

## The layout

A layout is `void populate(DeckSurface surface)` plus an optional `appliesTo(surface)`
that lets it opt out, e.g. when it needs a touchscreen or 32 keys.

```java
surface.setButton(0, DeckButton.text("Hi", 0xFFFFFFFF, 0xFF4477AA, this::sayHi));
surface.setButton(2, 1, DeckButton.of(icon, this::toggleThing)); // column, row
```

## DeckSurface quick reference

- `setButton(int key, DeckButton)` and `setButton(int column, int row, DeckButton)`.
  Pass `null` to blank a key. A column past the deck's width wraps onto the next row so a
  layout written for a bigger deck still keeps its buttons; a position that wraps off the
  bottom is dropped with a warning in the log instead of throwing.
- `clearButton(int key)` and `clearAll()`.
- `button(int key)` reads back what is assigned.
- `addPage()` appends an empty page to the page stack.
- `back()`, `nextPage()` and `previousPage()` walk the stack, matching the
  `DeckButton.folder`, `back`, `nextPage` and `previousPage` factories.
- Skip the keys the folder system reserves for back and page navigation; those are
  documented on `DeckSurface`.

`populate` runs on the client thread. Queueing needs: `DeckButton.render` runs on the
driver thread, so build button images from data the button already holds rather than
touching game state inside `render`.