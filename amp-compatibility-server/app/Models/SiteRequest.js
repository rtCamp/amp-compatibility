'use strict';

const Base = use( 'App/Models/Base' );
const SiteRequestValidator = use( 'App/Validators/SiteRequest' );

class SiteRequest extends Base {

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
		return 'uuid';
	}

	/**
	 * The foreign key for the model.
	 * Same as Primary key.
	 *
	 * @attribute foreignKey
	 *
	 * @return {String}
	 *
	 */
	static get foreignKey() {
		return 'site_request_uuid';
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

}

module.exports = SiteRequest;
