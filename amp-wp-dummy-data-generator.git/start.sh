# setup.sh
#!/bin/bash

set -x
set -e

plugin_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

setup_site() {
  wp rewrite flush
  wp cache flush

  wp plugin install --activate wordpress-importer $1
  wp plugin install --activate block-unit-test $1
  wp plugin install --activate coblocks $1

  wp plugin activate amp-wp-dummy-data-generator $1
}

import_data() {

  ## Import data from XML file.
  import_files=$(wp amp-wp-dummy-data-generator get_import_files $1)

  IFS='|' read -ra import_files_array <<< "$import_files"

  for import_file in "${import_files_array[@]}"; do
    wp import --authors=create $plugin_dir/data/$import_file $1
  done

  ## Run Plugin CLI commands.
  commands=$(wp amp-wp-dummy-data-generator get_plugin_commands $1)

  IFS='|' read -ra command_array <<< "$commands"

  for command in "${command_array[@]}"; do
    $command
  done

  ## Run After setup functions.
  wp amp-wp-dummy-data-generator plugin_after_setup $1

  wp amp-wp-dummy-data-generator generate $1

}


setup_site $1

import_data $1
