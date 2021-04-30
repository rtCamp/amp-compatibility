'use strict';

const BigQueryBase = use( 'App/Models/BigQuery/Base' );
const AuthorValidator = use( 'App/Validators/Author' );

class Author extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'authors';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} Primary field name.
	 */
	static get primaryKey() {
		return 'author_profile';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return AuthorValidator;
	}

}

module.exports = Author;
