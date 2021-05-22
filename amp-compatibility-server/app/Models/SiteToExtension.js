'use strict';

const Base = use( 'App/Models/Base' );
const SiteToExtensionValidator = use( 'App/Validators/SiteToExtension' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class SiteToExtension extends Base {

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
		return 'hash';
	}

	/**
	 * The attribute name for created at timestamp.
	 * Disable created at column for current table.
	 *
	 * @attribute createdAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get createdAtColumn() {
		return '';
	}

	/**
	 * The attribute name for updated at timestamp.
	 * Disable updated at column for current table.
	 *
	 * @attribute updatedAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get updatedAtColumn() {
		return '';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return SiteToExtensionValidator;
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
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		if ( ! _.has( data, 'site_url' ) || ! _.has( data, 'extension_version_slug' ) ) {
			return '';
		}

		const hashData = {
			site_url: data.site_url,
			extension_version_slug: data.extension_version_slug,
		};

		return Utility.makeHash( hashData );
	}
}

module.exports = SiteToExtension;
