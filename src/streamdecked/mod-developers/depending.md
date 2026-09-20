---
prev:
  text: StreamDecked
  link: /streamdecked/

next:
  text: Writing a Plugin
  link: /streamdecked/mod-developers/plugin

title: Depending on StreamDecked
description: Set up a mod that integrates with StreamDecked.
---

# Depending on StreamDecked

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

In `build.gradle`, add the StreamDecked maven and point the implementation at it:

```groovy
repositories {
    mavenCenteral()
    
    maven {
        name = "streamdecked"
        url = "https://dl.cloudsmith.io/public/wolfieboy09/stream-decked/maven/"
        content {
          includeGroup("dev.wolfieboy09")
        }
    }
}

dependencies {
    implementation "dev.wolfieboy09:streamdecked:1.0.0"
}
```