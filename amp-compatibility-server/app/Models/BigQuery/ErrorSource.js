'use strict';

const BigQueryBase = use( 'App/Models/BigQuery/Base' );
const ErrorSourceValidator = use( 'App/Validators/ErrorSource' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class ErrorSource extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'error_sources';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'error_source_slug';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		const hashData = _.clone( data );
		delete hashData.error_source_slug;

		return Utility.makeHash( hashData );
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return ErrorSourceValidator;
	}

	/**
	 * Prepare item for insert/update in bigquery.
	 *
	 * @param {Object} item Item to insert.
	 *
	 * @returns {Promise<Boolean|Object>} Object on success otherwise False.
	 */
	static async prepareItem( item ) {

		const parentCallback = BigQueryBase.prepareItem.bind( this );

		item = await parentCallback( item );

		// Item should be the object.
		if ( ! _.isObject( item ) ) {
			return false;
		}

		/**
		 * Remove unwanted fields.
		 */
		const tableFields = Object.keys( this.validator.rules );

		for ( const field in item ) {
			if ( ! tableFields.includes( field ) ) {
				delete item[ field ];
			}
		}

		item.raw_data = Utility.jsonPrettyPrint( item );

		return item;
	}

}

module.exports = ErrorSource;
