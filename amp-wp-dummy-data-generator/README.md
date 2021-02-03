# AMP WP Dummy data generator
Plugin that generate ideal content for website considering active plugins and theme.

## How to use?
Install this plugin in WordPress installation. And run below command from current plugin directory.

```bash
bash ./start.sh
```

## WP CLI Commands

#### To send AMP validation data.
```bash
wp amp-send-data
```

## Directory/File Info

### [./data/]
Contains custom data to be imported/generated for various plugins as well as
pre and post import scripts to be executed before and after import.

### [./inc/classes/generator/](./inc/classes/generator/)
Contains all content generator classes.

### [./inc/classes/plugin-configs/](./inc/classes/plugin-configs/)
Contains class for individual plugin. each class contain following information. 
- Information regarding file path and URL for unit test case data for that plugin. 
- List CLI command that need to run in order to generate setup site.
- Custom function that will run after content creation. 

### [./inc/classes/wp-cli/class-commands.php](./inc/classes/wp-cli/class-commands.php)
Define all helper WP CLI command for [bash script](./start.sh)
