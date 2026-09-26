---
prev:
  text: Images
  link: /sd5j/images

next:
  text: Writing a Plugin
  link: /streamdecked/mod-developers/plugin

title: Depending on StreamDecked
description: Set up a mod that integrates with StreamDecked.
---

# Depending on StreamDecked

The SDK itself, package by package, is documented on the [SD5J page](/sd5j/). This page is
about wiring a mod up to the mod's driver.

## Declaring the dependency

In `META-INF/neoforge.mods.toml`:

```toml
[[dependencies.streamdecked]]
modId = "streamdecked"
type = "optional"
versionRange = "[1.0.0,)"
ordering = "NONE"
side = "CLIENT"
```

In `build.gradle`, add the StreamDecked maven and point the implementation at the library.
The mod embeds the library, but your integration compiles against the artifact directly:

```groovy
repositories {
    mavenCentral()

    maven {
        name = "streamdecked"
        url = "https://dl.cloudsmith.io/public/wolfieboy09/stream-decked/maven/"
        content {
          includeGroup("dev.wolfieboy09.sd5j")
        }
    }
}

dependencies {
    implementation "dev.wolfieboy09.sd5j:sd5j:1.0.0"
}
```

The library is pure Java and has no Minecraft dependency, so the artifact stays the same no
matter which mod loader or Minecraft version consumes it.

## Which version to use

The library and the mod ship on their own cadence, so pin the library to the version the mod
you depend on was built against and let the version range do the rest:

- `sd5j` `1.0.0` is current. It is the first release on the WebSocket transport, and adds
  encoders and screen taps and holds alongside keys.
- Anything older than `1.0.0` predates the WebSocket transport and will not connect to the
  plugin.

`DeckTextures` and the event bus come from the mod, not the library, so put your integration
mod on the client side (`side = "CLIENT"`) like the example above. A server-only mod has no
deck to talk to.