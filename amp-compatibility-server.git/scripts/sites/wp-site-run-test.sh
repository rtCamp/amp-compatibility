#!/usr/bin/env bash

base_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

for i in "$@"; do
	case $i in
	-d=* | --domain=*)
		site_name="${i#*=}"
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

if [[ "prod" != "$environment" ]]; then
	amp_endpoint="http://127.0.0.1:3333";
	amp_endpoint_flag="--endpoint=$amp_endpoint"
fi

function process_site() {

	cd_site

	wp db import "$sites_root/repos/base-site.mysql"

	cp -a "$sites_root/repos" "$(get_site_path)/wp-content/uploads"

	if [[ "mac" == "$os" ]]; then
		wp search-replace 'base-site.test' "$site_domain" --network
	else
		wp search-replace 'base-site.local' "$site_domain" --network
	fi

	wp plugin install --activate amp
	wp plugin activate amp-wp-dummy-data-generator

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

	wp setup-amp-site

	cd_plugins
	bash amp-wp-dummy-data-generator/start.sh --exclude-default
}

function process_amp() {

	wp rewrite flush
	wp amp validation reset --yes
	wp amp validation run --force
	wp amp-send-data $amp_endpoint_flag
}

source "$base_dir/base.sh"

function main() {

	start=`date +%s`

	## Setup base site.
	setup_base_site
	setup_site_time=`date +%s`

	process_site
	process_site_time=`date +%s`

	process_amp
	process_amp_time=`date +%s`

	destroy_site
	destroy_site_time=`date +%s`

	end=`date +%s`

	echo Setup site   : `expr $setup_site_time - $start` seconds.
	echo Process site : `expr $process_site_time - $setup_site_time` seconds.
	echo AMP process  : `expr $process_amp_time - $process_site_time` seconds.
	echo Destroy site : `expr $destroy_site_time - $process_amp_time` seconds.
	echo Total        : `expr $end - $start` seconds.

}

main
