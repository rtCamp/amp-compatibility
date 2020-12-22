'use strict';

const Validator = use( 'Validator' );
const _ = require( 'underscore' );

class ValidatorExtended {

	/**
	 * Construct method.
	 */
	constructor() {
		Validator.extend( 'version', this.version );
		Validator.extend( 'float', this.float );
		Validator.extend( 'url', this.url );
	}

	/**
	 * To validate field for "enum" type.
	 *
	 * @param {Object} data Object of data that need to validate.
	 * @param {String} field Field from data what need to validate.
	 * @param {String} message Message when validation fails.
	 * @param {Array} args Additional argument.
	 * @param {Function} get Function to get value of field from data.
	 *
	 * @throws Throws error message on validation fail.
	 *
	 * @returns {Promise<void>} Void
	 */
	async enum( data, field, message, args, get ) {

		let value = get( data, field );
		value = value.trim();

		if ( ! value ) {
			/**
			 * skip validation if value is not defined. `required` rule
			 * should take care of it.
			 */
			return;
		}

		args = ( _.isArray( args ) ) ? args : [];

		if ( ! args.includes( value ) ) {
			throw message;
		}

	}

	/**
	 * To validate field for "version" type.
	 *
	 * @param {Object} data Object of data that need to validate.
	 * @param {String} field Field from data what need to validate.
	 * @param {String} message Message when validation fails.
	 * @param {Array} args Additional argument.
	 * @param {Function} get Function to get value of field from data.
	 *
	 * @throws Throws error message on validation fail.
	 *
	 * @returns {Promise<void>} Void
	 */
	async version( data, field, message, args, get ) {

		const value = get( data, field );

		if ( ! value ) {
			/**
			 * skip validation if value is not defined. `required` rule
			 * should take care of it.
			 */
			return;
		}

		/**
		 * Regex to validate version string.
		 * Reference: https://regex101.com/r/aqBIwS/1/
		 *
		 * @type {RegExp} Regular expression.
		 */
		const versionRegex = /^[0-9]{1,5}\.[0-9]{1,5}(\..+)?$/gim;

		if ( false === versionRegex.test( value.trim() ) ) {
			throw message;
		}

	}

	/**
	 * To validate field for "float" type.
	 *
	 * @param {Object} data Object of data that need to validate.
	 * @param {String} field Field from data what need to validate.
	 * @param {String} message Message when validation fails.
	 * @param {Array} args Additional argument.
	 * @param {Function} get Function to get value of field from data.
	 *
	 * @throws Throws error message on validation fail.
	 *
	 * @returns {Promise<void>} Void
	 */
	async float( data, field, message, args, get ) {

		const value = get( data, field );

		if ( ! value ) {
			/**
			 * skip validation if value is not defined. `required` rule
			 * should take care of it.
			 */
			return;
		}

		// If value is numeric then value can be float as well.
		if ( ! isNaN( value ) ) {
			return;
		}

		/**
		 * Regex to validate float string.
		 * Reference: https://regex101.com/r/lOVTXP/1
		 *
		 * @type {RegExp} Regular expression
		 */
		const floatRegex = /^[0-9]{1,}\.?[0-9]{1,}?$/gim;

		if ( false === floatRegex.test( value ) ) {
			throw message;
		}

	}

	/**
	 * To validate field for "url" type.
	 *
	 * @param {Object} data Object of data that need to validate.
	 * @param {String} field Field from data what need to validate.
	 * @param {String} message Message when validation fails.
	 * @param {Array} args Additional argument.
	 * @param {Function} get Function to get value of field from data.
	 *
	 * @throws Throws error message on validation fail.
	 *
	 * @returns {Promise<void>} Void
	 */
	async url( data, field, message, args, get ) {

		const value = get( data, field );

		if ( ! value ) {
			/**
			 * skip validation if value is not defined. `required` rule
			 * should take care of it.
			 */
			return;
		}

		/**
		 * Regex to validate URL.
		 * Reference: https://regex101.com/r/fZnSxB/2
		 *
		 * @type {RegExp} Regular expression
		 */
		const urlRegex = /^(http(s)?:\/\/|\/[\/]?)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)$/mig;

		if ( false === urlRegex.test( value ) ) {
			throw message;
		}

	}

}

module.exports = ValidatorExtended;