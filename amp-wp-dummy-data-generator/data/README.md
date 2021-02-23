# Dummy Data Directory #

This directory contains the dummy data files to be imported for different plugins and themes.

_All `.xml` and `.wxr` files in the directory `data/wporg/core/` will get imported unless `--exclude-default` is passed._

## Directory Structure: ##

```
data
├── premium
│   ├── plugins
│   │   └── my-premium-plugin
│   └── themes
│       └── my-premium-theme
└── wporg
    ├── core
    ├── plugins
    │   ├── bbpress
    │   ├── jetpack
    │   └── woocommerce
    └── themes
        └── twentytwenty
```

TODO: Should the sample data be actually committed to the repo as opposed to being gitignored and pulled down from their respective locations when running? As it stands right now, the sample data will become stale. Although maybe the desire is rather for consistency between runs.

### Directory `wporg` ###
Contains dummy data files for plugins and themes available on WordPress.org

### Directory `premium` ###
Contains dummy data files for premium plugins and themes

TODO: Probably better to use "commercial" rather than "premium", since in my experience so called "premium" themes/plugins are often _worse_ in quality than non-commercial ones. WordPress.org uses the term "commercial" to describe these as well: https://wordpress.org/themes/commercial/

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

This script will be executed before the data files are imported.

This can include install commands for recommended plugins to be installed in conjunction
with this plugin, eg. an extension plugin for WooCommerce would require WooCommerce to be
installed and activated, in which case, we can add

`wp plugin install woocommerce --activate`

in `pre.sh` file for that extension.

TODO: Add an example plugin to the repo that uses uses pre.sh. There aren't currently any examples committed. 

### File `post.sh` ###

This script will be executed after the data files are imported.

This can be helpful if we want to run certain commands after data is imported, e.g. the Yoast SEO
plugin might require to reindex the data after import in which case we can add

`wp yoast index`

in `post.sh` file.

TODO: Add an example plugin to the repo that uses uses post.sh. There aren't currently any examples committed. For example, 

### Files `*.xml` and `*.wxr` ###

All `.xml` and `.wxr` files within the **individual plugin/theme directory** will get imported when that plugin is active.
