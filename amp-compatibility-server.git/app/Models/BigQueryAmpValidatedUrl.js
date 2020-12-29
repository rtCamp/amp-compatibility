'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const AmpValidatedUrlValidator = use( 'App/Validators/AmpValidatedUrl' );

class BigQueryAmpValidatedUrl extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'amp_validated_urls';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'page_url';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return AmpValidatedUrlValidator;
	}

}

module.exports = BigQueryAmpValidatedUrl;
