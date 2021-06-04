#!/usr/bin/env bash

base_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export site_name="base-site"
source "$base_dir/functions.sh"

function update_amp_plugin() {

	## GitHub version of AMP plugin
	github_amp_path="$sites_root/repos/github-amp"
	rm -rf "$github_amp_path"

	git clone https://github.com/ampproject/amp-wp.git "$github_amp_path"

	cd "$github_amp_path"
	composer install && npm install && npm run build:prod

}

function setup_base_data() {

	setup_base_site
	cd_plugins

	# Import content of base site.
	bash "$(get_plugins_path)/amp-wp-dummy-data-generator/start.sh"

	## Export base site data.
	rm -f "$sites_root/repos/base-site.sql"
	wp search-replace 'http://base-site.local' 'https://base-site.local' --all-tables
	wp db export "$sites_root/repos/base-site.sql"

	## Move uploads
	rm -rf "$sites_root/repos/uploads"
	mv "$(get_site_path)/wp-content/uploads" "$sites_root/repos"

	## Move plugins to base data
	cd_plugins
	plugin_dirs=(amp wordpress-importer block-unit-test coblocks)
	for plugin_dir in "${plugin_dirs[@]}"; do
		rm -rf "$sites_root/repos/$plugin_dir"
		mv "$plugin_dir" "$sites_root/repos"
	done

	cd_site
	rm -rf "$sites_root/repos/treville"
	mv "wp-content/themes/treville" "$sites_root/repos"

	update_amp_plugin

	[[ "mac" != "$os" ]] && chown -R www-data: /var/www

	## Destroy site.
	destroy_site
}

setup_base_data
