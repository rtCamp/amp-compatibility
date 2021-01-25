#!/usr/bin/env bash

base_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

site_name="base-site"

source "$base_dir/base.sh"

## Setup base site.
# setup_base_site

cd_plugins

## Import content of base site.
# bash "$(get_plugins_path)/amp-wp-dummy-data-generator/start.sh"

## Export base site data.
rm "$sites_root/repos/base-site.mysql"
wp db export "$sites_root/repos/base-site.mysql"

rm -rf "$sites_root/repos/uploads"
cp -a "$(get_site_path)/wp-content/uploads" "$sites_root/repos"

## Destroy site.
#destroy_site
