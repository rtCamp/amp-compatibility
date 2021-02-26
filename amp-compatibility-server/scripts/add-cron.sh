#!/usr/bin/env bash

# ⚠️ Warning: This will completely overwrite the crontab of system where the script is executed with the crons defined in this script. This is intended to run on amp-compatibility server primary instance only. Please run this with caution.

# Execution: bash add-cron.sh

CRONTAB_CONFIG=(
	# Path of the application to update working directory for cron execution.
	"HOME=/opt/workspace/amp-compatibility-server/current"
)

CRONS=(
	# Run every day at 12AM
	"0 0 * * * node ace cache:update && node ace wporg:scraper --use-stream --browse=updated && node ace extension:mapping:update > logs/cron/scrapper.log 2>&1"
	# Run at 4AM every Saturday
	"0 4 * * 6 node ace synthetic-data:start --plugin-active-install=10000 --theme-active-install=1000 > logs/cron/synthetic-data-cron.log 2>&1"
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
