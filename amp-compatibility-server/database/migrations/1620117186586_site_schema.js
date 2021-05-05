'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class SiteSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'sites', ( table ) => {
			table.string( 'site_url' ).primary().comment( 'amp-wp.test' );
			table.string( 'site_title' ).notNullable().comment( 'AMP WP' );
			table.string( 'php_version' ).comment( 'E.g. 7.2.34-8+ubuntu18.04.1+deb.sury.org+1' );
			table.string( 'mysql_version' ).comment( 'E.g. 5.5.3' );
			table.string( 'wp_version' ).comment( 'E.g. 5.5.3' );
			table.string( 'wp_language' ).comment( 'E.g. en_US' );
			table.boolean( 'wp_https_status' );
			table.string( 'wp_multisite' ).comment( 'E.g. subdomain|subdirectory|false' );
			table.string( 'wp_active_theme' ).comment( '' );
			table.boolean( 'object_cache_status' ).defaultTo( false ).comment( 'Object cache enabled.' );
			table.string( 'libxml_version' ).comment( 'libxml version' );
			table.boolean( 'is_defined_curl_multi' ).comment( 'Whether the curl_multi functions are defined.' );
			table.boolean( 'stylesheet_transient_caching' ).comment( 'Whether stylesheet transient caching is disabled' );
			table.boolean( 'loopback_requests' ).comment( 'Whether loopback requests are working.' );
			table.string( 'amp_mode' ).comment( 'e.g. standard|reader|transitional|off' );
			table.string( 'amp_version' ).comment( 'AMP Plugin version' );
			table.boolean( 'amp_plugin_configured' );
			table.boolean( 'amp_all_templates_supported' ).comment( 'AMP plugin settings' );
			table.string( 'amp_supported_post_types' ).comment( 'Theme templates with enable/disable status' );
			table.string( 'amp_supported_templates' );
			table.boolean( 'amp_mobile_redirect' );
			table.string( 'amp_reader_theme' );
			table.boolean( 'is_synthetic_data' ).defaultTo( false ).comment( 'Is data for this site is auto generated or not. Default False' );
			table.timestamps();

			table.foreign( 'wp_active_theme' ).references( 'extension_versions.extension_version_slug' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'sites' );
	}
}

module.exports = SiteSchema;
