'use strict';

const { validate, formatters, validateAll } = use( 'Validator' );
const { sanitize } = require( 'indicative' );

class Base {

	/**
	 * Validation rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/syntax-guide
	 *
	 * @returns Object
	 */
	static get rules() {
		return {};
	}

	/**
	 * Custom validation messages.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/custom-messages
	 *
	 * @returns Object
	 */
	static get messages() {
		return {};
	}

	/**
	 * Sanitization rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/escape
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {};
	}

	/**
	 * Validation message formation.
	 *
	 * @returns {*}
	 */
	static get formatter() {
		return formatters.Vanilla;
	}

	/**
	 * To validate provided data.
	 * Note: It will stop after any data validation fail.
	 *
	 * @param {Object} data Data to validate.
	 *
	 * @returns {Promise<*>}
	 */
	static async validate( data ) {
		return await validate( data, this.rules, this.messages, this.formatter );
	}

	/**
	 * To validate provided data.
	 *
	 * @param {Object} data Data to validate.
	 *
	 * @returns {Promise<*>}
	 */
	static async validateAll( data ) {
		return await validateAll( data, this.rules, this.messages, this.formatter );
	}

	/**
	 * To get sanitized data.
	 *
	 * @param {Object} data Data to sanitize.
	 *
	 * @return {Object} Sanitized data.
	 */
	static sanitize( data ) {
		return sanitize( data, this.sanitizationRules );
	}
}

module.exports = Base;
