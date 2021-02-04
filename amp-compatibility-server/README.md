# AMP Compatibility Server

## Setup

Install:
```bash
npm install
```

Configure Environment:
```bash
cp .env.example .env
```

* Edit .env to insert random value for `APP_KEY`


## CLI Commands

### Add request of generating synthetic data for specified theme and plugin(s):
```bash
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
```bash
node ace user:create
	--username=@value : Username of user.
	--email=@value : Email address of user.
	--password=@value : Password for user.
```

Defined in [app/Commands/UserCreate.js](./app/Commands/UserCreate.js)

### To start worker to process for job queue.
```bash
node ace worker:start
	--name=@value : Workers name. e.g. request, synthetic-data
	--concurrency=@value : Worker's concurrency.
```

Defined in [app/Commands/WorkerStart.js](./app/Commands/WorkerStart.js)

### Scrape wordpress.org themes and plugins data:

```bash
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
