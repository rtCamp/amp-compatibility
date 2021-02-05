# AMP WP Dummy data generator
Plugin that generate ideal content for website considering active plugins and theme.

## How to use?
Install this plugin in WordPress installation, And run below command from current plugin directory.

```bash
bash ./start.sh
```

## WP CLI Commands

#### To send AMP validation data.
```bash
wp amp-send-data
```

## Directory/File Info

### [./data/](./data)
Contains custom data to be imported/generated for various plugins as well as
pre and post import scripts to be executed before and after import.

### [./inc/classes/generator/](./inc/classes/generator/)
Contains all content generator classes.

### [./inc/classes/wp-cli/class-commands.php](./inc/classes/wp-cli/class-commands.php)
Define all helper WP CLI command for [bash script](./start.sh)


## Credits

1. [AMP WP Compatibility suite] by [Felix Arntz]

   For the references of generating dummy content for the custom post type, gutenberg blocks, navigations menus, And setup default widgets for the site.


2. [AMP WP Theme compat analysis] by [Weston Ruter]

   For the references of bash script to import default theme unit test case data from .xml file, install and configure AMP plugin and run AMP validation.


[AMP WP Compatibility suite]: https://github.com/felixarntz/amp-wp-compatibility-suite
[AMP WP Theme compat analysis]: https://github.com/westonruter/amp-wp-theme-compat-analysis
[Weston Ruter]: https://github.com/westonruter/
[Felix Arntz]: https://github.com/felixarntz/