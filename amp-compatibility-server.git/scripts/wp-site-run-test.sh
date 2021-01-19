#!/usr/bin/env bash

for i in "$@"; do
	case $i in
	-d=* | --domain=*)
		extension_version_slug="${i#*=}"
		shift
		;;
	-p=* | --plugins=*)
		plugins="${i#*=}"
		shift
		;;
	-t=* | --theme=*)
		theme="${i#*=}"
		shift
		;;
	*)
		# unknown option
		;;
	esac
done

site_name="$extension_version_slug.local"
machine_ip="127.0.0.1"
check_os="$(uname -s)"
case "${check_os}" in
	Linux*)     os=linux;;
	Darwin*)    os=mac;;
	*)          os="UNKNOWN:${check_os}"
esac

amp_endpoint_flag=''

if [[ "mac" == "$os" ]]; then
	sites_root="$HOME/Sites"
	environment='dev'
else
	sites_root='/var/www'
	environment='prod'
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

	if [[ "mac" == "$os" ]]; then
		sudo echo "$machine_ip $site_name" >>/etc/hosts
	else
		echo "$machine_ip $site_name" >>/etc/hosts
	fi

	create_site

	cd_site
	wp plugin install --activate amp
	wp plugin delete nginx-helper

	tmp_path="$(get_site_path)/tmp"
	mkdir -p "$tmp_path"
	wp config set WP_TEMP_DIR $tmp_path --add=true --type=constant

	cd_plugins
	ln -sn "$sites_root/amp-wp-dummy-data-generator" .
	wp plugin activate amp-wp-dummy-data-generator
	wp cache flush
	wp rewrite flush
}

function process_site() {

	cd_plugins

	cs_plugins=(${plugins//,/ })
	for plugin_slug in "${cs_plugins[@]}"; do

		data=(${plugin_slug//:/ })
		version=${data[1]}
		[[ -n "${version}" ]] && version_string="--version=${version}" || version_string=""

		wp plugin install "${data[0]}" --activate $version_string
	done

	theme_slug=${theme:-"treville"}
	data=(${theme_slug//:/ })
	version=${data[1]}
	[[ -n "${version}" ]] && version_string="--version=${version}" || version_string=""
	wp theme install "${data[0]}" --activate $version_string

	cd_plugins
	bash amp-wp-dummy-data-generator/start.sh
}

function process_amp() {

	wp rewrite flush
	wp amp validation reset --yes
	wp amp validation run --force
	wp amp-send-data $amp_endpoint_flag
}

function main() {

	setup_site
	process_site
	process_amp
	destroy_site
}

main
