# WP CLI Test Data
Plugin that generate ideal content for website considering active plugins and theme to validate AMP compatibility of the site and send data to node server.

## How to use?
Install this plugin in WordPress installation. And run below command from current plugin directory.

```bash
bash ./setup.sh
```

## WP CLI Commands

#### To generate data.
```bash
wp amp-wp-compatibility generate
```

#### To send AMP validation data.
File location: [./amp-send-data.php](./amp-send-data.php)
```bash
wp amp-send-data
```

#### To get list XML file name that need to import (Filename separated with pipeline "|")
```bash
wp amp-wp-compatibility get_import_files
```

#### To get list WP CLI command that need to run after content importing (Command separated with pipeline "|")
```bash
wp amp-wp-compatibility get_plugin_commands
```

#### Run custom script of each active plugins after content importing.
```bash
wp amp-wp-compatibility plugin_after_setup
```

## Directory/File Info

### [./inc/classes/generator/](./inc/classes/generator/)
Contains all content generator classes.

### [./inc/classes/plugin-configs/](./inc/classes/plugin-configs/)
Contains class for individual plugin. each class contain following information. 
- Information regarding file path and URL for unit test case data for that plugin. 
- List CLI command that need to run in order to generate setup site.
- Custom function that will run after content creation. 

### [./inc/classes/wp-cli/class-commands.php](./inc/classes/wp-cli/class-commands.php)
Define all helper WP CLI command for [bash script](./setup.sh)
