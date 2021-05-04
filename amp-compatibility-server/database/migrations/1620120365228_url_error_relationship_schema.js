'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class UrlErrorRelationshipSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'url_error_relationships', ( table ) => {
			table.string( 'page_url' ).notNullable();
			table.string( 'error_slug' ).notNullable();
			table.string( 'error_source_slug' ).notNullable();

			table.foreign( 'page_url' ).references( 'amp_validated_urls.page_url' );
			table.foreign( 'error_slug' ).references( 'errors.error_slug' );
			table.foreign( 'error_source_slug' ).references( 'error_sources.error_source_slug' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'url_error_relationships' );
	}
}

module.exports = UrlErrorRelationshipSchema;
