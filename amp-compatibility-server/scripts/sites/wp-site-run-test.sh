#!/usr/bin/env bash

base_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
preserve_site="false"
amp_source="wporg"

for i in "$@"; do
	case $i in
	-d=* | --domain=*)
		export site_name="${i#*=}"
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
	--amp-source=*)
		amp_source="${i#*=}"
		shift
		;;
	--preserve-site)
		preserve_site="true"
		shift
		;;
	*)
		# unknown option
		;;
	esac
done

source "$base_dir/functions.sh"

if [[ "prod" != "$environment" ]]; then
	amp_endpoint="http://127.0.0.1:3333";
	amp_endpoint_flag="--endpoint=$amp_endpoint"
fi

function setup_site() {

	if [[ "mac" == "$os" ]]; then
		sudo echo "$machine_ip $site_domain" >>/etc/hosts
	else
		echo "$machine_ip $site_domain" >>/etc/hosts
	fi

	setup="false";
	retries=0;
	while [[ "$setup" != "true" ]]; do
		create_site
		setup=$(health_check)
		retries=$((retries+1))
		if [[ $retries -ge 5 ]]; then
			echo "Site creation failed after 5 consecutive retries for $site_domain."
			echo "Exiting without error."
			exit 0
		fi
	done

	cd_site

	if [[ "github" == "$amp_source" ]]; then
		ln -sn "$sites_root/repos/github-amp" "$(get_site_path)/wp-content/plugins/amp"
	elif [ "wporg" != "$amp_source" ] && [ "github" != "$amp_source" ]; then
		wp plugin install "$amp_source" --activate
	else
		wp plugin install amp --activate
	fi

	plugin_dirs=(amp-wp-dummy-data-generator wordpress-importer block-unit-test coblocks)
	for plugin_dir in "${plugin_dirs[@]}"; do
		ln -sn "$sites_root/repos/$plugin_dir" "$(get_site_path)/wp-content/plugins/$plugin_dir"
	done

	ln -sn "$sites_root/repos/treville" "$(get_site_path)/wp-content/themes/treville"

	wp plugin deactivate nginx-helper
	wp plugin delete nginx-helper

	tmp_path="$(get_site_path)/tmp"
	mkdir -p "$tmp_path"
	wp config set WP_TEMP_DIR "$tmp_path" --add=true --type=constant
	wp option set blogname "$site_domain"

	wp cache flush
	wp rewrite flush
}


function process_site() {

	cd_site

	wp db import "$sites_root/repos/base-site.sql"
	wp search-replace "base-site.local" "$site_domain" --all-tables

	uploads_path="$(get_site_path)/wp-content/uploads"
	rm -rf "$uploads_path"
	ln -sn "$sites_root/repos/uploads" "$uploads_path"

	wp config set "WP_HOME" "http://$site_domain" --add=true --type=constant
	wp config set "WP_SITEURL" "http://$site_domain" --add=true --type=constant
	wp option update blogname "$site_domain"

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

	wp configure-amp-site

	cd_plugins
	bash amp-wp-dummy-data-generator/start.sh --exclude-default

	wp cache flush
	wp rewrite flush
}

function process_amp() {

	wp rewrite flush
	wp amp validation reset --yes
	wp amp validation run --limit=20 --force
	[[ "$preserve_site" = "false" ]] && wp amp-send-data --is-synthetic $amp_endpoint_flag
}

function main() {

	start=$(date +%s)

	## Setup base site.
	setup_site
	setup_site_time=$(date +%s)

	process_site
	process_site_time=$(date +%s)

	process_amp
	process_amp_time=$(date +%s)

	if [[ "$preserve_site" = "false" ]]; then
		destroy_site
		destroy_site_time=$(date +%s)
	fi

	end=$(date +%s)

	echo "";
	echo "====================================================================================================";
	echo "Setup site   : $(expr $setup_site_time - $start) seconds."
	echo "Process site : $(expr $process_site_time - $setup_site_time) seconds."
	echo "AMP process  : $(expr $process_amp_time - $process_site_time) seconds."
	[[ "$preserve_site" = "false" ]] && echo "Destroy site : $(expr $destroy_site_time - $process_amp_time) seconds."
	echo "Total        : $(expr $end - $start) seconds."
	echo "====================================================================================================";
	echo "";
	echo "";
}

main
