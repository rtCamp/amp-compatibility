'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const SiteValidator = use( 'App/Validators/Site' );

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

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return SiteValidator;
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
		return 'updated_at';
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

}

module.exports = BigQuerySite;
