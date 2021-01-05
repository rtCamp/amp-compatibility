#!/usr/bin/env bash

extension_version_slug=$1
type=$2
slug=$3
version=$4
site_name="$extension_version_slug.local"

function cd_site() {

	cd "/var/www/$site_name/htdocs"
}

function cd_plugins() {

	cd $(wp plugin path);
}

function wp() {

	wp_path=$(which wp)
	php "$wp_path" --allow-root "$@"
}

function setup_site() {

	echo "127.0.0.1 $site_name" >> /etc/hosts
	wo site create "$site_name" --wp

	cd_site
	wp plugin install --activate amp
	wp plugin delete nginx-helper

	cd_plugins
	ln -sn /var/www/amp-wp-dummy-data-generator .
	wp plugin activate amp-wp-dummy-data-generator
	wp cache flush
}

process_site() {

	cd_plugins
	[[ -n "$version" ]] && version_string="--version=$version" || version_string=""

	if [[ "$type" == "plugin" ]]; then
		wp plugin install "$slug" --activate $version_string
		wp theme install treville --activate
	else
		wp theme install "$slug" --activate $version_string
	fi

	bash $(wp plugin path)/amp-wp-dummy-data-generator/start.sh
}

process_amp() {
  wp amp validation reset --yes
  wp amp validation run --force
  wp amp-send-data
}

function destroy_site() {

	wo site delete "$site_name" --no-prompt
}

function main() {

  setup_site
  process_site
  process_amp
  destroy_site
}

main
