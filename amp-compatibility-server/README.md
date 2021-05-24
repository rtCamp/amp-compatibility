# AMP Compatibility Server

The AMP compatibility server is a Node JS application based on the [AdonisJS] framework.

---

## Setup

### 1. Setting up repo

```bash
git clone git@github.com:rtCamp/amp-compatibility.git
cd amp-compatibility/amp-compatibility-server
npm install
```

**Install Adonis CLI (For development only)**

```bash
npm i -g @adonisjs/cli
```

### 2. Configure environment variables.

- Create environment config file from example.env file.
```bash
cp .env.example .env
```

- Update environment variables.

| Name                           | Default                | Description                                                     | Used in below modules                                                                         |
|:-------------------------------|:-----------------------|:----------------------------------------------------------------|:----------------------------------------------------------------------------------------------|
| NODE_ENV                       | -                      | Application environment.                                        | All                                                                                           |
| HOST                           | -                      | Application IP address.                                         | Rest API Listener, Dashboard                                                                  |
| PORT                           | -                      | Port for the application.                                       | Rest API Listener, Dashboard                                                                  |
| APP_NAME                       | (Optional)             | Node application name.                                          | Rest API Listener, Dashboard                                                                  |
| APP_URL                        | http://${HOST}:${PORT} | Application base URL.                                           | Rest API Listener, Dashboard                                                                  |
| APP_KEY                        | -                      | App Key for hashing. Use `adonis key:generate` to generate key. | All                                                                                           |
| SESSION_DRIVER                 | cookie                 | Driver for the session provider. e.g. cookie, file, redis       | Rest API Listener, Dashboard                                                                  |
| CACHE_VIEWS                    | false                  | To enable/disable view caching.                                 | Rest API Listener, Dashboard                                                                  |
| HASH_DRIVER                    | bcrypt                 | Driver for hashing user data. e.g. bcrypt, argon                | Rest API Listener, WordPress Org Scraper, Request worker, Synthetic data generator, Dashboard |
| DB_CONNECTION                  | sqlite                 | Database driver for the application. e.g. mysql, sqlite         | Dashboard                                                                                     |
| DB_HOST                        | 127.0.0.1              | Database host.                                                  | Dashboard                                                                                     |
| DB_PORT                        | 3306                   | Database port.                                                  | Dashboard                                                                                     |
| DB_USER                        | root                   | Database user name.                                             | Dashboard                                                                                     |
| DB_PASSWORD                    | -                      | Password for data.                                              | Dashboard                                                                                     |
| DB_DATABASE                    | -                      | Database name.                                                  | Dashboard                                                                                     |
| QUEUE_REDIS_HOST               | 127.0.0.1              | IP Address of GCP Cloud memory store.                           | Rest API Listener, Request worker, Synthetic data generator, Dashboard                        |
| REDIS_CONNECTION               | local                  | Name of redis configuration.                                    | WordPress Org Scraper, Request worker,                                                        |
| REDIS_HOST                     | 127.0.0.1              | Redis host name for local object caching.                       | WordPress Org Scraper, Request worker,                                                        |
| REDIS_PORT                     | 6379                   | Redis port for local object caching.                            | WordPress Org Scraper, Request worker,                                                        |
| REDIS_PASSWORD                 | -                      | Redis password for local object caching.                        | WordPress Org Scraper, Request worker,                                                        |
| REDIS_KEYPREFIX                | local                  | Prefix of redis cache keys.                                     | Rest API Listener, WordPress Org Scraper, Request worker, Dashboard                           |
| GOOGLE_CLOUD_PROJECT           | -                      | Name of Google cloud project.                                   | Synthetic data generator,                                                                     |
| GOOGLE_APPLICATION_CREDENTIALS | -                      | Full path to service account JSON file.                         | WordPress Org Scraper, Request worker, Synthetic data generator                               |
| DEPLOY_KEY_PATH                | -                      | SSH key path. which will use by secondary compute instance.     | Synthetic data generator,                                                                     |
| BIGQUERY_PROJECT_ID            | -                      | Name of Google cloud project for BigQuery dataset.              | WordPress Org Scraper, Request worker, Synthetic data generator                               |
| BIGQUERY_DATASET               | -                      | BigQuery dataset name.                                          | WordPress Org Scraper, Request worker, Synthetic data generator                               |
| GCP_ZONE                       | us-central1-a          | GCP zone where we secondary instances will created.             | Synthetic data generator                                                                      |
| GCP_INSTANCE_TYPE              | c2-standard-4          | GCP instance type for secondary compute instances.              | Synthetic data generator                                                                      |
| GITHUB_TOKEN                   | -                      | GitHub Token for cloning repos in secondary instance.           | Synthetic data generator                                                                      |
| STORAGE_BUCKET_NAME            | (Optional)             | GCP Storage bucket name to store log files.                     | Synthetic data generator                                                                      |
| GOOGLE_CLIENT_ID               |                        | Google client ID of your application.                           | Dashboard ( For Google login )                                                                |
| GOOGLE_CLIENT_SECRET           |                        | Secret key of your application.                                 | Dashboard ( For Google login )                                                                |


### 3. Setup local database and BiqQuery dataset.

To setup local MySQL database and dataset in BigQuery run below command. It will create all necessary table in MySQL as well as in BigQuery dataset.
```bash
node ace migration:run
```

**Notes:**
- For "WordPress Org Scraper", "Request worker", "Synthetic data generator" and "Dashboard" module. 
  Please make sure tables in the BigQuery dataset is exist. 
  You can use `node ace migration:run` command to create all necessary MySQL tables and dataset and its tables in BigQuery.

---

## Modules

### 1. Rest API Listener

This module will listen to any request coming from WordPress plugin related to AMP data,
And store request data into cloud memory store which is remote Redis cache storage. (In the local environment it will store in the local Redis cache.)

**Command to start node server to listen for any request.**
- Development environment. (This will watch any change made in code and reload the server.)
```bash
adonis serve --dev
```

- Production environment.
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
| --browse              | Predefined query ordering. Possible values are popular, featured, updated and new.           | node ace wporg:scraper --browse=updated        |

### 3. Request worker

This module is worker which will run continually in background, and process all the request that is stored in cloud memory store.

**Environment variables to setup module**

**Command**
```bash
node ace worker:start --name=request --concurrency=10
```

### 4. Refill synthetic jobs

To refill synthetic data queue with any possible jobs.

It will check for which extensions (themes/plugins) need to generate synthetic data, and add those extensions list into `synthetic`.

**Command**
```bash
node ace synthetic_queue:refill
```

**Options**

| Options                 | Description                                                                                                                                                         | Usage                                                       |
|:------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------|
| --only-themes           | To generate synthetic data only for themes.                                                                                                                         | node ace synthetic-data:start --only-themes                 |
| --only-plugins          | To generate synthetic data only for plugins.                                                                                                                        | node ace synthetic-data:start --only-plugins                |
| --plugin-active-install | Active installs criteria for plugins to run synthetic data. The plugin must have more or equal active install to test. "0" means all the plugins. (Default=0)       | node ace synthetic-data:start --plugin-active-install=10000 |
| --theme-active-install  | Active installs criteria for themes to run synthetic data. The themes must have more or equal active install to test. "0" means all the plugins. (Default=0)        | node ace synthetic-data:start  --theme-active-install=1000  |
| --force                 | To generate synthetic data for extensions even if data is already exists.                                                                                           | node ace synthetic-data:start --force                       |


### 5. Synthetic data generator

This module is responsible for generating synthetic data for extensions (theme/plugins). It will perform the following tasks.
- First, It will create one or multiple compute engine instances (based on param value we pass and number of jobs) or use the existing one, and setup those compute instances to run the synthetic data generation process.
- After setting up compute instances, it will start worker for generating synthetic data with the concurrency passed in command.

**Command**
```bash
node ace synthetic-data:start
```

**Options**

| Options                 | Description                                                                                                                                                         | Usage                                                       |
|:------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------|
| --number-of-instance    | The number of instances needs to create for the synthetic data process. ( Min=1, Max=100, Default=1 )                                                               | node ace synthetic-data:start --number-of-instance=5        |
| --concurrency           | The number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min=1, Max=120, Default=100 ) | node ace synthetic-data:start --concurrency=30              |
| --vm-name               | Virtual machine name. ( Default=synthetic-data-generator )                                                                                                          | node ace synthetic-data:start --vm-name="Virtual Machine"   |
| --prevent-vm-deletion   | To prevent Compute engine instance to terminal. It will only prevent if there is only one instance.                                                                 | node ace synthetic-data:start --prevent-vm-deletion         |

### 6. Dashboard

The Basic dashboard where admin user can see current status of all the queues, And it's jobs related information.
Also, user can add adhoc synthetic data generation request. For run test on combination of plugins and theme.

To setup local MySQL database and dataset in BigQuery run below command. It will create all necessary table in MySQL as well as in BigQuery dataset.
```bash
node ace migration:run
```

**Command to start node server.**
- Development environment. (This will watch any change made in code and reload the server.)
```bash
adonis serve --dev
```

- Production environment.
```bash
pm2 start ecosystem.config.js
```

---

## CLI Commands

### 1. WordPress Org scraper
Please check [WordPress Org Scraper](#2-wordpress-org-scraper) module for detail.


### 2. To start any queue worker.

To start worker for any queue.

**Example**
```bash
node ace worker:start --name=request
```

**Options**

| Option  | Description                                                                                                         |
|:--------|:--------------------------------------------------------------------------------------------------------------------|
| --name  | Name of the queue for which worker need to start. Possible values: request, synthetic-data and adhoc-synthetic-data |


### 3. To Refill synthetic jobs.
Please check [Refill synthetic jobs](#4-refill-synthetic-jobs) module for detail.


### 4. To start synthetic data process.
Please check [Synthetic data generator](#5-synthetic-data-generator) module for detail.


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


### 6. To update computed fields of extension version table.

To update computed fields of extension version table.

**Example**

```bash
node ace update_compute_fields:extension_version
```

### 7. To sync data to BigQuery.

To sync data from MySQL to BigQuery and create views.

**Example**

```bash
node ace big_query:update
```

**Options**

| Option             | Description                      |
|:-------------------|:---------------------------------|
| --create-view-only | (Optional) To create only views. |

### 8. To mark extension version auto verify.

To update extension version status based on previous status.

**Example**

```bash
node ace extension_version:verify
```

### 9. Retry jobs.

To add all job of given status back into a queue.

**Example**

```bash
node ace retry:job --name=request-queue --status=failed
```

**Options**

| Option     | Description                      |
|:-----------|:---------------------------------|
| --name     | Queue name. e.g. request, synthetic-data, adhoc-synthetic-queue |
| --status   | Which status's jobs need to re add. e.g. active, succeeded, failed (Default failed) |


### 10. To create user for the dashboard.

To create admin user for the dashboard.

**Example**

```bash
node ace user:create --email=username@example.com
```

**Options**

| Option     | Description                 |
|:-----------|:----------------------------|
| --email    | Email address of the user.  |


### 11. To remove user for the dashboard.

To remove admin user for the dashboard.

**Example**

```bash
node ace user:remove --email=username@example.com
```

**Options**

| Option     | Description                 |
|:-----------|:----------------------------|
| --email    | Email address of the user.  |


[AdonisJS]: https://adonisjs.com/
[WordPress.org]: https://wordpress.org/
[BigQuery DML reference]: https://cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations
