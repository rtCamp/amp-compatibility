# AMP WP Dummy data generator

Plugin that generates sample content for the active plugins and theme with the aim of triggering possible AMP validation errors.

## How to use?
Install this plugin in WordPress installation, And run below command from current plugin directory.

```bash
bash ./start.sh
```

## Once the data generation is complete, run the below command to clean up the environment.

```bash
bash ./cleanup.sh
```
TODO: See also my not in start.sh about using a WP-CLI wrapper command for start.sh instead of using Bash. 

## WP-CLI Commands

#### To send AMP validation data.
```bash
wp amp-send-data
```

#### To configure AMP plugin and set default options/settings.
```bash
wp configure-amp-site
```

## Directory/File Info

### [./data/](./data)
Contains custom data to be imported/generated for various plugins as well as
pre and post import scripts to be executed before and after import.

### [./inc/classes/generator/](./inc/classes/generator)
Contains all content generator classes.

### [./inc/classes/cli/class-commands.php](inc/classes/cli/class-commands.php)
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
