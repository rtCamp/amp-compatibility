'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class AdhocSyntheticJobSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'adhoc_synthetic_jobs', ( table ) => {
			table.string( 'uuid', 50 ).primary();
			table.string( 'domain' ).notNullable();
			table.string( 'status' ).defaultTo( 'pending' ).notNullable();
			table.specificType( 'data', 'mediumblob' ).notNullable();
			table.text( 'logs', [ 'longtext' ] );
			table.specificType( 'result', 'mediumblob' );
			table.timestamps();

			table.index( 'status' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'adhoc_synthetic_jobs' );
	}
}

module.exports = AdhocSyntheticJobSchema;
