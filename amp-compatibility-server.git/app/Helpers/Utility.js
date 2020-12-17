'use strict';

class Utility {

	/**
	 * Utility class to parse string into JSON if it's JSON string.
	 *
	 * @param {String} string May or may not be JSON string.
	 *
	 * @returns {*} String or parser Object/Array.
	 */
	static maybeParseJSON( string ) {

		let response = '';

		try {
			response = JSON.parse( string );
		} catch ( e ) {
			response = string
		}

		return response;
	}

}

module.exports = Utility;
