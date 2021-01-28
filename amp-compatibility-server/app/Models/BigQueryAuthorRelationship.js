'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const AuthorRelationshipValidator = use( 'App/Validators/AuthorRelationship' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class BigQueryAuthorRelationship extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'author_relationships';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} Primary field name.
	 */
	static get primaryKey() {
		return 'hash';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		if ( ! _.has( data, 'extension_slug' ) || ! _.has( data, 'author_profile' ) ) {
			return '';
		}

		const hashData = {
			extension_slug: data.extension_slug,
			author_profile: data.author_profile,
		};

		return Utility.makeHash( hashData );
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return AuthorRelationshipValidator;
	}

}

module.exports = BigQueryAuthorRelationship;
