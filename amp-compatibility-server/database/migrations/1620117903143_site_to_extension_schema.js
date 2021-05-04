'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class SiteToExtensionSchema extends Schema {
	up() {
		this.create( 'site_to_extensions', ( table ) => {
			table.string( 'site_url' ).notNullable();
			table.string( 'extension_version_slug' ).notNullable();
			table.string( 'amp_suppressed', 50 ).comment( 'Plugin version when it was suppressed.' );

			table.foreign( 'site_url' ).references( 'sites.site_url' );
			table.foreign( 'extension_version_slug' ).references( 'extension_versions.extension_version_slug' );
		} );
	}

	down() {
		this.drop( 'site_to_extensions' );
	}
}

module.exports = SiteToExtensionSchema;
