'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Models/Base' );
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const ExtensionValidator = use( 'App/Validators/Extension' );
const _ = require( 'underscore' );

class Extension extends Base {

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
		};
	}

	/**
	 * After record create event.
	 *
	 * @return {Promise<void>}
	 */
	async afterCreate() {
		await this.createExtensionVersions();
	}

	async createExtensionVersions() {

		const extensionVersion = ExtensionVersionModel.getItemFromExtension( this.toObject() );

		await ExtensionVersionModel.save( extensionVersion );
	}
}

module.exports = Extension;
