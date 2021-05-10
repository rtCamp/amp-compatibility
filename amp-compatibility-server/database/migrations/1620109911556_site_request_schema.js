'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class SiteRequestSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'site_requests', ( table ) => {
			table.string( 'uuid', 50 ).primary();
			table.string( 'site_url' ).notNullable();
			table.string( 'status' ).defaultTo( 'pending' ).notNullable();
			table.boolean( 'is_synthetic' ).defaultTo( false );
			table.specificType( 'data', 'mediumblob' ).notNullable();
			table.specificType( 'error_log', 'mediumblob' );
			table.text( 'logs', [ 'longtext' ] );
			table.specificType( 'result', 'mediumblob' );
			table.timestamps();

			table.index( 'site_url' );
			table.index( 'status' );
			table.index( 'is_synthetic' );
		} );

	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'site_requests' );
	}
}

module.exports = SiteRequestSchema;
