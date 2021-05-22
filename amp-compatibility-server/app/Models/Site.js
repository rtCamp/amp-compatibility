'use strict';

const Base = use( 'App/Models/Base' );
const SiteValidator = use( 'App/Validators/Site' );

class Site extends Base {

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
		return 'site_url';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return SiteValidator;
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			object_cache_status: false,
		};
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
		return 500;
	}


}

module.exports = Site;
