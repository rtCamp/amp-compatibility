# amp-compatibility

## Download

From the root of a WordPress installation:
```bash
cd wp-content && git clone git@github.com:rtCamp/amp-compatibility.git plugins
cd amp-compatibility-server && npm install
cp .env.example .env
```

# amp-compatibility-server

Node JS server based on [Adonis](https://adonisjs.com/docs/3.2/overview).

Contains BigQuery database schema; REST API for managing compute engine instances; user interface for adding adhoc requests; command line tools for managing data.

See [amp-compatibility-server/README.md](./amp-compatibility-server/README.md)

# amp-wp-dummy-data-generator

WordPress plugin.

Populates site content based on currently active plugins.

See [amp-wp-dummy-data-generator/README.md](./amp-wp-dummy-data-generator/README.md).

See [amp-wp-dummy-data-generator/data/README.md](./amp-wp-dummy-data-generator/data/README.md)