'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class AuthorRelationshipSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'author_relationships', ( table ) => {
			table.string( 'hash' ).primary();
			table.string( 'extension_slug' ).notNullable();
			table.string( 'profile' ).notNullable();

			table.foreign( 'extension_slug' ).references( 'extensions.extension_slug' );
			table.foreign( 'profile' ).references( 'authors.profile' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'author_relationships' );
	}
}

module.exports = AuthorRelationshipSchema;
