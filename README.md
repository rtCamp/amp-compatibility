# amp-compatibility

## Download

From the root of a WordPress installation:
```bash
cd wp-content && git clone git@github.com:rtCamp/amp-compatibility.git plugins
```

# amp-compatibility-server

## Setup

Install:
```bash
cd amp-compatibility-server && npm install
```

Configure Environment:
```bash
cp .env.example .env
```

* Edit .env to insert random value for `APP_KEY`

Update local plugin information:
```bash
node ace wporg:scraper --only-store-in-local
```

* Use `node ace wporg:scraper --help` for more options for this command.

Update redis cache:
```bash
node ace cache
```

# amp-wp-dummy-data-generator

## Install any plugins to be tested

```bash
wp plugin install --activate XYZ
```

## Start data generation

```bash
cd amp-wp-dummy-data-generator && bash ./start.sh
```

## WP CLI Commands

#### To send AMP validation data.
```bash
wp amp-send-data
```

## Directory/File Info

### [amp-wp-dummy-data-generator/inc/classes/generator/](amp-wp-dummy-data-generator/inc/classes/generator/)
Contains all content generator classes.

### [amp-wp-dummy-data-generator/inc/classes/plugin-configs/](amp-wp-dummy-data-generator/inc/classes/plugin-configs/)
Contains class for individual plugin. each class contain following information. 
- Information regarding file path and URL for unit test case data for that plugin. 
- List CLI command that need to run in order to generate setup site.
- Custom function that will run after content creation. 

### [amp-wp-dummy-data-generator/inc/classes/wp-cli/class-commands.php](amp-wp-dummy-data-generator/inc/classes/wp-cli/class-commands.php)
Define all helper WP CLI command for [bash script](./start.sh)
