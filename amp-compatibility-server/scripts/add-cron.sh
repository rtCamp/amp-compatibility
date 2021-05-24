#!/usr/bin/env bash

# ⚠️ Warning: This will completely overwrite the crontab of system where the script is executed with the crons defined in this script. This is intended to run on amp-compatibility server primary instance only. Please run this with caution.

# Execution: bash add-cron.sh

REPO_ROOT="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )/../../" >/dev/null 2>&1 && pwd )"
CD_PATH="$REPO_ROOT/amp-compatibility-server"

CRONTAB_CONFIG=(
	# Path of the application to update working directory for cron execution.
	"PATH=$PATH"
	"PM2_HOME=/root/.pm2"
)

CRONS=(
	# Run every 2 minutes.
	"*/2 * * * * cd $CD_PATH && bash scripts/pull-cd.sh  > logs/cron/pull-cd.log 2>&1"
	# Run every day at 12 AM
	"0 0 * * * cd $CD_PATH && bash scripts/sites/base-site.sh"
	"0 0 * * * cd $CD_PATH && node ace wporg:scraper --browse=updated > logs/cron/scrapper.log 2>&1"
	"0 0 * * * cd $CD_PATH && node ace update_compute_fields:extension_version > logs/cron/update_compute_fields_extension_version.log 2>&1"
	# Run at 4 AM every Saturday
	"0 4 * * 6 cd $CD_PATH && node ace synthetic_queue:refill --plugin-active-install=10000 --theme-active-install=1000 > logs/cron/synthetic-data-refill-cron.log 2>&1"
	# Run at 6 AM every Saturday
	"0 6 * * 6 cd $CD_PATH && node ace synthetic-data:start --number-of-instance=9 --concurrency=25 > logs/cron/synthetic-data-start-cron.log 2>&1"
	# Run every sunday at 12 AM
	"0 0 * * 0 cd $CD_PATH && node ace big_query:update > logs/cron/sync-mysql-to-bigquery.log 2>&1"
)

# Do not edit below this line.

TMP_CRON_FILE="/tmp/cron"

[[ -f "$TMP_CRON_FILE" ]] && rm "$TMP_CRON_FILE" || echo ''

for config in "${CRONTAB_CONFIG[@]}"; do
	echo "$config" >> "$TMP_CRON_FILE"
done


for cron in "${CRONS[@]}"; do
	echo "$cron" >> "$TMP_CRON_FILE"
done

crontab "$TMP_CRON_FILE"
rm "$TMP_CRON_FILE"
