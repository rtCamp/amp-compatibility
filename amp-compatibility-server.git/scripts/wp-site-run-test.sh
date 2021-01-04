#!/usr/bin/env bash

current_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
extension_version_slug=$1
type=$2
slug=$3
version=$4


echo extension_version_slug
echo type
echo slug
echo version

setup_site() {

  wp rewrite flush
  wp cache flush

  wp plugin install --activate amp
  wp option update --json amp-options '{"theme_support":"standard"}'

  wp plugin install --activate amp-wp-dummy-data-generator
  wp plugin activate amp-wp-dummy-data-generator

}

proccess_site() {

  pwd

  # wp core install --url=extension_version_slug.rt.gw.test --title=extension_version_slug --admin_user=supervisor --admin_password=strongpassword --admin_email=info@example.com

  # if ( type=plugin ) then ( ( wp plugin install ${slug} --activate ) AND ( wp theme install treville --activate ) )
  # if ( type=theme ) theme ( wp theme install ${slug} --activate )

  # bash $(wp plugin path)/amp-wp-dummy-data-generator/start.sh

}

reset_site() {
  wp db reset --yes
}

setup_site
proccess_site
reset_site