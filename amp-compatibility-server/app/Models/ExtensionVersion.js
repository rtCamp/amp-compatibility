'use strict';

const Base = use( 'App/Models/Base' );
const ExtensionModel = use( 'App/Models/Extension' );

const ExtensionVersionValidator = use( 'App/Validators/ExtensionVersion' );
const _ = require( 'underscore' );

class ExtensionVersion extends Base {

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
			verification_status: 'unknown',
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

module.exports = ExtensionVersion;
