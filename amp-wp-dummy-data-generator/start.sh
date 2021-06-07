#!/usr/bin/env bash

plugin_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

exclude_default_flag=""

for i in "$@"; do
	case $i in
	--url=*)
		url="${i#*=}"
		url_flag="--url=$url"
		shift
		;;
	--exclude-default*)
		exclude_default_flag="--exclude-default"
		shift
		;;
	*)
		# unknown option
		;;
	esac
done


function wp() {
	wp_path=$(which wp)
	php "$wp_path" $url_flag --allow-root "$@"
}

setup_site() {
	wp rewrite flush
	wp cache flush

	wp plugin install --activate wordpress-importer
	#block-unit-test coblocks

	wp plugin activate amp-wp-dummy-data-generator
}

### Scripts to execute before importing data.
actions_before_importing() {

	# CLI commands.
	scripts=$(wp amp-wp-dummy-data-generator get_scripts --type=before $exclude_default_flag)
	IFS='|' read -ra scripts_array <<< "$scripts"

	for script in "${scripts_array[@]}"; do
		bash $script
	done

}

### Import Data.
import_data() {

	# Import data from XML file.
	import_files=$(wp amp-wp-dummy-data-generator get_import_files $exclude_default_flag)

	IFS='|' read -ra import_files_array <<< "$import_files"

	for import_file in "${import_files_array[@]}"; do
		wp import --authors=create $import_file
	done

	# Generate custom content.
	wp amp-wp-dummy-data-generator generate $exclude_default_flag

}

### Actions before importing data.
actions_after_importing() {

	# CLI commands
	scripts=$(wp amp-wp-dummy-data-generator get_scripts --type=after $exclude_default_flag)
	IFS='|' read -ra scripts_array <<< "$scripts"

	for script in "${scripts_array[@]}"; do
		bash $script
	done

}


setup_site
actions_before_importing
import_data
actions_after_importing
