'use strict';

const Base = use( 'App/Models/Base' );

const AmpValidatedUrlValidator = use( 'App/Validators/AmpValidatedUrl' );

class AmpValidatedUrl extends Base {

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
}

module.exports = AmpValidatedUrl;
