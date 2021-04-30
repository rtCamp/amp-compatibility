'use strict';

const BigQueryBase = use( 'App/Models/BigQuery/Base' );
const UrlErrorRelationshipValidator = use( 'App/Validators/UrlErrorRelationship' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class UrlErrorRelationship extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'url_error_relationships';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
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
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return UrlErrorRelationshipValidator;
	}
}

module.exports = UrlErrorRelationship;
