# Dummy Data Directory #

This directory contains the dummy data files to be imported for different plugins and themes.

_All `.xml` and `.wxr` files in the directory `data/wporg/core/` will get imported unless `--exclude-default` is passed._

## Directory Structure: ##

```
data
├── premium
│   ├── plugins
│   │   └── my-premium-plugin
│   └── themes
│       └── my-premium-theme
└── wporg
    ├── core
    ├── plugins
    │   ├── bbpress
    │   ├── jetpack
    │   └── woocommerce
    └── themes
        └── twentytwenty

```

### Directory `wporg` ###
Contains dummy data files for plugins and themes available on WordPress.org

### Directory `premium` ###
Contains dummy data files for premium plugins and themes

*The slug of the plugin/theme name must match the directory name here*

## Files within a plugin/theme directory ##

```
buddypress-media
├── import.xml
├── any-name.xml
├── some-more-import.wxr
├── post.sh
└── pre.sh
```

### File `pre.sh` ###

This file will be executed before the data files are imported.

### File `post.sh` ###

This file will be executed after the data files are imported.

### Files `*.xml` ###

All `.xml` and `.wxr` files within the **individual plugin/theme directory** will get imported, when that plugin is active.