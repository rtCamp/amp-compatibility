'use strict';

const BigQueryBase = use( 'App/Models/BigQuery/Base' );
const SiteToExtensionValidator = use( 'App/Validators/SiteToExtension' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class SiteToExtension extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'site_to_extensions';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'hash';
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
