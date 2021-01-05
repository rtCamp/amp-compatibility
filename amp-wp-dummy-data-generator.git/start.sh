#!/usr/bin/env bash

set -ex

plugin_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

[[ -n "$1" ]] && url_flag="$1" || url_flag=""

function wp() {
  wp_path=$(which wp)
  php "$wp_path" $url_flag --allow-root "$@"
}

setup_site() {
  wp rewrite flush
  wp cache flush

  wp plugin install --activate wordpress-importer
  wp plugin install --activate block-unit-test
  wp plugin install --activate coblocks

  wp plugin activate amp-wp-dummy-data-generator
}

import_data() {

  ## Import data from XML file.
  import_files=$(wp amp-wp-dummy-data-generator get_import_files)

  IFS='|' read -ra import_files_array <<< "$import_files"

  for import_file in "${import_files_array[@]}"; do
    wp import --authors=create $plugin_dir/data/$import_file
  done

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


setup_site

import_data
