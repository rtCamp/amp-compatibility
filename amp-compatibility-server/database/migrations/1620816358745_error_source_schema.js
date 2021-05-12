'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ErrorSourceSchema extends Schema {
	up() {
		this.alter( 'error_sources', ( table ) => {
			// alter table
			table.string( 'priority' ).comment( 'e.g. 10' ).alter();
		} );
	}

	down() {
	}
}

module.exports = ErrorSourceSchema;
