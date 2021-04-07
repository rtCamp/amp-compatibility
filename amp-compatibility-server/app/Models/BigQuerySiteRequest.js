'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const SiteRequestValidator = use( 'App/Validators/SiteRequest' );
const BigQuery = use( 'App/BigQuery' );

class BigQuerySiteRequest extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'site_requests';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'site_request_id';
	}

	/**
	 * The attribute name for created at date time.
	 *
	 * @attribute createdAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get createdAtColumn() {
		return 'created_at';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return SiteRequestValidator;
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			status: 'pending',
		};
	}

	/**
	 * To save site request in BigQuery
	 *
	 * @param {Object} item Item to be insterted.
	 *
	 * @returns {Promise<Array>} True on success Otherwise False.
	 */
	static async saveSiteRequest( item ) {

		const insertQuery = await this.getInsertQuery( item );
		const response = await BigQuery.query( insertQuery );
		return response;

	}
}

module.exports = BigQuerySiteRequest;
