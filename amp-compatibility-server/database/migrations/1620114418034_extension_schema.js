'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ExtensionSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'extensions', ( table ) => {
			table.string( 'extension_slug', 100 ).primary().comment( 'Slug of extension. `${type}-${extension_slug}` e.g. plugin-woocommerce' );
			table.boolean( 'wporg' ).defaultTo( false ).comment( 'True if it is wp.org plugin/theme.' );
			table.string( 'type', 50 ).notNullable().comment( 'Type of extension. Possible values plugin|theme.' );
			table.string( 'name' ).notNullable().comment( 'e.g. Redirection' );
			table.string( 'slug' ).notNullable().comment( 'e.g. redirection' );
			table.string( 'latest_version', 50 ).notNullable().comment( 'Latest version of plugin/theme e.g. 4.9.2' );
			table.string( 'extension_url', 512 ).comment( 'Url for theme/plugin.' );
			table.string( 'preview_url', 512 ).comment( 'Preview URL of theme/plugin e.g. https://wp-wporg.com/prime-spa' );
			table.string( 'screenshot_url', 512 ).comment( 'Screenshot of plugin/theme e.g. //ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0' );
			table.string( 'requires_wp', 50 ).comment( 'Requires WordPress version e.g. 5.0' );
			table.string( 'tested_wp', 50 ).comment( 'Plugin/Theme is tested up to version e.g. 5.5.3' );
			table.string( 'requires_php', 50 ).comment( 'Require PHP version e.g. 5.6' );
			table.integer( 'average_rating' ).defaultTo( 0 ).unsigned().comment( 'wp.org data Average raging of plugin/theme' );
			table.integer( 'support_threads' ).defaultTo( 0 ).unsigned().comment( 'wp.org data e.g. 117' );
			table.integer( 'support_threads_resolved' ).defaultTo( 0 ).unsigned().comment( 'wp.org data e.g. 117' );
			table.bigInteger( 'active_installs' ).defaultTo( 0 ).unsigned().comment( 'Active install count from wp.org' );
			table.bigInteger( 'downloaded' ).defaultTo( 0 ).unsigned().comment( 'Download count from wp.org' );
			table.datetime( 'last_updated' ).defaultTo( null ).comment( 'Last update date of theme/plugin in wp.org.' );
			table.datetime( 'date_added' ).defaultTo( null ).comment( 'Date for when theme/plugin in wp.org.' );
			table.string( 'homepage_url' ).comment( 'Home page url of plugin/theme.' );
			table.string( 'short_description' ).comment( 'Short description of plugin/theme.' );
			table.string( 'download_url' ).comment( 'Download url of plugin/theme.' );
			table.string( 'author_url' ).comment( '' );
			table.text( 'tags', [ 'longtext' ] ).comment( 'Tags of theme/plugin in JSON format.' );
			table.string( 'icon_url' ).comment( 'Icon URL' );
			table.boolean( 'is_partner' ).defaultTo( false ).comment( 'Is partner plugin' );
			table.timestamps();

			table.index( 'wporg' );
			table.index( 'type' );
			table.index( 'name' );
			table.index( 'slug' );
			table.index( 'active_installs' );
			table.index( 'is_partner' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'extensions' );
	}
}

module.exports = ExtensionSchema;
