'use strict';

const { sanitizor } = require( 'indicative' );
const _ = require( 'underscore' );

class Sanitizer {

	/**
	 * Construct method.
	 * Register all sanitization rules.
	 */
	constructor() {
		sanitizor.version = this.version;
		sanitizor.toInt = this.toInt;
		sanitizor.toFloat = this.toFloat;
		sanitizor.toUrl = this.toUrl;
		sanitizor.toDate = this.toDate;
	}

	/**
	 * Sanitize version string.
	 *
	 * @param {String} value Value to sanitize.
	 *
	 * @returns {String} Sanitized value.
	 */
	version( value ) {

		if ( ! _.isString( value ) ) {
			value = '';
		}

		return value.toLowerCase().trim();
	}

	/**
	 * Sanitize int values.
	 *
	 * @param {String|Number} value Value to sanitize.
	 *
	 * @returns {Number} Sanitized value.
	 */
	toInt( value ) {

		if ( isNaN( value ) ) {
			value = 0;
		}

		return parseInt( value ) || 0;
	}

	/**
	 * Sanitize float values.
	 *
	 * @param {String|Number} value Value to sanitize.
	 *
	 * @returns {Number} Sanitized value.
	 */
	toFloat( value ) {

		if ( isNaN( value ) ) {
			value = 0;
		}

		return parseFloat( value ) || 0;
	}

	/**
	 * To sanitize URL.
	 *
	 * @param {String} value Value to sanitize.
	 *
	 * @returns {String} Sanitized value.
	 */
	toUrl( value ) {

		if ( ! _.isString( value ) ) {
			value = '';
		}

		const removeProtocol = /http[s]?:\/\//gi;
		const removeTrailingSlashes = /^\/|\/$/gi;

		value = value
			.toLowerCase()
			.trim()
			.replace( removeProtocol, '' )
			.replace( removeTrailingSlashes, '' );

		return value;
	}

	toDate( value ) {

		if ( ! _.isString( value ) ) {
			value = '';
		}

		value = value.toLowerCase().trim();

		return value;
	}

}

module.exports = Sanitizer;
