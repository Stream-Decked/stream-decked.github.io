---
prev:
  text: Images and Text
  link: /streamdecked/mod-developers/images

next:
  text: Events
  link: /streamdecked/mod-developers/events

title: Dynamic Buttons
description: Adding and removing buttons after your layout has run.
---

# Dynamic Buttons

`populate` runs once, when the deck is first built. Adding a button later is not a different
API, it is the same `DeckSurface` with a different method on it.

The one thing to get right is *which* surface you hold on to.

## Do not keep the layout's surface

The `DeckSurface` handed to your `populate` is a throwaway. The mod builds a scratch surface
per layout, runs you once against it, lifts the pages out as plain maps, and throws the
surface away. Your buttons survive as data; the object you were given does not.

```java
// Runs once at load. This surface is gone by the time the player does anything.
registry.register(id, icon, surface -> surface.putButton("fire", fireball, this::castFireball));
```

So a field like `private DeckSurface surface;` assigned inside `populate` is holding a dead
object, and every `putButton` on it is a no-op the player will never see. Keep the `NamedButton`
instead, and look the button up on a live surface when you need it.

## Getting a live surface

A live surface is one the mod is holding on to, keyed by deck id. Take it from an event, or
ask for it directly.

```java
@SubscribeEvent
public void onReady(DeckLifecycleEvent.Ready event) {
    DeckSurface deck = event.getSurface();   // live, safe to keep
    refresh(deck);
}

DeckSurface deck = StreamDeckDriver.surface(deckId);   // null if that deck is not open
for (DeckSurface open : StreamDeckDriver.surfaces()) { /* every connected deck */ }
```

`Connected` fires before layouts run, so use it to cancel if you need to keep the layout
system off a panel. `Ready` fires after, which is the better place to do a first pass of
runtime work. `Disconnected` means the surface is already detached, so drop your reference
there rather than queueing work on it.

## Adding

`putButton` places a button on the first free key of the page currently showing and hands
the placed instance back.

```java
NamedButton fire = deck.putButton("fire", fireballIcon, this::castFireball);
deck.putButton(DeckButton.named("shield", shieldIcon, "Shield", this::raiseShield));
```

Reuse a single `NamedButton` constant across decks and pages if you like; `putButton` places
the same instance, so mutating it updates every key showing it.

## Removing

`removeButton` takes the name off the current page and blanks the key it was on.

```java
boolean removed = deck.removeButton("fire");   // false if no such button on this page
deck.clearButton("fire");                      // the same call under a shorter name
```

Watch the overloads. `clearButton` exists in both a `String` and an `int` form, and they do
different things: the name form removes a named button, the index form blanks one key and
leaves the name alone.

## Mutating and reading

Every lookup and mutation is a no-op when the name is not on the current page, so none of
these need an existence check.

```java
NamedButton fire = deck.button("fire");        // null if absent
List<String> names = deck.buttonNames();       // in the order they were added
deck.setButtonIcon("fire", chargingIcon);      // null drops the icon, keeps the caption
deck.setButtonCaption("fire", "Charging");
deck.setButtonCaption("fire", "Charging", 0xFFFFD24A);
deck.setButtonAction("fire", this::cancelCast);
```

`setIcon` and `setCaption` redraw their key for you. If you change something a button holds
that is not the icon or the caption, call `deck.redraw(key)` yourself.

## Names are scoped to the current page

Every one of the name-based methods looks at the page that is showing, and only that page.
The same name may sit on other pages, folders or decks at the same time without colliding.
This bites when you expect a lookup to find something you placed earlier on another page.

Navigation moves the current page, so drive placement from wherever you intend to land.

```java
deck.openFolder(folderPages);   // descend
deck.goToPage(2);               // jump to a sibling
if (deck.back()) { /* returned to the level above */ }
```

`addPage` appends an empty page and switches to it, which is the usual way to build a screen
from scratch. `currentPageIndex` and `pageCount` tell you where you are.

## Guard the two exceptions

`putButton` throws rather than picking a different key, because silently overwriting a
button is worse than a loud failure.

- `IllegalArgumentException` if the name is already on the page. Remove it first, or pick a
  name that is not taken.
- `IllegalStateException` if the page has no free key left.

```java
private void replace(DeckSurface deck, String name, DeckImage icon, Runnable onPress) {
    deck.removeButton(name);
    deck.putButton(name, icon, onPress);
}
```

`putButton` skips the keys reserved for back and page navigation. Hand-placed `setButton`
calls do not, so steer clear of the bottom navigation row yourself or you will land on top
of Back and Next.

## What removal looks like on the deck

Removal blanks the key. There is no separate remove frame on the wire: the mod uploads a
black image for that key, and the app's cached surface keeps that black image so a later
repaint restores the same thing.

That is the whole of it today. The plugin's protocol does define a `removeButton` frame, and
handles it by dropping the button from its cache, but the mod's transport does not send it,
so that path is not reached in practice. Treat removal as "blank this key" and it will behave
the way you expect.

## Threading

All of this is called from the client thread, alongside your `onPress` callbacks, so reading
game state while you add or remove buttons is fine. The redraw is handed to the driver
thread, and `DeckButton.render` runs there, so keep building images out of values the button
already holds rather than reaching into the game from inside `render`.

## Worked example

Rebuilding a row of buttons as the player's selection changes, which is the usual reason to
reach for any of this.

```java
public final class SpellBar {
    private static final List<String> SLOTS = List.of("fire", "frost", "shield");

    private final DeckSurface deck;

    public SpellBar(DeckSurface deck) {
        this.deck = deck;
    }

    /** Redraws the bar to show exactly the spells the player has unlocked. */
    public void refresh(Set<String> unlocked) {
        for (String slot : SLOTS) {
            if (unlocked.contains(slot)) {
                deck.putButton(slot, iconFor(slot), () -> cast(slot));
            } else {
                deck.removeButton(slot);
            }
        }
    }
}
```

`iconFor` is your own lookup, usually a `DeckTextures` load with a placeholder fallback, as
covered in [Images and Text](/streamdecked/mod-developers/images). `cast` is your own action.

Because `refresh` removes before it puts, it is safe to call it repeatedly as the player's
unlocks change, and safe to call when nothing changed at all.

Where to call it from depends on what changed. Do it in `DeckLifecycleEvent.Ready` for the
first pass, and again from whatever game event your mod already listens for when a spell is
learned or forgotten. See [Events](/streamdecked/mod-developers/events) for the bus and
[DeckInputEvent](/streamdecked/mod-developers/events) for reacting to the buttons themselves.

For the underlying button and page API, independent of any mod, see
[Surfaces and Buttons](/sd5j/surfaces).
