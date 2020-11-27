-- Exported from QuickDBD: https://www.quickdatabasediagrams.com/
-- Link to schema: https://app.quickdatabasediagrams.com/#/d/gSdHoK
-- NOTE! If you have used non-SQL datatypes in your design, you will have to change these here.

-- Google AMP WP comp database schema

-- =========================================
CREATE TABLE `sites` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `name` STRING  NOT NULL ,
    `url` STRING  NOT NULL ,
    -- vipgo|vip
    `platform` STRING  NOT NULL ,
    -- single|subdomain|subdir
    `wp_type` STRING  NOT NULL ,
    `php_version` STRING  NOT NULL ,
    `wp_version` STRING  NOT NULL ,
    `amp_mode` STRING  NOT NULL ,
    `language` STRING  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- =========================================
-- inactive_plugin: FK >- source_code.ID (multiple)
-- active_plugin: FK >- source_code.ID (multiple)
-- active_theme: FK >- source_code.ID (multiple)
-- inactive_theme: FK >- source_code.ID (multiple)
CREATE TABLE `site_meta` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `site_id` INT  NOT NULL ,
    `meta_key` STRING  NOT NULL ,
    `meta_value` STRING  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- =========================================
CREATE TABLE `site_urls` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `site_id` INT  NOT NULL ,
    `url` STRING  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- =========================================
CREATE TABLE `url_errors_relationship` (
    `ID` INT  NOT NULL ,
    `site_url_id` INT  NOT NULL ,
    `error_id` INT  NOT NULL ,
    `error_source_id` INT  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- =========================================
CREATE TABLE `error_info` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `code` STRING  NOT NULL ,
    `type` STRING  NOT NULL ,
    `text` STRING  NOT NULL ,
    `node_name` STRING  NOT NULL ,
    `node_type` STRING  NOT NULL ,
    `parent_name` STRING  NOT NULL ,
    `node_attributes` STRING  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- {
-- "code": "DISALLOWED_TAG",
-- "node_attributes": {
-- "src": "http://amp-wp.test/wp-content/plugins/woocommerce/assets/js/frontend/country-select.js?ver=__normalized__",
-- "id": "wc-country-select-js"
-- },
-- "node_name": "script",
-- "node_type": "ELEMENT",
-- "parent_name": "body",
-- "type": "js_error",
-- "removed": true,
-- "reviewed": false
-- }
-- =========================================
CREATE TABLE `error_source` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `error_id` INT  NOT NULL ,
    `source_code_id` INT  NOT NULL ,
    `file` STRING  NOT NULL ,
    `line` STRING  NOT NULL ,
    `function` STRING  NOT NULL ,
    `hook` STRING  NOT NULL ,
    `priority` STRING  NOT NULL ,
    `dependency_type` STRING  NULL ,
    `handle` STRING  NULL ,
    `dependency_handle` STRING  NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- =========================================
CREATE TABLE `source_code` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `title` STRING  NOT NULL ,
    -- slugify of title
    `name` STRING  NOT NULL ,
    `version` STRING  NOT NULL ,
    -- name-version
    `slug` STRING  NOT NULL ,
    -- (theme|plugin|wpcore)
    `type` ENUM  NOT NULL ,
    -- Require WP version
    `requires_wp` STRING  NOT NULL ,
    -- Require PHP version
    `requires_php` STRING  NOT NULL ,
    -- (wporg|github|custom)
    `source` enum  NOT NULL ,
    `tags` STRING  NOT NULL ,
    -- Nullable
    `parent` INT  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

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
-- preview_url: ‘https://wp-themes.com/prime-spa’
-- screenshot_url: ‘//ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0’
CREATE TABLE `source_code_meta` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `source_code_id` INT  NOT NULL ,
    `meta_key` STRING  NOT NULL ,
    `meta_value` STRING  NOT NULL ,
    PRIMARY KEY (
        `ID`
    )
);

-- =========================================
CREATE TABLE `authors` (
    `ID` INT AUTO_INCREMENT NOT NULL ,
    `name` STRING  NOT NULL ,
    `author_url` STRING  NOT NULL ,
    `display_name` STRING  NOT NULL ,
    `user_nicename` STRING  NOT NULL ,
    `avatar` STRING  NOT NULL 
);

ALTER TABLE `site_meta` ADD CONSTRAINT `fk_site_meta_site_id` FOREIGN KEY(`site_id`)
REFERENCES `sites` (`ID`);

ALTER TABLE `site_urls` ADD CONSTRAINT `fk_site_urls_site_id` FOREIGN KEY(`site_id`)
REFERENCES `sites` (`ID`);

ALTER TABLE `url_errors_relationship` ADD CONSTRAINT `fk_url_errors_relationship_site_url_id` FOREIGN KEY(`site_url_id`)
REFERENCES `site_urls` (`ID`);

ALTER TABLE `url_errors_relationship` ADD CONSTRAINT `fk_url_errors_relationship_error_id` FOREIGN KEY(`error_id`)
REFERENCES `error_info` (`ID`);

ALTER TABLE `url_errors_relationship` ADD CONSTRAINT `fk_url_errors_relationship_error_source_id` FOREIGN KEY(`error_source_id`)
REFERENCES `error_source` (`ID`);

ALTER TABLE `error_source` ADD CONSTRAINT `fk_error_source_error_id` FOREIGN KEY(`error_id`)
REFERENCES `error_info` (`ID`);

ALTER TABLE `error_source` ADD CONSTRAINT `fk_error_source_source_code_id` FOREIGN KEY(`source_code_id`)
REFERENCES `source_code` (`ID`);

ALTER TABLE `source_code` ADD CONSTRAINT `fk_source_code_parent` FOREIGN KEY(`parent`)
REFERENCES `source_code` (`ID`);

ALTER TABLE `source_code_meta` ADD CONSTRAINT `fk_source_code_meta_source_code_id` FOREIGN KEY(`source_code_id`)
REFERENCES `source_code` (`ID`);

