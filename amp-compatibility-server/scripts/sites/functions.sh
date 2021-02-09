#!/usr/bin/env bash

### Machine IP.
machine_ip="127.0.0.1"

wp_admin_user="rtcamp"
wp_admin_password="goodwork"
wp_admin_email="rtbot@rtcamp.com"

### Find operating system.
check_os="$(uname -s)"
case "${check_os}" in
	Linux*)     os=linux;;
	Darwin*)    os=mac;;
	*)          os="UNKNOWN:${check_os}"
esac

### Site Root according to environment.
if [[ "mac" == "$os" ]]; then
	sites_root="$HOME/Sites"
	environment='dev'
	site_domain="$site_name.test"
else
	sites_root='/var/www'
	environment='prod'
	site_domain="$site_name.local"
fi

### Extend global wp command.
function wp() {
	wp_path=$(which wp)
	php "$wp_path" --allow-root "$@"
}

function get_site_path() {
	if [[ "mac" == "$os" ]]; then
		echo "$sites_root/$site_name"
	else
		echo "$sites_root/$site_domain/htdocs"
	fi
}

function get_plugins_path() {
	if [[ "mac" == "$os" ]]; then
		echo "$sites_root/$site_name/wp-content/plugins"
	else
		echo "$sites_root/$site_domain/htdocs/wp-content/plugins"
	fi
}

function cd_sites_root() {
	cd $sites_root
}

function cd_site() {
	cd $(get_site_path)
}

function cd_plugins() {
	cd $(get_plugins_path)
}

function create_site() {

	cd_sites_root
	if [[ "mac" == "$os" ]]; then
		wp valet new "$site_name"
	else
		wo site create "$site_domain" --wp
	fi
}

function destroy_site() {

	cd_sites_root
	if [[ "mac" == "$os" ]]; then
		wp valet destroy "$site_name" --yes
	else
		wo site delete "$site_domain" --no-prompt
	fi
}


function setup_base_site() {

	if [[ "mac" == "$os" ]]; then
		sudo echo "$machine_ip $site_domain" >>/etc/hosts
	else
		echo "$machine_ip $site_domain" >>/etc/hosts
	fi

	create_site

	cd_site

	ln -sn "$sites_root/repos/amp-wp-dummy-data-generator" "$(get_site_path)/wp-content/plugins/amp-wp-dummy-data-generator"

	## Set wp-configs.
	tmp_path="$(get_site_path)/tmp"
	mkdir -p "$tmp_path"
	wp config set WP_TEMP_DIR $tmp_path --add=true --type=constant

	## Activate deactivate plugins.
	wp plugin deactivate nginx-helper
	wp plugin delete nginx-helper
	wp plugin install --activate amp
	wp plugin activate amp-wp-dummy-data-generator
	wp theme install treville --activate

	wp cache flush
	wp rewrite flush
}
