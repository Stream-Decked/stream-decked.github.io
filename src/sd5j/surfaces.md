---
prev:
  text: Deck Model
  link: /sd5j/model

next:
  text: Events
  link: /sd5j/events

title: Surfaces and Buttons
description: DeckSurface, DeckButton, NamedButton, pages and captions.
---

# Surfaces and Buttons

A `DeckSurface` is one physical panel. It holds a `DeckButton` per key, a page stack and the
redraw plumbing. A `DeckLayout` is the thing that fills a surface, which is how the
[mod](/streamdecked/mod-developers/registry) turns a plugin into keys.

Surfaces are created for you when a deck connects, and they are valid only while that deck is
connected. Queue work on the manager rather than holding on to one.

## Placing buttons

```java
surface.setButton(0, DeckButton.of(icon, this::toggleMute));
surface.setButton(2, 1, DeckButton.text("Hi", 0xFFFFFFFF, 0xFF4477AA, this::sayHi)); // column, row
```

- `setButton(int key, ...)` and `setButton(int column, int row, ...)`. Pass `null` to blank
  a key.
- A column past the deck's width wraps onto the next row, so a layout written for a bigger
  deck keeps its buttons. A position that wraps off the bottom is dropped with a log warning
  instead of throwing.
- `button(int key)` reads back what is assigned, `clearButton(int key)` and `clearAll()` wipe.

## The button factories

- `DeckButton.of(image, onPress)` fixed image, action on press
- `DeckButton.text(label, textArgb, backgroundArgb, onPress)` text on a solid background
- `DeckButton.labelled(icon, label, onPress)` icon with a caption strip along the bottom
- `DeckButton.folder`, `back`, `nextPage`, `previousPage` for navigation, each with an icon
  and a text variant

`DeckButton.render(width, height)` is called on the driver thread with the panel's native key
size and returns the `DeckImage` to show. `onPress`, `onDown` and `onUp` run on the client
thread, so they may touch game state freely. Do the opposite inside `render`: build from the
data the button already holds.

## Icon plus caption

`labelled` is the quick route, and it pixel-fits the icon, which matters for Minecraft
textures. When you want a caption on a button you keep a reference to, use
`DeckButton.named` or set the caption on a `NamedButton`:

```java
surface.setButton(0, DeckButton.named("mute", speakerOn, "Mute", this::toggleMute));
```

```java
NamedButton mute = surface.putButton("mute", speakerOn, this::toggleMute);
mute.setCaption("Muted", 0xFFFF5555);   // icon and caption together
```

A blank or `null` caption leaves the icon full size, so the two are the same button with or
without a label. `DeckText.iconWithCaption` is the renderer behind this if you need to
compose it yourself.

## Named buttons

`putButton` is the runtime companion to `setButton`. It places a button on the first free
key, skipping the keys reserved for back and page navigation, and returns it:

```java
NamedButton mute = surface.putButton("mute", speakerOn, this::toggleMute);
surface.putButton(DeckButton.named("scene", sceneIcon, "Scene", this::setScene));
```

The name is scoped to the page currently showing, so the same name may exist on other pages,
folders or decks without colliding. Mutating the returned instance redraws wherever it shows,
which makes constants work well:

```java
public static final NamedButton MUTE =
        NamedButton.of("mute", SPEAKER_ON, ModActions::toggleMute);

// in the layout
surface.putButton(MyModButtons.MUTE);
```

Look it up, mutate or remove it by name:

```java
surface.setButtonIcon("mute", mutedIcon);
surface.setButtonCaption("mute", "Muted");
surface.setButtonAction("mute", this::unmute);
surface.button("mute");        // same instance putButton returned
surface.buttonNames();
surface.removeButton("mute");
```

Every icon and caption setter is nullable, so `setButtonIcon("mute", null)` clears the icon
and leaves the caption as a label on its own. That is the way to blank a key without removing
the button.

## Pages and folders

Pages are a stack. `setRootPage` installs the first page, `addPage` appends, and the
navigation buttons walk the stack.

```java
surface.setRootPage(rootButtons);
surface.setRootPages(List.of(mainPage, settingsPage));

surface.openFolder(subPage);   // push
surface.back();                // pop, false when there is nothing to pop
surface.canGoBack();
surface.folderDepth();
surface.nextPage();
surface.previousPage();
surface.goToPage(2);
surface.currentPageIndex();
surface.pageCount();
surface.exportPages();        // the current page tree, as the layout registry consumes it
```

`pushPage`/`popPage`/`pageDepth` are aliases of `openFolder`/`back`/`folderDepth`, added so
mod code can read as pages rather than folders.

## The dials and touchscreen

Everything above paints keys. A Stream Deck + and + XL also have rotary encoders and a
touchscreen strip, and those are input only, so they arrive as [events](/sd5j/events) rather than
as anything you place:

```java
manager.on(DeckEvent.EncoderTurn.class, t -> zoomBy(t.delta()));
manager.on(DeckEvent.ScreenTap.class, tap -> pickAt(tap.x(), tap.y()));
```

There is no `setDial` or `setScreenImage` that draws. `setScreenImage` exists and is a no-op on
this transport, because painting the touchscreen is the Stream Deck app's job, not the
library's. If you want your mods to react to a dial, that is the whole of it: subscribe to the
event and act on the delta.

`x` on a `ScreenTap` is in whole-strip pixels and already spans every dial, so on a + XL the
first 200 pixels are dial 0, the next 200 are dial 1, and so on. If you want the dial a tap
landed on, divide by the per-dial width rather than hardcoding 200:

```java
manager.on(DeckEvent.ScreenTap.class, tap -> {
    DeckModel m = tap.model();                          // the deck this tap arrived on
    int perDial = m.screenImage().width() / m.encoderCount();
    pickDial(tap.x() / perDial);
});
```

## Threading

Callbacks run on the client thread like any button's `onDown`; the redraw a `setIcon` or
`setCaption` triggers is handed to the driver thread, so game-state reads are fine. If you
are outside a callback and hold no lock, do this:

```java
manager.submit(surface.deckId(), deck -> { /* touched on the driver thread */ });
```
