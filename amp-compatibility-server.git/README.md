# Node services
List of node services for AMP Comp DB node server.

## How to use?

Select node version.
```bash
nvm use
```

Install node packages
```bash
npm install
```

Start node server to listen requests.
```bash
node server.js
```

Generate JSON for [wp.org](wp.org) plugins.
```bash
node generate-plugin-json.js
```

Generate JSON for wp.org themes.
```bash
node generate-theme-json.js
```

## File/Directory Info
- [./data](./data/): Contains data generate with node services.
- [./config](./config/): Contains config file for authentication for bigquery.
- [./bigqueryclient.js](./bigqueryclient.js): Wrapper class for bigquery.
 