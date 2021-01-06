#!/usr/bin/env bash

extension_version_slug=$1
type=$2
slug=$3
version=$4
site_name="$extension_version_slug.local"

# TODO: This variable should be change dynamically based on current os.
os='ubuntu' # Values can be mac,ubuntu

# TODO: This variable should be change dynamically based on environment.
environment='prod' # Values can be prod,dev
amp_endpoint_flag=''

if [[ "mac" == "$os" ]]; then
  sites_root="$HOME/Sites"
else
  sites_root='/var/www'
fi

if [[ "prod" != "$environment" ]]; then
  amp_endpoint_flag='--endpoint=http://127.0.0.1:3333'
fi

function wp() {
	wp_path=$(which wp)
	php "$wp_path" --allow-root "$@"
}

function get_site_path() {
  if [[ "mac" == "$os" ]]; then
    echo "$sites_root/$extension_version_slug"
  else
    echo "$sites_root/$site_name/htdocs"
  fi
}

function get_plugins_path() {
  if [[ "mac" == "$os" ]]; then
    echo "$sites_root/$extension_version_slug/wp-content/plugins"
  else
    echo "$sites_root/$site_name/htdocs/wp-content/plugins"
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
    wp valet new "$extension_version_slug"
  else
    wo site create "$site_name" --wp
  fi
}

function destroy_site() {
  cd_sites_root
  if [[ "mac" == "$os" ]]; then
    wp valet destroy "$extension_version_slug" --yes
  else
    wo site delete "$site_name" --no-prompt
  fi
}

function setup_site() {

	echo "127.0.0.1 $site_name" >> /etc/hosts

	create_site

	cd_site
	wp plugin install --activate amp
	wp plugin delete nginx-helper

	cd_plugins
	ln -sn "$sites_root/amp-wp-dummy-data-generator" .
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

	cd_plugins
	bash amp-wp-dummy-data-generator/start.sh
}

function process_amp() {
  wp amp validation reset --yes
  wp amp validation run --force
  wp amp-send-data "$amp_endpoint_flag"
}

function main() {
	setup_site
	process_site
	process_amp
	destroy_site
}

main
