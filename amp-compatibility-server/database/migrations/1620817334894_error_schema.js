'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ErrorSchema extends Schema {
	up() {
		this.alter( 'errors', ( table ) => {
			table.text( 'url' ).alter();
		} );
	}

	down() {

	}
}

module.exports = ErrorSchema;
