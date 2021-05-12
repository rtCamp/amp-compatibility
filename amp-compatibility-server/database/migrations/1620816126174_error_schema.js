'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ErrorSchema extends Schema {
	up() {
		this.alter( 'errors', ( table ) => {
			table.specificType( 'message', 'mediumblob' ).alter();
		} );
	}

	down() {

	}
}

module.exports = ErrorSchema;
