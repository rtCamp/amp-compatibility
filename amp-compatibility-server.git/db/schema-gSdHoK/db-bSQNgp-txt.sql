# https://app.quickdatabasediagrams.com/#/d/gSdHoK

##
# Google AMP WP comp database schema
###

#=========================================#
## Site Info
sites
-
ID PK INT AUTOINCREMENT
name STRING
url STRING
platform STRING # vipgo|vip
wp_type STRING # single|subdomain|subdir
php_version STRING
wp_version STRING
amp_mode STRING
language STRING


#=========================================#
## Site meta
## Store infomation like
# inactive_plugin: FK >- source_code.ID (multiple)
# active_plugin: FK >- source_code.ID (multiple)
# active_theme: FK >- source_code.ID (multiple)
# inactive_theme: FK >- source_code.ID (multiple)
site_meta
-
ID PK INT AUTOINCREMENT
site_id INT FK >- sites.ID
meta_key STRING
meta_value STRING


#=========================================#
## Site URL data.
site_urls
-
ID PK INT AUTOINCREMENT
site_id INT FK >- sites.ID
url STRING

#=========================================#
## URL to error relationship
url_errors_relationship
-
ID PK INT
site_url_id INT FK >- site_urls.ID
error_id INT FK >- error_info.ID
error_source_id INT fk >- error_source.ID


#=========================================#
## Error Info
error_info
-
ID PK INT AUTOINCREMENT
code STRING
type STRING
text STRING
node_name STRING
node_type STRING
parent_name STRING
node_attributes STRING ## JSON string

## Example
# {
# 	"code": "DISALLOWED_TAG",
# 	"node_attributes": {
# 	"src": "http://amp-wp.test/wp-content/plugins/woocommerce/assets/js/frontend/country-select.js?ver=__normalized__",
# 		"id": "wc-country-select-js"
# 	},
# 	"node_name": "script",
# 	"node_type": "ELEMENT",
# 	"parent_name": "body",
# 	"type": "js_error",
# 	"removed": true,
# 	"reviewed": false
# }

#=========================================#
## input int this table require pre proccesing.
error_source
-
ID PK INT AUTOINCREMENT
error_id INT FK >- error_info.ID
source_code_id INT FK >- source_code.ID
file STRING
line STRING
function STRING
hook STRING
priority STRING
dependency_type STRING NULLABLE
handle STRING NULLABLE
dependency_handle STRING NULLABLE

#=========================================#
## Source code info
source_code
-
ID PK INT AUTOINCREMENT
title STRING
name STRING # slugify of title
version STRING
slug STRING # name-version
type ENUM # (theme|plugin|wpcore)
requires_wp STRING # Require WP version
requires_php STRING  # Require PHP version
source enum # (wporg|github|custom)
tags STRING
parent INT FK >- source_code.ID # Nullable

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
# preview_url: ‘https://wp-themes.com/prime-spa’
# screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’
source_code_meta
-
ID PK INT AUTOINCREMENT
source_code_id INT FK >- source_code.ID
meta_key STRING
meta_value STRING

#=========================================#
## Author data
authors
-
ID INT AUTOINCREMENT
name STRING
author_url STRING
display_name STRING
user_nicename STRING
avatar STRING
