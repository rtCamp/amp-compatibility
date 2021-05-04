'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ExtensionVersionSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'extension_versions', ( table ) => {

			table.string( 'extension_version_slug' ).primary().comment( 'Slug of extension version. `${type}-${extension_slug}-${version}` e.g. plugin-woocommerce-4.1' );
			table.string( 'extension_slug' ).notNullable().comment( 'Slug of extension. `${type}-${extension_slug}` e.g. plugin-woocommerce' );
			table.string( 'type' ).notNullable().comment( 'Type of extension. Possible values plugin|theme.' );
			table.string( 'slug' ).notNullable().comment( 'Slug of theme/plugin. e.g. redirection.' );
			table.string( 'version' ).notNullable().comment( 'Version of theme/plugin e.g. 4.5' );
			table.integer( 'error_count' ).unsigned().comment( 'Auto calculated field.' );
			table.string( 'compatibility_score' ).comment( 'Auto calculated field.' );
			table.string( 'verification_status' ).defaultTo( 'unknown' ).comment( 'Default unknown' );
			table.string( 'verified_by' );
			table.timestamps();

			table.foreign( 'extension_slug' ).references( 'extensions.extension_slug' )

			table.index( 'extension_slug' );
			table.index( 'type' );
			table.index( 'slug' );
			table.index( 'verification_status' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'extension_versions' );
	}
}

module.exports = ExtensionVersionSchema;
