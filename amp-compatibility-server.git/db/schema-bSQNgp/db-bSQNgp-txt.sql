# Link to schema: https://app.quickdatabasediagrams.com/#/d/bSQNgp

sites
-
# md5( site_url + post_date_gmt )
site_slug STRING
# "site_url": "amp-wp.test",
site_url STRING
# [post_date_gmt] => 2020-10-29 21:29:23
post_date_gmt TIMESTAMP
# "site_title": "amp-wp.test",
site_title STRING
# "php_version": "7.2.34-8+ubuntu18.04.1+deb.sury.org+1",
php_version STRING
# "mysql_version": "",
mysql_version STRING
# "wp_version": "5.5.3",
# "platform": "",
platform STRING
# "amp_mode": "standard|reader|transitional|off",
amp_mode STRING
amp_version STRING
# Theme templates with enable/disable status
amp_templates STRING
# Plugin list with suppress status 
amp_plugins STRING
# Only names of analytics vendors. ❗️ Multiples may be stored in site_meta.
amp_analytics STRING
# "enabled_content_types": []
wp_content_types STRING
# en_US
wp_language STRING
# Bool: True/False
wp_https_status BOOL
# subdomain|subdirectory|false
wp_multisite STRING
# FK - wporg.slug_version
wp_active_theme STRING FK - wporg.slug_version
# 5.5.3
wp_version STRING
# true|false
is_seeding_site BOOL
# true|false
mobile_redirect BOOL
# legacy | other
reader_theme STRING
# true|false
plugin_configured BOOL
# ARRAY
suppressed_plugins STRING

#analytics_vendors
#-

#sites_to_analytics_vendors
#-

# Can contain any abitrary meta — for example see columns in sites
# e.g., from AMP plugin wp_options settings:
#  key              => value
#  analytics_vendor => googleanalytics (could be multiple entries)
#
# 'all_templates_supported' => true,
# 'supported_templates' =>  array ( 0 => 'is_singular',),
# 'suppressed_plugins' => array()
# 'theme_support' => 'standard',
# 'supported_post_types' => 
site_meta
-
site_slug STRING FK >- sites.site_slug
# meta_key values: wp_themes_inactive, wp_plugins_active, wp_plugins_inactive
meta_key STRING
meta_value STRING

amp_validated_url
-
# FK >- sites.site_url
# source: post_content of post_type amp_validated_url
site_slug STRING FK >- sites.site_slug
site_url STRING
# [post_name] => 3887bf8b84...
page_slug STRING    
# [post_title] => https://domain.local/page
page_url STRING     
# [post_date_gmt] => 2020-10-29 21:29:23
post_date_gmt TIMESTAMP     
# [guid] => https://domain.local/amp_validated_url/3887bf8b84c72cd634e5fc8f98f53396/
guid STRING

errors_to_urls
-
page_slug STRING FK >- amp_validated_url.page_slug
error_slug STRING FK >- errors.error_slug
# ❗️ The plugin uses some logic to guess primary source from a set of sources 
# source_slug STRING FK >- sources.source_slug

# amp_validated_url.post_content
errors
-
# [node_name] => script
node_name STRING
# [term_slug] => aa908c15ec100... ❗️ Provided by AMP plugin post_content. 
error_slug STRING
# [parent_name] => head
parent_name STRING
# [code] => DISALLOWED_TAG
code STRING
# [type] => js_error
type STRING
# [node_attributes] => Object (
#   [type] => text/javascript
#   [src] => https://domain.local/wp-includes/js/jquery/jquery.js?ver=__normalized__
#   [id] => jquery-core-js
# )
node_attributes STRING
# [node_type] => 1
# [sources] => [...Array...]
node_type STRING

errors_to_sources
-
error_slug STRING FK >- errors.error_slug
source_slug STRING FK >- sources.source_slug

# error.source
sources
-
# [source_slug] => ❗️ calculate row md5 | theme-slug-version | plugin-slug-version
source_slug STRING
# error_slug STRING FK >- errors.error_slug
# [type] => 0 = plugin, 1 = theme, 2 = block, 3 = core
type INTEGER
# [name] => gravityforms
name STRING
# [file] => gravityforms.php
file STRING
# [line] => 276
line STRING
# [function] => GFForms::init
# function STRING
# [hook] => init
#hook STRING
# [priority] => 10
# priority INTEGER
# [dependency_type] => script
# dependency_type STRING
# [handle] => gform_masked_input
# handle STRING
# [dependency_handle] => jquery-core
# dependency_handle STRING

#=========================================#
## Source code meta
## Store infomation like
# author: FK >- authors.ID (multiple)
# latest_version: 4.5.0
# rating: 86
# ratings: { ‘1’: 63, ‘2’: 20, ‘3’: 12, ‘4’: 30, ‘5’: 411 }
# num_ratings: 536
# support_threads: 117
# support_threads_resolved: 106
# active_installs: 1000000
# downloaded: 26939795
# last_updated: ‘2020-10-30 1:54pm GMT’
# added: ‘2007-09-10’
# homepage: ‘https://redirection.me/’
# tested: ‘5.5.3’
# preview_url: ‘https://wp-wporg.com/prime-spa’
# screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’
source_meta
-
source_slug STRING FK >- sources.source_slug
meta_key STRING
meta_value STRING



wporg
-
# CALCULATED field -- see query:
# SELECT 
#   count( distinct count_plugin_errors.slug_version ) AS error_count, 
#   wporg.slug_version 
# FROM ( 
#   SELECT slug_version FROM plugins
#   UNION
#   SELECT source_slug FROM errors_to_sources
# ) AS count_plugin_errors, plugins
# GROUP BY wporg.slug_version
error_count STRING NULLABLE 
# calculated
compatibility_score STRING NULLABLE
# prefix with plugin- theme-
# @see https://github.com/rtCamp/wporg-api-client
# slug-version combined for foreign key.
slug_version STRING FK - sources.source_slug
# plugin|theme,
type STRING
# preview_url: ‘https://wp-wporg.com/prime-spa’,
preview_url STRING
# screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’,
screenshot_url STRING
# rating: 0,
theme_rating INTEGER  
# num_ratings: ‘0’,
theme_num_ratings INTEGER 
# name: ‘Redirection’,
name STRING
# slug: ‘redirection’,
slug STRING FK >- sources.name
# version: ‘4.9.2’,
version STRING
# String of all authors. Could be multiple author names. See authors_rel.
# author: ‘John Godley’,
authors STRING NULLABLE
# String of all profile URLs. Could be multiple profiles. See also authors_rel.
# author_profiles: ‘https://profiles.wordpress.org/johnny5’,
author_profiles STRING NULLABLE
# requires: ‘5.0’,
requires STRING NULLABLE
# tested: ‘5.5.3’,
tested STRING NULLABLE
# requires_php: ‘5.6’,
requires_php STRING NULLABLE
# rating: 86,
rating STRING NULLABLE
# ratings: { ‘1’: 63, ‘2’: 20, ‘3’: 12, ‘4’: 30, ‘5’: 411 },
ratings STRING NULLABLE
# num_ratings: 536,
num_ratings STRING NULLABLE
# support_threads: 117,
support_threads STRING NULLABLE
# support_threads_resolved: 106,
support_threads_resolved STRING NULLABLE
# active_installs: 1000000,
active_installs STRING NULLABLE
# downloaded: 26939795,
downloaded STRING NULLABLE
# last_updated: ‘2020-10-30 1:54pm GMT’,
last_updated STRING NULLABLE
# added: ‘2007-09-10’,
added STRING NULLABLE
# homepage: ‘https://redirection.me/’,
homepage STRING NULLABLE
# short_description:
#  ‘Manage 301 redirections, keep track of 404 errors, and improve your site, with no knowledge of Apache or Nginx # needed.’,
short_description STRING NULLABLE
# description:
#  ‘<p>Redirection is the most popular redirect manager for WordPress. [...] Please submit translations to:</p>\n<# p><a href=”https://translate.wordpress.org/projects/wp-plugins/redirection” rel=”nofollow ugc”># https://translate.wordpress.org/projects/wp-plugins/redirection</a></p>\n’,
description STRING NULLABLE
# download_link:
#  ‘https://downloads.wordpress.org/plugin/redirection.4.9.2.zip’,
download_link STRING NULLABLE
# tags:
#  { ‘301’: ‘301’,
#    ‘404’: ‘404’,
#    htaccess: ‘htaccess’,
#    redirect: ‘redirect’,
#    seo: ‘seo’ },
tags STRING NULLABLE
# donate_link: ‘https://redirection.me/donation/’,
donate_link STRING NULLABLE
# icons:
#  { ‘1x’:
# ‘https://ps.w.org/redirection/assets/icon-128x128.jpg?rev=983640’,
#    ‘2x’:
# ‘https://ps.w.org/redirection/assets/icon-256x256.jpg?rev=983639’ }
icons STRING NULLABLE


# author: relationship: authors_to_themes->[Object],
## themes
## -
## # slug_version: 'prime-spa-1.0.0'
## slug_version STRING FK - sources.source_slug
## # name: ‘Prime Spa’,,
## name STRING
## # slug: ‘prime-spa’
## slug STRING FK >- sources.name
## # version: ‘1.0.0’,
## version STRING
## # preview_url: ‘https://wp-wporg.com/prime-spa’,
## preview_url STRING
## # screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’,
## screenshot_url STRING
## # rating: 0,
## rating INTEGER  
## # num_ratings: ‘0’,
## num_ratings INTEGER 
## # homepage: ‘https://wordpress.org/themes/prime-spa/’,
## homepage STRING
## # description: ‘Prime Spa is an very beautiful elegant and modern WordPress theme [...]’,
## description STRING
## # requires: 5.5
## requires STRING
## # requires_php: ‘5.6’
## requires_php STRING
## # ❗️ Calculated based on error count
## compatibility_score STRING## 

authors_rel
-
plugin_slug_version STRING FK >- wporg.slug_version
author_profile STRING FK >- authors.profile

sites_to_plugins
-
plugin_slug_version STRING FK >- wporg.slug_version
site_slug STRING FK >- sites.site_slug

authors
-
# user_nicename: ‘themepalace’,
# profile: ‘https://profiles.wordpress.org/themepalace’,
# avatar:
# ‘https://secure.gravatar.com/avatar/0c5bb2d366c231814fdd29647f813ff1?s=96&d=monsterid&r=g’,
# display_name: ‘themepalace’ }
profile STRING
user_nicename STRING
avatar STRING
display_name STRING
status STRING NULLABLE

# May need pagination over multiple requests:
# Site data / settings
# Page errors
to_process
-
data STRING
post_date_gmt STRING
# site_slug FK - sites.site_slug
site_url STRING
page_url STRING
amp_validated_url STRING
amp_options STRING
site_settings STRING


