'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class SiteRequestSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'site_requests', ( table ) => {
			table.string( 'site_request_id', 50 ).primary();
			table.string( 'site_url' ).notNullable();
			table.string( 'status' ).defaultTo( 'pending' ).notNullable();
			table.text( 'raw_data', [ 'longtext' ] ).notNullable();
			table.text( 'error_log', [ 'longtext' ] );
			table.timestamp( 'created_at' );

			table.index( [ 'status' ] );
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
