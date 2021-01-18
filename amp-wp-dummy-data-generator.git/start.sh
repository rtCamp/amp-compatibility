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

  wp setup-amp-site

  wp plugin activate amp-wp-dummy-data-generator
}

### Actions before importing data.
actions_before_importing() {

  # CLI commands.
  commands=$(wp amp-wp-dummy-data-generator get_commands --type=before)
  IFS='|' read -ra command_array <<< "$commands"

  for command in "${command_array[@]}"; do
    $command
  done

  # Custom actions.
  wp amp-wp-dummy-data-generator run_custom --type=before

}

### Import Data.
import_data() {

  # Import data from XML file.
  import_files=$(wp amp-wp-dummy-data-generator get_import_files)

  IFS='|' read -ra import_files_array <<< "$import_files"

  for import_file in "${import_files_array[@]}"; do
    wp import --authors=create $plugin_dir/data/$import_file
  done

  # Generate custom content.
  wp amp-wp-dummy-data-generator generate

}

### Actions before importing data.
actions_after_importing() {

  # CLI commands
  commands=$(wp amp-wp-dummy-data-generator get_commands --type=after)
  IFS='|' read -ra command_array <<< "$commands"

  for command in "${command_array[@]}"; do
    $command
  done

  # Custom actions.
  wp amp-wp-dummy-data-generator run_custom --type=after

}


setup_site
actions_before_importing
import_data
actions_after_importing
