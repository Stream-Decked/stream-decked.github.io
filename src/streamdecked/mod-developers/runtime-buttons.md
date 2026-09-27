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

Since every one of those methods is relative to the current page, acting on a page the player
is not on means moving them there first, or noticing when they arrive. See
[Addressing a specific page](#addressing-a-specific-page) below.

## Addressing a specific page

There is no `getFolder(id)`, no `currentPage()` and no `page(int)`. The page type is private to
`DeckSurface`, and every name-based method above quietly works on whichever page is showing.
You cannot ask for a page you are not on, and a button will not tell you which key it holds.

What you can do is notice that the player is already on your page. Folder buttons navigate the
*live* surface rather than one they captured, so its page stack always mirrors where the player
actually is, and a page rebuilds its name index from the `NamedButton`s in it. So if they are
standing in your spells folder, `removeButton("fireball")` already refers to the right button.

Answering "am I on my page?" is `currentFolderId()`. The mod tags the folder it generates for your
layout with your layout's own id, so a layout can recognise its own pages without leaving a
sentinel button on them:

```java
private static final ResourceLocation ID = ResourceLocation.fromNamespaceAndPath(MOD_ID, "spells");

public void refresh(DeckSurface deck, Player player) {
    if (!ID.toString().equals(deck.currentFolderId())) return;   // not in the spells folder
    for (String slot : SLOTS) {
        deck.removeButton(slot);                    // putButton throws on a duplicate name,
        if (unlocked.contains(slot)) {              // so remove first to stay idempotent
            deck.putButton(slot, iconFor(slot), () -> cast(slot));
        }
    }
}
```

That is a string compare, so it costs nothing while the player is somewhere else. The mod also tags
its own folders, if you need to tell them apart: `StreamDeckDriver.HOME_ID` for the Modspace home
button, and `<namespace>:folder` for a generated per-mod folder.

## Pages that depend on runtime data

A list of everything the player has learned does not have a fixed length. `replacePages` swaps
the current level's pages for a new set, which is how such a folder re-paginates itself:

```java
List<Map<Integer, DeckButton>> pages = new ArrayList<>();
for (int i = 0; i < batches.size(); i++) pages.add(buildPage(batches.get(i), player));
deck.replacePages(pages);
```

It keeps the player on the same page index where that still exists and clamps when the list
shrinks, so learning a spell does not throw them back to the first page. The folder id survives
the swap, so a layout that recognises itself by `currentFolderId()` stays recognised across it.
`pageCount()` and `currentPageIndex()` tell you what is on screen, and the usual
`nextPage()` / `previousPage()` move between pages.

The `batches` and `buildPage` above are the part worth not writing yourself;
[Paginating a list](#paginating-a-list) covers the helper that does it.

`addPage()` appends a single empty page and switches to it, which is rarely what a layout driven
by a list wants.

## Where navigation lives

The bottom row belongs to the deck, not to you, and the keys it uses are not where you would guess.
Reading them off `DeckModel` saves re-deriving the arithmetic:

```java
int back     = deck.model().backKey();      // keyCount - columns, bottom left
int previous = deck.model().previousKey();  // back + 1
int next     = deck.model().nextKey();      // keyCount - 1, bottom right
```

`previous` is `back + 1`, **not** `next - 1`. On anything wider than three columns those are
different keys, so the second guess writes a Prev button two keys to the right of where the
generated one goes. `DeckSurface` exposes the same three as `backKey()`, `nextKey()` and
`previousKey()`, so you can ask the surface you are drawing on.

Two more answer the question those keys raise, which is what is left:

```java
deck.isReservedKey(key);   // true if navigation owns it
deck.contentKeys();        // every key free for content right now, ascending
```

`putButton` already skips reserved keys, so this only matters when you are placing by index with
`setButton`.

Note that `contentKeys()` is the *live* answer: next and previous only count as reserved once the
level has more than one page, so a single-page folder hands those keys back to you. That is correct
behaviour, and it is also why you should not read a page count off it and hard-code it.

## Paginating a list

Cutting a list into pages is the same handful of lines in every layout, so `DeckPaginator` does it.
Hand it the list and a function that turns one item into a button, and it hands back the page maps
that `openFolder` and `replacePages` take:

```java
DeckPaginator<Spell> pages = DeckPaginator.of(deck.model(), learned, this::spellButton);
pages.previous();          // optional, see below
pages.refresh(deck);
```

Back and next are added for you in the standard navigation look, so most layouts never name a label
or a colour. Next is only *drawn* once the list needs a second page.

- `nav(DeckNavStyle)` or `colors(textArgb, backgroundArgb)` recolours the buttons the paginator
  draws. Applied when the pages are built, so it makes no difference whether you set it before or
  after asking for a button. Buttons you pass yourself are left alone.
- `previous()` adds a Prev button as well. It is not automatic because it costs a content key, and
  most lists are short enough not to need it.
- `back`, `next` and `previous` also take a `DeckButton`, so you can replace one outright.
- `noNavigation()` drops all three, for a page whose navigation someone else supplies.
- `capacity()` is how many items fit per page, a plain function of the deck and the navigation you
  asked for, so you can size a layout against it. It throws if navigation leaves no key free, which
  only happens on a three-key pedal with all three reserved.
- `isPaged()` and `pageCount()` tell you whether the list spills and into how many pages.
- `contentKeys()` is the stable counterpart to the live one on `DeckSurface`: it holds next and
  previous aside as soon as they are in play, whether or not the list needs them.
- `build()` gives you the `List<Map<Integer, DeckButton>>`; `openOn(deck, id)` and
  `refresh(deck)` are `build()` followed by the matching call.
- `pages()` gives you the cut list itself, which is what you compare against `buttonNames()` to
  decide whether a live folder needs rebuilding at all.

To match your own palette, hand the paginator a style. Share one instance to keep a whole plugin
looking the same:

```java
private static final DeckNavStyle NAV = new DeckNavStyle(0xFF101010, 0xFF303030);

DeckPaginator.of(deck.model(), learned, this::spellButton)
        .nav(NAV)
        .refresh(deck);
```

`DeckNavStyle.DEFAULT` is white on near-black, which is what you get when you say nothing.

Back's key is reserved even with no button for it, because that is the key the mod claims on every
folder page and a layout that fills it loses its back button.

Drop the navigation when you only want the first page, such as while the deck is capturing and the
mod is going to add the navigation for you. That keeps the back key clear so the capture still
works; the pages past the first are simply not used.

```java
// capture pass: one page of content, no navigation, mod injects Back
DeckPaginator.of(deck.model(), learned, this::spellButton)
        .noNavigation().build().getFirst()
        .forEach(deck::setButton);
```

### Additions do not survive re-entry

Descending into a folder builds its pages fresh from the maps you handed over, every time.
Anything you added while the player was standing there lived on the live page, not in your map,
so it is gone the moment they leave and come back.

Keep your own page data as the source of truth and re-apply it on the way in. There is no
"page entered" event, so either drive `refresh` from a client tick, guarded by
`currentFolderId()`, which costs nothing while they are elsewhere, or call it from whatever game
event your mod already listens for.

Checking that the page already matches what you would build keeps that per-tick call free: compare
what should be on it against `buttonNames()`. Everything you placed with `putButton` is a
`NamedButton` and shows up there, while the mod's own back and page navigation are not, so a set
comparison lines up with your own view of the page.

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
of Back and Next. Ask `isReservedKey` or `contentKeys` which keys those are, or let
`DeckPaginator` place the content for you; see [Where navigation lives](#where-navigation-lives).

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
