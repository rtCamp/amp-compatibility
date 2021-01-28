'use strict';

const { sanitizor } = require( 'indicative' );
const _ = require( 'underscore' );

class Sanitizer {

	/**
	 * Construct method.
	 * Register all sanitization rules.
	 */
	constructor() {
		sanitizor.slug = this.slug;
		sanitizor.version = this.version;
		sanitizor.toInt = this.toInt;
		sanitizor.toFloat = this.toFloat;
		sanitizor.toUrl = this.toUrl;
		sanitizor.toDate = this.toDate;
		sanitizor.toJson = this.toJson;
	}

	slug( value ) {

		value = this.toJson( value );

		if ( _.isEmpty( value ) ) {
			return value;
		}

		return value
			.toString()
			.trim()
			.toLowerCase()
			.replace( /\s+/g, '-' )
			.replace( /[^\w\-]+/g, '-' )
			.replace( /\-\-+/g, '-' )
			.replace( /^-+/, '-' )
			.replace( /-+$/, '-' );
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

		return value
			.toString()
			.trim()
			.toLowerCase()
			.replace( ' ', '-' );
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

	toJson( value ) {

		if ( _.isObject( value ) || _.isArray( value ) ) {
			value = JSON.stringify( value );
		}

		return value;
	}

}

module.exports = Sanitizer;
