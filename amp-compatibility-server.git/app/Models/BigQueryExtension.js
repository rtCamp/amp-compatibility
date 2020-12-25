'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const ExtensionValidator = use( 'App/Validators/Extension' );
const _ = require( 'underscore' );

class BigQueryExtension extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'extensions';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'extension_slug';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return ExtensionValidator;
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {
		return ( _.has( data, 'type' ) && _.has( data, 'slug' ) ) ? `${ data.type }-${ data.slug }` : '';
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			wporg: false,
			support_threads: 0,
			support_threads_resolved: 0,
			active_installs: 0,
			downloaded: 0,
			last_updated: null,
			date_added: null,
		};
	}

}

module.exports = BigQueryExtension;
