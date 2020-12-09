# setup.sh
#!/bin/bash

set -x
set -e

plugin_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

setup_site() {
  wp rewrite flush
  wp cache flush

  wp plugin install --activate wordpress-importer
  wp plugin install --activate block-unit-test
  wp plugin install --activate coblocks

  wp plugin install --activate amp
  wp option update --json amp-options '{"theme_support":"standard"}'

  # wp plugin install --activate amp-wp-dummy-data-generator
  wp plugin activate amp-wp-dummy-data-generator
}

import_data() {

  ## Import data
  import_files=$(wp amp-wp-dummy-data-generator get_import_files)

  IFS='|' read -ra import_files_array <<< "$import_files"

  for import_file in "${import_files_array[@]}"; do
    wp import --authors=create $plugin_dir/data/$import_file
  done

  if [[ 0 == $(wp post list --post_type=attachment --post_name=accelerated-mobile-pages-is-now-just-amp --format=count) ]]; then
    wget https://blog.amp.dev/wp-content/uploads/2019/04/only_amp.mp4
    wp media import --title="Accelerated Mobile Pages is now just AMP" only_amp.mp4
    rm only_amp.mp4
  fi

  ## Run Plugin CLI commands.
  commands=$(wp amp-wp-dummy-data-generator get_plugin_commands)

  IFS='|' read -ra command_array <<< "$commands"

  for command in "${command_array[@]}"; do
    $command
  done

  ## Run After setup functions.
  wp amp-wp-dummy-data-generator plugin_after_setup

  wp amp-wp-dummy-data-generator generate

}

amp() {

  ## Make host entry
  wp amp validation reset --yes
  wp amp validation run --force
  wp amp-send-data --print=json

}

setup_site

import_data

amp
