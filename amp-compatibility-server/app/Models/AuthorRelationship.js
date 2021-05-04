'use strict';

const Base = use( 'App/Models/Base' );
const AuthorRelationshipValidator = use( 'App/Validators/AuthorRelationship' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class AuthorRelationship extends Base {

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
		return 'hash';
	}

	/**
	 * The attribute name for created at timestamp.
	 * Disable created at column for current table.
	 *
	 * @attribute createdAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get createdAtColumn() {
		return '';
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

		if ( ! _.has( data, 'extension_slug' ) || ! _.has( data, 'profile' ) ) {
			return '';
		}

		const hashData = {
			extension_slug: data.extension_slug,
			profile: data.profile,
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

module.exports = AuthorRelationship;
