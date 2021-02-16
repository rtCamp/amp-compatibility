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
		Validator.extend( 'object', this.object );
		Validator.extend( 'array', this.array );
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
		 * If version is numeric value.
		 * Then is valid version.
		 */
		if ( ! isNaN( value ) ) {
			return;
		}

		if ( 'string' === typeof value && 64 > value.length ) {
			return;
		}

		throw message;

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

		if ( '#' === value ) {
			return;
		}

		/**
		 * Regex to validate URL.
		 * Reference: https://regex101.com/r/l5Jiq4/1
		 *
		 * @type {RegExp} Regular expression
		 */
		const urlRegex = /^(http(s)?:\/\/|\/[\/]?)?(?:((www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,10})|(?:[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}))\b(?:[-a-zA-Z0-9@:%_\+.~#?&\/\/=;!$^*()×]*)$/mig;

		if ( false !== urlRegex.test( value ) ) {
			return;
		}

		throw message;

	}

	/**
	 * To validate field for "array" type.
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
	async array( data, field, message, args, get ) {

		const value = get( data, field );

		if ( ! value ) {
			/**
			 * skip validation if value is not defined. `required` rule
			 * should take care of it.
			 */
			return;
		}

		if ( _.isArray( value ) || _.isObject( value ) ) {
			return;
		}

		throw message;
	}

	/**
	 * To validate field for "object" type.
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
	async object( data, field, message, args, get ) {

		const value = get( data, field );

		if ( ! value ) {
			/**
			 * skip validation if value is not defined. `required` rule
			 * should take care of it.
			 */
			return;
		}

		if ( _.isObject( value ) ) {
			return;
		}

		throw message;
	}

}

module.exports = ValidatorExtended;