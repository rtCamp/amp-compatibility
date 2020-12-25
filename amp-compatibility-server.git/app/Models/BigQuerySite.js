'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );

class BigQuerySite extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'sites';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'site_url';
	}

}

module.exports = BigQuerySite;
