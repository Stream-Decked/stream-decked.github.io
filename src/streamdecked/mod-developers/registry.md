---
prev:
  text: Example Plugin
  link: /streamdecked/mod-developers/example

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

- `id` is a `ResourceLocation`, unique per registry. Registering the same id twice throws
  `IllegalStateException`.
- `icon` is the `DeckImage` shown on the deck for this layout. It is required and may not be
  null, which matters because `DeckTextures` is nullable.
- `priority` controls ordering. Lower numbers come first
  (`PRIORITY_LOWEST = -1000`, `PRIORITY_DEFAULT = 0`, `PRIORITY_HIGHEST = 1000`).
  `getEntries()` returns them sorted by priority, then registration order.

Registrations that share an id namespace are grouped into one auto-generated folder. The
folder's icon comes from the namespace, and entries inside it keep their relative order.

## The layout

A layout is `void populate(DeckSurface surface)` plus an optional `appliesTo(surface)`
that lets it opt out, e.g., when it needs a touchscreen or 32 keys.

```java
surface.setButton(0, DeckButton.text("Hi", 0xFFFFFFFF, 0xFF4477AA, this::sayHi));
surface.setButton(2, 1, DeckButton.of(icon, this::toggleThing)); // column, row
```

A layout that wants a specific shape should say so rather than painting off the edge. A
lambda always takes the default `appliesTo`, so opt out with an anonymous class:

```java
registry.register(id, icon, new DeckLayout() {
    @Override public void populate(DeckSurface surface) {
        // only reached on a panel that passed appliesTo
    }

    @Override public boolean appliesTo(DeckSurface surface) {
        return surface.model().keyCount() >= 32;
    }
});
```

## DeckSurface quick reference

- `setButton(int key, DeckButton)` and `setButton(int column, int row, DeckButton)`.
  Pass `null` to blank a key. A column past the deck's width wraps onto the next row, so a
  layout written for a bigger deck still keeps its buttons; a position that wraps off the
  bottom is dropped with a warning in the log instead of throwing.
- `clearButton(int key)` and `clearAll()`.
- `button(int key)` reads back what is assigned.
- `addPage()` appends an empty page to the page stack.
- `back()`, `nextPage()` and `previousPage()` walk the stack, matching the
  `DeckButton.folder`, `back`, `nextPage` and `previousPage` factories.
- `putButton` places a named button and skips the reserved navigation keys automatically;
  hand-placed `setButton` calls must still steer clear of them (documented on
  `DeckSurface`).

`populate` runs on the client thread. Queueing needs: `DeckButton.render` runs on the
driver thread, so build button images from data the button already holds rather than
touching game state inside `render`.

## Named buttons at runtime

`putButton` is the runtime companion to `setButton`. It places a button on the first free
key (skipping the keys reserved for back and page navigation) and returns it; look it up
later by name.

```java
NamedButton mute = surface.putButton("mute", speakerOn, this::toggleMute);
surface.putButton("scene", sceneIcon, this::setScene);
```

The name is scoped to the page currently showing, so the same name may exist on other
pages, folders, or decks without colliding.

```java
public final class MyModButtons {
    public static final NamedButton MUTE = NamedButton.of("mute", SPEAKER_ON, ModActions::toggleMute);
    public static final NamedButton SCENE = NamedButton.of("scene", SCENE_ICON, ModActions::setScene);
}

// in the layout:
surface.putButton(MyModButtons.MUTE);
surface.putButton(MyModButtons.SCENE);
```

`NamedButton.of` mirrors `DeckButton.of`; both `putButton` forms return the placed
instance, so mutating a constant redraws wherever it shows.

Look up, mutate, or remove a button by name:

```java
surface.setButtonIcon("mute", mutedIcon);   // redraws the key
surface.setButtonCaption("mute", "Muted");  // icon and caption together
surface.setButtonAction("mute", this::unmute);
NamedButton mute = surface.button("mute");  // same instance putButton returned
List<String> names = surface.buttonNames();
surface.removeButton("mute");
```

Every one of those takes null, which is how you blank a key without removing the button:
`setButtonIcon("mute", null)` drops the icon and leaves the caption on its own.

Flip mute state from the callback using the returned instance:

```java
NamedButton mute = surface.putButton("mute", speakerOn, () -> {
    muted = !muted;
    mute.setIcon(muted ? mutedIcon : speakerOn);
});
```

Callbacks run on the client thread like any button's `onDown`; the redraw that `setIcon`
triggers is handed to the driver thread, so game-state reads are fine.
