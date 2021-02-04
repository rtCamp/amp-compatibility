# AMP Compatibility Server

The AMP compatibility server is a Node JS application based on the [AdonisJS] framework.

---

## Modules

### 1. Rest API Listener

This module will listen to any request coming from WordPress plugin related to AMP data,
And store request data into cloud memory store which is remote Redis cache storage. (In the local environment it will store in the local Redis cache.)

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

This module is worker which will run continually in background, and process all the request that is stored in cloud memory store.

**Command**
```bash
node ace worker:start --name=request --concurrency=10
```

### 4. Synthetic data generator

This module is responsible for generating synthetic data for extensions (theme/plugins). It will perform the following tasks.
- First, It will check for which extensions (themes/plugins) need to generate synthetic data, and add those extensions list into `synthetic_data_queue`.
- Then It will create one or multiple compute engine instances (based on param value we pass and number of jobs) or use the existing one, and setup those compute instances to run the synthetic data generation process.
- After setting up compute instances, it will start worker for generating synthetic data with the concurrency passed in command.

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

To setup local MySQL database and dataset in BigQuery run below command. It will create all necessary table in MySQL as well as in BigQuery dataset.
```bash
node ace migration:run
```

### 4. Starting up server

- To start only node server (To start dashboard) for development purpose. Use `adonis serve --dev`. It will automatically reload the server on any file changes.
- However, on production environment, we use process management tool pm2 to start Dashboard, request worker, and adhoc synthetic worker. It will start all three process in background.
Command: `pm2 start ecosystem.config.js`

---

## CLI Commands

### 1. WordPress Org scraper
Please check [WordPress Org Scraper](#2-wordpress-org-scraper) module for detail.


### 2. Update local Redis cache with BigQuery dataset. 

This command is used to update the local Redis cache with the BigQuery dataset.
It will fetch all the data from BigQuery and store key and encrypted values in the local Redis cache (Not in the cloud memory store).
This will helpful, when we working with an existing dataset or when `APP_KEY` is changed.
Note that the time the command takes to execute will depend on the size of the dataset.

**Example**
```bash
node ace cache:update
```

### 3. To start any queue worker.

To start worker for any queue.

**Example**
```bash
node ace worker:start --name=request
```

**Options**

| Option  | Description                                                                                                         |
|:--------|:--------------------------------------------------------------------------------------------------------------------|
| --name  | Name of the queue for which worker need to start. Possible values: request, synthetic-data and adhoc-synthetic-data |


### 4. To start synthetic data process.
Please check [Synthetic data generator](#4-synthetic-data-generator) module for detail.

### 5. To Add custom request for synthetic data. (Add job in adhoc synthetic data)

This command is used to add request of generating synthetic data for specified theme and plugin(s).

**Example**

```bash
node ace adhoc-synthetic-data:add --plugins=woocommerce:4.9.2,woo-gutenberg-products-block,advanced-woo-search,bbpress,contact-form-7,wordpress-seo,jetpack --theme=astra:3.0.2
```

**Options**

| Option    | Description                                                                                                                                                                                                                              |
|:----------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --theme   | (Optional) Name of the theme which will be validated along with other plugins. e.g. astra:3.0.2                                                                                                                                          |
| --plugins | (Optional) List of plugins along with its version which will be validated along with theme (if passed) and other plugins. Multiple plugins need to pass as comma separated values. e.g. woocommerce:4.9.2,woo-gutenberg-products-block |


### 6. To create user for the dashboard.

To create admin user for the dashboard.

**Example**

```bash
node ace user:create --email=username@example.com --username=username --password=userpassword
```

**Options**

| Option     | Description                 |
|:-----------|:----------------------------|
| --email    | Email address of the user.  |
| --username | Username for the user.      |
| --password | Password for the user.      |


### 7. To update extensions, and it's version mapping json file. 

**Example**

```bash
node ace extension:mapping:update
```

[AdonisJS]: https://adonisjs.com/
[WordPress.org]: https://wordpress.org/
[BigQuery DML reference]: https://cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations
