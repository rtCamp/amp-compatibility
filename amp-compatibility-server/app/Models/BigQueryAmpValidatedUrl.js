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

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			css_size_before: 0,
			css_size_after: 0,
			css_size_excluded: 0,
			css_budget_percentage: 0,
		};
	}

	/**
	 * The attribute name for updated at timestamp.
	 *
	 * @attribute updatedAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get updatedAtColumn() {
		return 'updated_at'
	}

}

module.exports = BigQueryAmpValidatedUrl;
