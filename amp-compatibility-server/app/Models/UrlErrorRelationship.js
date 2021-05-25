'use strict';

const Base = use( 'App/Models/Base' );
const UrlErrorRelationshipValidator = use( 'App/Validators/UrlErrorRelationship' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class UrlErrorRelationship extends Base {

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

		if ( ! _.has( data, 'page_url' ) || ! _.has( data, 'error_slug' ) || ! _.has( data, 'error_source_slug' ) ) {
			return '';
		}

		const hashData = {
			page_url: data.page_url,
			error_slug: data.error_slug,
			error_source_slug: data.error_source_slug,
		};

		return Utility.makeHash( hashData );
	}

	/**
	 * Query argument for data that need to send in BigQuery.
	 *
	 * @return {{}}
	 */
	static getBigqueryQueryArgs() {
		return {};
	}

	/**
	 * Maximum row can send to BQ.
	 *
	 * @return {number}
	 */
	static get bqMaxRowToSave() {
		return 5000;
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return UrlErrorRelationshipValidator;
	}
}

module.exports = UrlErrorRelationship;
