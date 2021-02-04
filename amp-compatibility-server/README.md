# AMP Compatibility Server

The AMP compatibility server is a Node JS application based on the [AdonisJS] framework.

## Modules

### Rest API Listener

This module will listen to any request coming from WordPress plugin related to AMP data,
And store request data into Cloud memory store which is remote Redis cache storage. (In the local environment it will store in the local Redis cache.)

**Command to start node server to listen for any request.**
```bash
node server.js
```

### WordPress Org Scraper

This module is a CLI command to fetch plugins and themes from [WordPress.org] and store them to the BigQuery dataset in respective tables.
If a record already exists for any theme and plugin then it will update with the latest data.

**Command**
```bash
node ace wporg:scraper
```

**Options**

| Options               | Description                                                                                  | Usage                                          |
|:----------------------|:---------------------------------------------------------------------------------------------|:-----------------------------------------------|
| --only-themes         | To fetch and only themes data from WordPress.org                                             | node ace wporg:scraper --only-themes           |
| --only-plugins        | To fetch and only plugins data from WordPress.org                                            | node ace wporg:scraper --only-plugins          |
| --per-page            | Number of theme/plugin need to fetch per API call ( Min=2, Max=100, Default=100 ).           | node ace wporg:scraper --per-page=50           |
| --theme-start-from    | From which page we need to start importing themes. Default 1                                 | node ace wporg:scraper --theme-start-from=55   |
| --plugin-start-from   | From which page we need to start importing plugins. Default 1                                | node ace wporg:scraper --plugin-start-from=250 |
| --browse              | Predefined query ordering. Possible values are popular,featured,updated and new.             | node ace wporg:scraper --browse=updated        |
| --use-stream          | Use stream method to if possible. Fast but with certain limitation. [BigQuery DML reference] | node ace wporg:scraper --use-stream            |
| --only-store-in-local | It will only store data in local directory, And won't import in BigQuery.                    | node ace wporg:scraper --only-store-in-local   |

### Request worker

This module is worker which will run continually in background, And process all the request that is stored in cloud memory store.

**Command**
```bash
node ace worker:start --name=request --concurrency=10
```

### Synthetic data generator

This module is responsible for generating synthetic data for extensions (theme/plugins). It will perform the following tasks.
- First, It will check for which extensions (themes/plugins) need to generate synthetic data, And add those extensions list into `synthetic_data_queue`.
- Then It will create one or multiple Compute engine instances (based on param value we pass and number of jobs) Or use the existing one, And setup those compute instances to run the synthetic data generation process.
- After setting up compute instances, It will start worker for generating synthetic data with the concurrency passed in command.

**Command**
```bash
node ace synthetic-data:start
```

**Options**

| Options               | Description                                                                                                                                                         | Usage                                                     |
|:----------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------|
| --only-themes         | To generate synthetic data only for themes.                                                                                                                         | node ace synthetic-data:start --only-themes               |
| --only-plugins        | To generate synthetic data only for plugins.                                                                                                                        | node ace synthetic-data:start --only-plugins              |
| --limit               | The number of themes/plugins need to add to the queue and process.                                                                                                  | node ace synthetic-data:start --limit=1000                |
| --number-of-instance  | The number of instances needs to create for the synthetic data process. ( Min=1, Max=100, Default=1 )                                                               | node ace synthetic-data:start --number-of-instance=5      |
| --concurrency         | The number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min=1, Max=120, Default=100 ) | node ace synthetic-data:start --concurrency=30            |
| --vm-name             | Virtual machine name. ( Default=synthetic-data-generator )                                                                                                          | node ace synthetic-data:start --vm-name="Virtual Machine" |
| --prevent-vm-deletion | To prevent Compute engine instance to terminal. It will only prevent if there is only one instance.                                                                 | node ace synthetic-data:start --prevent-vm-deletion       |


## Setup

### Setting up repo
```bash
$ git clone git@github.com:rtCamp/amp-compatibility.git
cd amp-compatibility-server
npm install 
```

### Configure environment variables.

- Create environment config file.
```bash
cp .env.example .env
```


### Starting up server


**Important Notes**
- In production environment WordPress.org scraper, Request worker and Dashboard will run on primary compute instance.
    To start all service at once in background we use `pm2 start ecosystem.config.js`


## CLI Commands

### Add request of generating synthetic data for specified theme and plugin(s):
```
node ace adhoc-synthetic-data:add
	--theme=@value : Theme to test synthetic data for/against e.g., treville:latest.
	--plugins=@value : Plugin(s) to be used in synthetic data test. Accepts comma separated values of plugin_name:version.
	--email=@value : Email id to which mail will be sent with updates and data.
```

Defined in [app/Commands/AdhocSyntheticDataAdd.js](./app/Commands/AdhocSyntheticDataAdd.js)

### Update local redis cache data with BigQuery:
```bash
node ace cache:update
```

Defined in [app/Commands/CacheUpdate.js](./app/Commands/CacheUpdate.js)

### To update mapping of extensions:
```bash
node ace extension:mapping:update
```

Defined in [app/Commands/ExtensionMappingUpdate.js](./app/Commands/ExtensionMappingUpdate.js)

### To refill synthetic data queue with any possible jobs:
```bash
node ace synthetic-data:start
	--only-themes : Fetch all the themes.
	--only-plugins : Fetch all the plugins.
	--limit=@value : Number of theme/plugin need add in queue.
	--number-of-instance=@value : Number of instance need to create for synthetic data process. ( Min= 1, Max= 100, Default= 1 )
	--concurrency=@value : Number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min= 1, Max= 120, Default= 100 )
	--vm-name=@value : Virtual machine name. (Default: synthetic-data-generator)
	--prevent-vm-deletion : Fetch all the themes.
```

Defined in [app/Commands/SyntheticDataStart.js](./app/Commands/SyntheticDataStart.js)

### To create user for application
```
node ace user:create
	--username=@value : Username of user.
	--email=@value : Email address of user.
	--password=@value : Password for user.
```

Defined in [app/Commands/UserCreate.js](./app/Commands/UserCreate.js)

### To start worker to process for job queue.
```
node ace worker:start
	--name=@value : Workers name. e.g. request, synthetic-data
	--concurrency=@value : Worker's concurrency.
```

Defined in [app/Commands/WorkerStart.js](./app/Commands/WorkerStart.js)

### Scrape WordPress.org themes and plugins data:

```
node ace wporg:scraper
	--only-themes : Fetch all the themes.
	--only-plugins : Fetch all the plugins.
	--only-store-in-local : It will only store data in local directory, And won't import in BigQuery.
	--browse=@value : Predefined query ordering. Possible values are popular,featured,updated and new
	--use-stream : Use stream method to if possible. Fast but with certain limitation. Reference - //cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations
	--per-page=@value : Number of theme/plugin need to fetch per API call ( Min= 2, Max= 100 ).
	--theme-start-from=@value : From which page we need to start importing themes. Default 1
	--plugin-start-from=@value : From which page we need to start importing themes. Default 1
```

## Database Schema

[database/migrations](./database/migrations) contains BigQuery database schema.

## Routes

See [start/routes.js](./start/routes.js).

## Views

See [resources/views/](./resources/views/).

## Bash Scripts: Server Configuration

See [scripts/](./scripts)
Also see [../amp-wp-dummy-data-generator/start.sh](../amp-wp-dummy-data-generator/start.sh), which is called by these configuration scripts.


[AdonisJS]: https://adonisjs.com/
[WordPress.org]: https://wordpress.org/
[BigQuery DML reference]: https://cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations
