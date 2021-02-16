'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ExtensionVersionValidator = use( 'App/Validators/ExtensionVersion' );
const _ = require( 'underscore' );

class BigQueryExtensionVersion extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'extension_versions';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} Primary field name.
	 */
	static get primaryKey() {
		return 'extension_version_slug';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		if ( ! _.has( data, 'type' ) ||
			 ! _.has( data, 'slug' ) ||
			 ! _.has( data, 'version' )
		) {
			return '';
		}

		const version = data
			.version
			.toString()
			.trim()
			.toLowerCase()
			.replace( /[.]+/g, '-' )
			.replace( /[\s]+/g, '' );

		return `${ data.type }-${ data.slug }-${ version }`;
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return ExtensionVersionValidator;
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			error_count: 0,
			has_synthetic_data: false,
			is_verified: false,
		};
	}

	/**
	 * To get extension version detail from extension detail.
	 *
	 * @param {Object} extensionDetail Extension details.
	 *
	 * @returns {boolean|Object} Extension version detail.
	 */
	static getItemFromExtension( extensionDetail ) {

		if ( _.isEmpty( extensionDetail ) || ! _.has( extensionDetail, 'extension_slug' ) ) {
			return false;
		}

		const data = {
			type: extensionDetail.type,
			slug: extensionDetail.slug,
			version: extensionDetail.latest_version.toString(),
		};

		data.extension_slug = ExtensionModel.getPrimaryValue( data );
		data.extension_version_slug = this.getPrimaryValue( data );

		return data;
	}

}

module.exports = BigQueryExtensionVersion;
