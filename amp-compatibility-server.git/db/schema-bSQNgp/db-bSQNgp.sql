-- Exported from QuickDBD: https://www.quickdatabasediagrams.com/
-- Link to schema: https://app.quickdatabasediagrams.com/#/d/bSQNgp
-- NOTE! If you have used non-SQL datatypes in your design, you will have to change these here.


CREATE TABLE `sites` (
    -- md5( site_url + post_date_gmt )
    `site_slug` STRING  NOT NULL ,
    -- "site_url": "amp-wp.test",
    `site_url` STRING  NOT NULL ,
    -- [post_date_gmt] => 2020-10-29 21:29:23
    `post_date_gmt` TIMESTAMP  NOT NULL ,
    -- "site_title": "amp-wp.test",
    `site_title` STRING  NOT NULL ,
    -- "php_version": "7.2.34-8+ubuntu18.04.1+deb.sury.org+1",
    `php_version` STRING  NOT NULL ,
    -- "mysql_version": "",
    `mysql_version` STRING  NOT NULL ,
    -- "wp_version": "5.5.3",
    -- "platform": "",
    `platform` STRING  NOT NULL ,
    -- "amp_mode": "standard|reader|transitional|off",
    `amp_mode` STRING  NOT NULL ,
    `amp_version` STRING  NOT NULL ,
    -- Theme templates with enable/disable status
    `amp_templates` STRING  NOT NULL ,
    -- Plugin list with suppress status
    `amp_plugins` STRING  NOT NULL ,
    -- Only names of analytics vendors. ❗️ Multiples may be stored in site_meta.
    `amp_analytics` STRING  NOT NULL ,
    -- "enabled_content_types": []
    `wp_content_types` STRING  NOT NULL ,
    -- en_US
    `wp_language` STRING  NOT NULL ,
    -- Bool: True/False
    `wp_https_status` BOOL  NOT NULL ,
    -- subdomain|subdirectory|false
    `wp_multisite` STRING  NOT NULL ,
    -- FK - wporg.slug_version
    `wp_active_theme` STRING  NOT NULL ,
    -- 5.5.3
    `wp_version` STRING  NOT NULL ,
    -- true|false
    `is_seeding_site` BOOL  NOT NULL ,
    -- true|false
    `mobile_redirect` BOOL  NOT NULL ,
    -- legacy | other
    `reader_theme` STRING  NOT NULL ,
    -- true|false
    `plugin_configured` BOOL  NOT NULL ,
    -- ARRAY
    `suppressed_plugins` STRING  NOT NULL 
);

-- analytics_vendors
-- -
-- sites_to_analytics_vendors
-- -
-- Can contain any abitrary meta — for example see columns in sites
-- e.g., from AMP plugin wp_options settings:
-- key              => value
-- analytics_vendor => googleanalytics (could be multiple entries)
-- 'all_templates_supported' => true,
-- 'supported_templates' =>  array ( 0 => 'is_singular',),
-- 'suppressed_plugins' => array()
-- 'theme_support' => 'standard',
-- 'supported_post_types' =>
CREATE TABLE `site_meta` (
    `site_slug` STRING  NOT NULL ,
    -- meta_key values: wp_themes_inactive, wp_plugins_active, wp_plugins_inactive
    `meta_key` STRING  NOT NULL ,
    `meta_value` STRING  NOT NULL 
);

CREATE TABLE `amp_validated_url` (
    -- FK >- sites.site_url
    -- source: post_content of post_type amp_validated_url
    `site_slug` STRING  NOT NULL ,
    `site_url` STRING  NOT NULL ,
    -- [post_name] => 3887bf8b84...
    `page_slug` STRING  NOT NULL ,
    -- [post_title] => https://domain.local/page
    `page_url` STRING  NOT NULL ,
    -- [post_date_gmt] => 2020-10-29 21:29:23
    `post_date_gmt` TIMESTAMP  NOT NULL ,
    -- [guid] => https://domain.local/amp_validated_url/3887bf8b84c72cd634e5fc8f98f53396/
    `guid` STRING  NOT NULL 
);

CREATE TABLE `errors_to_urls` (
    `page_slug` STRING  NOT NULL ,
    `error_slug` STRING  NOT NULL 
);

-- ❗️ The plugin uses some logic to guess primary source from a set of sources
-- source_slug STRING FK >- sources.source_slug
-- amp_validated_url.post_content
CREATE TABLE `errors` (
    -- [node_name] => script
    `node_name` STRING  NOT NULL ,
    -- [term_slug] => aa908c15ec100... ❗️ Provided by AMP plugin post_content.
    `error_slug` STRING  NOT NULL ,
    -- [parent_name] => head
    `parent_name` STRING  NOT NULL ,
    -- [code] => DISALLOWED_TAG
    `code` STRING  NOT NULL ,
    -- [type] => js_error
    `type` STRING  NOT NULL ,
    -- [node_attributes] => Object (
    -- [type] => text/javascript
    -- [src] => https://domain.local/wp-includes/js/jquery/jquery.js?ver=__normalized__
    -- [id] => jquery-core-js
    -- )
    `node_attributes` STRING  NOT NULL ,
    -- [node_type] => 1
    -- [sources] => [...Array...]
    `node_type` STRING  NOT NULL 
);

CREATE TABLE `errors_to_sources` (
    `error_slug` STRING  NOT NULL ,
    `source_slug` STRING  NOT NULL 
);

-- error.source
CREATE TABLE `sources` (
    -- [source_slug] => ❗️ calculate row md5 | theme-slug-version | plugin-slug-version
    `source_slug` STRING  NOT NULL ,
    -- error_slug STRING FK >- errors.error_slug
    -- [type] => 0 = plugin, 1 = theme, 2 = block, 3 = core
    `type` INTEGER  NOT NULL ,
    -- [name] => gravityforms
    `name` STRING  NOT NULL ,
    -- [file] => gravityforms.php
    `file` STRING  NOT NULL ,
    -- [line] => 276
    `line` STRING  NOT NULL 
);

-- [function] => GFForms::init
-- function STRING
-- [hook] => init
-- hook STRING
-- [priority] => 10
-- priority INTEGER
-- [dependency_type] => script
-- dependency_type STRING
-- [handle] => gform_masked_input
-- handle STRING
-- [dependency_handle] => jquery-core
-- dependency_handle STRING
-- =========================================
-- author: FK >- authors.ID (multiple)
-- latest_version: 4.5.0
-- rating: 86
-- ratings: { ‘1’: 63, ‘2’: 20, ‘3’: 12, ‘4’: 30, ‘5’: 411 }
-- num_ratings: 536
-- support_threads: 117
-- support_threads_resolved: 106
-- active_installs: 1000000
-- downloaded: 26939795
-- last_updated: ‘2020-10-30 1:54pm GMT’
-- added: ‘2007-09-10’
-- homepage: ‘https://redirection.me/’
-- tested: ‘5.5.3’
-- preview_url: ‘https://wp-wporg.com/prime-spa’
-- screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’
CREATE TABLE `source_meta` (
    `source_slug` STRING  NOT NULL ,
    `meta_key` STRING  NOT NULL ,
    `meta_value` STRING  NOT NULL 
);

CREATE TABLE `wporg` (
    -- CALCULATED field -- see query:
    -- SELECT
    -- count( distinct count_plugin_errors.slug_version ) AS error_count,
    -- wporg.slug_version
    -- FROM (
    -- SELECT slug_version FROM plugins
    -- UNION
    -- SELECT source_slug FROM errors_to_sources
    -- ) AS count_plugin_errors, plugins
    -- GROUP BY wporg.slug_version
    `error_count` STRING  NULL ,
    -- calculated
    `compatibility_score` STRING  NULL ,
    -- prefix with plugin- theme-
    -- @see https://github.com/rtCamp/wporg-api-client
    -- slug-version combined for foreign key.
    `slug_version` STRING  NOT NULL ,
    -- plugin|theme,
    `type` STRING  NOT NULL ,
    -- preview_url: ‘https://wp-wporg.com/prime-spa’,
    `preview_url` STRING  NOT NULL ,
    -- screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’,
    `screenshot_url` STRING  NOT NULL ,
    -- rating: 0,
    `theme_rating` INTEGER  NOT NULL ,
    -- num_ratings: ‘0’,
    `theme_num_ratings` INTEGER  NOT NULL ,
    -- name: ‘Redirection’,
    `name` STRING  NOT NULL ,
    -- slug: ‘redirection’,
    `slug` STRING  NOT NULL ,
    -- version: ‘4.9.2’,
    `version` STRING  NOT NULL ,
    -- String of all authors. Could be multiple author names. See authors_rel.
    -- author: ‘John Godley’,
    `authors` STRING  NULL ,
    -- String of all profile URLs. Could be multiple profiles. See also authors_rel.
    -- author_profiles: ‘https://profiles.wordpress.org/johnny5’,
    `author_profiles` STRING  NULL ,
    -- requires: ‘5.0’,
    `requires` STRING  NULL ,
    -- tested: ‘5.5.3’,
    `tested` STRING  NULL ,
    -- requires_php: ‘5.6’,
    `requires_php` STRING  NULL ,
    -- rating: 86,
    `rating` STRING  NULL ,
    -- ratings: { ‘1’: 63, ‘2’: 20, ‘3’: 12, ‘4’: 30, ‘5’: 411 },
    `ratings` STRING  NULL ,
    -- num_ratings: 536,
    `num_ratings` STRING  NULL ,
    -- support_threads: 117,
    `support_threads` STRING  NULL ,
    -- support_threads_resolved: 106,
    `support_threads_resolved` STRING  NULL ,
    -- active_installs: 1000000,
    `active_installs` STRING  NULL ,
    -- downloaded: 26939795,
    `downloaded` STRING  NULL ,
    -- last_updated: ‘2020-10-30 1:54pm GMT’,
    `last_updated` STRING  NULL ,
    -- added: ‘2007-09-10’,
    `added` STRING  NULL ,
    -- homepage: ‘https://redirection.me/’,
    `homepage` STRING  NULL ,
    -- short_description:
    -- ‘Manage 301 redirections, keep track of 404 errors, and improve your site, with no knowledge of Apache or Nginx
    `short_description` STRING  NULL ,
    -- description:
    -- ‘<p>Redirection is the most popular redirect manager for WordPress. [...] Please submit translations to:</p>\n<
    `description` STRING  NULL ,
    -- download_link:
    -- ‘https://downloads.wordpress.org/plugin/redirection.4.9.2.zip’,
    `download_link` STRING  NULL ,
    -- tags:
    -- { ‘301’: ‘301’,
    -- ‘404’: ‘404’,
    -- htaccess: ‘htaccess’,
    -- redirect: ‘redirect’,
    -- seo: ‘seo’ },
    `tags` STRING  NULL ,
    -- donate_link: ‘https://redirection.me/donation/’,
    `donate_link` STRING  NULL ,
    -- icons:
    -- { ‘1x’:
    -- ‘https://ps.w.org/redirection/assets/icon-128x128.jpg?rev=983640’,
    -- ‘2x’:
    -- ‘https://ps.w.org/redirection/assets/icon-256x256.jpg?rev=983639’ }
    `icons` STRING  NULL 
);

-- author: relationship: authors_to_themes->[Object],
CREATE TABLE `authors_rel` (
    `plugin_slug_version` STRING  NOT NULL ,
    `author_profile` STRING  NOT NULL 
);

CREATE TABLE `sites_to_plugins` (
    `plugin_slug_version` STRING  NOT NULL ,
    `site_slug` STRING  NOT NULL 
);

CREATE TABLE `authors` (
    -- user_nicename: ‘themepalace’,
    -- profile: ‘https://profiles.wordpress.org/themepalace’,
    -- avatar:
    -- ‘https://secure.gravatar.com/avatar/0c5bb2d366c231814fdd29647f813ff1?s=96&d=monsterid&r=g’,
    -- display_name: ‘themepalace’ }
    `profile` STRING  NOT NULL ,
    `user_nicename` STRING  NOT NULL ,
    `avatar` STRING  NOT NULL ,
    `display_name` STRING  NOT NULL ,
    `status` STRING  NULL 
);

-- May need pagination over multiple requests:
-- Site data / settings
-- Page errors
CREATE TABLE `to_process` (
    `data` STRING  NOT NULL ,
    `post_date_gmt` STRING  NOT NULL ,
    -- site_slug FK - sites.site_slug
    `site_url` STRING  NOT NULL ,
    `page_url` STRING  NOT NULL ,
    `amp_validated_url` STRING  NOT NULL ,
    `amp_options` STRING  NOT NULL ,
    `site_settings` STRING  NOT NULL 
);

ALTER TABLE `sites` ADD CONSTRAINT `fk_sites_wp_active_theme` FOREIGN KEY(`wp_active_theme`)
REFERENCES `wporg` (`slug_version`);

ALTER TABLE `site_meta` ADD CONSTRAINT `fk_site_meta_site_slug` FOREIGN KEY(`site_slug`)
REFERENCES `sites` (`site_slug`);

ALTER TABLE `amp_validated_url` ADD CONSTRAINT `fk_amp_validated_url_site_slug` FOREIGN KEY(`site_slug`)
REFERENCES `sites` (`site_slug`);

ALTER TABLE `errors_to_urls` ADD CONSTRAINT `fk_errors_to_urls_page_slug` FOREIGN KEY(`page_slug`)
REFERENCES `amp_validated_url` (`page_slug`);

ALTER TABLE `errors_to_urls` ADD CONSTRAINT `fk_errors_to_urls_error_slug` FOREIGN KEY(`error_slug`)
REFERENCES `errors` (`error_slug`);

ALTER TABLE `errors_to_sources` ADD CONSTRAINT `fk_errors_to_sources_error_slug` FOREIGN KEY(`error_slug`)
REFERENCES `errors` (`error_slug`);

ALTER TABLE `errors_to_sources` ADD CONSTRAINT `fk_errors_to_sources_source_slug` FOREIGN KEY(`source_slug`)
REFERENCES `sources` (`source_slug`);

ALTER TABLE `source_meta` ADD CONSTRAINT `fk_source_meta_source_slug` FOREIGN KEY(`source_slug`)
REFERENCES `sources` (`source_slug`);

ALTER TABLE `wporg` ADD CONSTRAINT `fk_wporg_slug_version_slug` FOREIGN KEY(`slug_version`, `slug`)
REFERENCES `sources` (`source_slug`, `name`);

ALTER TABLE `authors_rel` ADD CONSTRAINT `fk_authors_rel_plugin_slug_version` FOREIGN KEY(`plugin_slug_version`)
REFERENCES `wporg` (`slug_version`);

ALTER TABLE `authors_rel` ADD CONSTRAINT `fk_authors_rel_author_profile` FOREIGN KEY(`author_profile`)
REFERENCES `authors` (`profile`);

ALTER TABLE `sites_to_plugins` ADD CONSTRAINT `fk_sites_to_plugins_plugin_slug_version` FOREIGN KEY(`plugin_slug_version`)
REFERENCES `wporg` (`slug_version`);

ALTER TABLE `sites_to_plugins` ADD CONSTRAINT `fk_sites_to_plugins_site_slug` FOREIGN KEY(`site_slug`)
REFERENCES `sites` (`site_slug`);

