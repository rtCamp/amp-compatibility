'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const ErrorValidator = use( 'App/Validators/Error' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class BigQueryError extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'errors';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'error_slug';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		const hashData = _.clone( data );
		delete hashData.error_slug;

		return Utility.makeHash( hashData );
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return ErrorValidator;
	}

}

module.exports = BigQueryError;
