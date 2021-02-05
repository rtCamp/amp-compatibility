# AMP Compatibility Server

The AMP compatibility server is a Node JS application based on the [AdonisJS] framework.

---

## Modules

### 1. Rest API Listener

This module will listen to any request coming from WordPress plugin related to AMP data,
And store request data into Cloud memory store which is remote Redis cache storage. (In the local environment it will store in the local Redis cache.)

**Command to start node server to listen for any request.**
```bash
node server.js
```

### 2. WordPress Org Scraper

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

### 3. Request worker

This module is worker which will run continually in background, And process all the request that is stored in cloud memory store.

**Command**
```bash
node ace worker:start --name=request --concurrency=10
```

### 4. Synthetic data generator

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

### 5. Dashboard

The Basic dashboard where admin user can see current status of all the queues, And it's jobs related information.
Also, user can add adhoc synthetic data generation request. For run test on combination of plugins and theme.

---

## Setup

### 1. Setting up repo
```bash
git clone git@github.com:rtCamp/amp-compatibility.git
cd amp-compatibility-server
npm install 
```

### 2. Configure environment variables.

- Create environment config file from example.env file.
```bash
cp .env.example .env
```

- Update environment variables.

| Name                           | Default                | Description                                                    |
|:-------------------------------|:-----------------------|:---------------------------------------------------------------|
| NODE_ENV                       | -                      | Application environment.                                       |
| HOST                           | -                      | Application IP address.                                        |
| PORT                           | -                      | Port for the application                                       |
| APP_NAME                       | -                      | Node application name.                                         |
| APP_URL                        | http://${HOST}:${PORT} | Application base URL.                                          |
| APP_KEY                        | -                      | App Key for hashing. Use `adonis key:generate` to generate key |
| SESSION_DRIVER                 | cookie                 | Driver for the session provider. e.g. cookie, file, redis      |
| CACHE_VIEWS                    | false                  | To enable/disable view caching.                                |
| HASH_DRIVER                    | bcrypt                 | Driver for hashing user data. e.g. bcrypt, argon               |
| DB_CONNECTION                  | sqlite                 | Database driver for the application. e.g. mysql, sqlite        |
| DB_HOST                        | 127.0.0.1              | Database host.                                                 |
| DB_PORT                        | 3306                   | Database port.                                                 |
| DB_USER                        | root                   | Database user name.                                            |
| DB_PASSWORD                    | -                      | Password for data.                                             |
| DB_DATABASE                    | -                      | Database name.                                                 |
| QUEUE_REDIS_HOST               | 127.0.0.1              | IP Address of GCP Cloud memory store.                          |
| REDIS_CONNECTION               | local                  | Name of redis configuration.                                   |
| REDIS_HOST                     | 127.0.0.1              | Redis host name for local object caching.                      |
| REDIS_PORT                     | 6379                   | Redis port for local object caching.                           |
| REDIS_PASSWORD                 | -                      | Redis password for local object caching.                       |
| REDIS_KEYPREFIX                | local                  | Prefix of redis cache keys.                                    |
| GOOGLE_CLOUD_PROJECT           | -                      | Name of Google cloud project.                                  |
| GOOGLE_APPLICATION_CREDENTIALS | -                      | Full path to service account JSON file.                        |
| DEPLOY_KEY_PATH                | -                      | SSH key path. which will use by secondary compute instance.    |
| BIGQUERY_PROJECT_ID            | -                      | Name of Google cloud project for BigQuery dataset.             |
| BIGQUERY_DATASET               | -                      | BigQuery dataset name.                                         |
| GCP_ZONE                       | us-central1-a          | GCP zone where we secondary instances will created.            |
| GCP_INSTANCE_TYPE              | c2-standard-4          | GCP instance type for secondary compute instances.             |
| GITHUB_TOKEN                   | -                      | GitHub Token for cloning repos in secondary instance.          |
| NEWRELIC_LICENSE               | -                      | New Relic License                                              |


### 3. Setup local database and BiqQuery dataset. 

To setup local MySQL database and dataset in bigquery run below command. It will create all necessary table in MySQL as well as in BigQuery dataset.
```bash
node ace migration:run
```

### 4. Starting up server

- To start only node server (To start dashboard) for development purpose. Use `adonis serve --dev`. It will automatically reload the server on any file changes.
- However, On production environment. We use process management tool pm2 to start Dashboard, Request worker and adhoc synthetic worker. It will start all three process in background.
Command: `pm2 start ecosystem.config.js`

---

## CLI Commands

### 1. WordPress Org scraper
Please check [WordPress Org Scraper](#wordpress-org-scraper) module for detail.


### 2. Update local Redis cache with BigQuery dataset. 

**Example**
```bash
node ace cache:update
```

**Uses**
This command is used to update the local Redis cache with the BigQuery dataset.
It will fetch all the data from BigQuery and store key and encrypted values in the local Redis cache (Not in the cloud memory store).
This will helpful, when we working with an existing dataset or when `APP_KEY` is changed.
Note that the time the command takes to execute will depend on the size of the dataset.


### 3. To start any queue worker.

**Example**

**Usage**

**Options**

### 4. To start synthetic data process.

**Example**

**Usage**

**Options**

### 5. To Add custom request for synthetic data. (Add job in adhoc synthetic data)

**Example**

**Usage**

**Options**

### 6. To create user for the dashboard.

**Example**

**Usage**

**Options**

### 7. To update extensions, and it's version mapping json file. 

**Example**

**Usage**

**Options**

---

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
