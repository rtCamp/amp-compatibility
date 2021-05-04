'use strict';

const Base = use( 'App/Models/Base' );
const ErrorValidator = use( 'App/Validators/Error' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class Error extends Base {

	/**
	 * The primary key for the model.
	 *
	 * @attribute primaryKey
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get primaryKey() {
		return 'error_slug';
	}

	/**
	 * The attribute name for updated at timestamp.
	 * Disable updated at column for current table.
	 *
	 * @attribute updatedAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get updatedAtColumn() {
		return '';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		const hashData = _.clone( data );
		delete hashData.slug;
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

module.exports = Error;
