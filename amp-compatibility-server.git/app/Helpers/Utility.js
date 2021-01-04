'use strict';

const Logger = use( 'Logger' );

const _ = require( 'underscore' );
const crypto = require( 'crypto' );
const { exec } = require( 'child_process' );

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

	/**
	 * To remove empty value from array.
	 *
	 * @param {Array} list Array of values
	 *
	 * @returns {[]} Array after removing empty value.
	 */
	static removeEmpty( list ) {
		return _.filter( list, ( item ) => ( ! _.isEmpty( item ) ) );
	}

	/**
	 * To print JSON in pretty format.
	 *
	 * @param {Object} data Object to print.
	 *
	 * @return string
	 */
	static jsonPrettyPrint( data ) {
		if ( ! _.isEmpty( data ) ) {
			return JSON.stringify( data, null, 4 )
		}

		return 'Empty Object';
	}

	/**
	 * To hold execution for certain amount of time.
	 *
	 * @param {Integer} seconds Number of second to hold
	 *
	 * @returns {Promise<void>}
	 */
	static async sleep( seconds ) {

		return new Promise( resolve => {
			setTimeout( resolve, ( seconds * 1000 ) );
		} );

	}

	/**
	 * To convert wp.org formatted datetime into datetime string.
	 *
	 * @param {String} datetime wp.org formatted datetime. e.g. 2020-12-01 12:12pm
	 *
	 * @returns {string} Datetime string. e.g. 2020-12-01 12:12:00
	 */
	static convertWpOrgDatetime( datetime ) {

		if ( _.isEmpty( datetime ) || ! _.isString( datetime ) ) {
			return '';
		}

		/**
		 * Reference: https://regex101.com/r/hBrNnk/1/
		 *
		 * @type {RegExp}
		 */
		const dateRegex = /(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})\s(?<hours>[0-9]{1,2}):(?<minutes>[0-9]{1,2})(?<period>am|pm)/mi;
		const matches = dateRegex.exec( datetime );

		if ( null === matches ) {
			return '';
		}

		const dateInfo = {
			year: parseInt( matches.groups.year ),
			month: parseInt( matches.groups.month ),
			day: parseInt( matches.groups.day ),
			hours: parseInt( matches.groups.hours ),
			minutes: parseInt( matches.groups.minutes ),
			seconds: 0,
		};

		if ( 'pm' === matches.groups.period.toLowerCase() && 12 > dateInfo.hours ) {
			dateInfo.hours = dateInfo.hours + 12;
		}

		return `${ dateInfo.year }-${ dateInfo.month }-${ dateInfo.day } ${ dateInfo.hours }:${ dateInfo.minutes }:00`;
	}

	/**
	 * To get average ratings of theme/plugin
	 *
	 * @param {Object} ratings Theme/Plugin ratings.
	 *
	 * @returns {number} Average ratings
	 */
	static getAverageRating( ratings ) {

		if ( ! _.isObject( ratings ) ) {
			return 0;
		}

		ratings = _.defaults( ratings, { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } );

		let totalRatings = 0;
		let ratingValues = 0;
		for ( let i = 0; i <= 5; i++ ) {
			totalRatings += ratings[ i ] || 0;
			ratingValues += ( i * ratings[ i ] ) || 0;
		}

		let averageRating = ratingValues / totalRatings;
		averageRating = averageRating.toFixed( 2 );

		return parseFloat( averageRating );
	}

	/**
	 * To generate hash value of provided data.
	 *
	 * @param {Object|Array|String|Number} data Data for that need hash value.
	 *
	 * @returns {String} Hash value of provided data.
	 */
	static makeHash( data ) {

		if ( _.isNumber( data ) ) {
			data = data.toString();
		} else if ( _.isArray( data ) ) {
			data = JSON.stringify( data );
		} else if ( _.isObject( data ) ) {
			data = JSON.stringify( data );
		}

		const hash = crypto.createHash( 'sha256' ).update( data ).digest( 'hex' );
		return hash;
	}

	/**
	 * To get size of text in KB.
	 *
	 * @param {String} string String for that we need to find size
	 *
	 * @returns {number} Size of the string in kb.
	 */
	static getSizeOfText( string ) {

		if ( _.isEmpty( string ) ) {
			return 0;
		}

		const bytes = Buffer.byteLength( string, 'utf8' );
		const kiloBytes = ( bytes / 1000 );

		return Math.ceil( kiloBytes );
	}

	/**
	 * To get current date and time.
	 *
	 * @returns {string} Current date and time.
	 */
	static getCurrentDateTime() {
		let date_ob = new Date();
		// current date
		// adjust 0 before single digit date
		let date = ( '0' + date_ob.getDate() ).slice( -2 );
		let month = ( '0' + ( date_ob.getMonth() + 1 ) ).slice( -2 );
		let year = date_ob.getFullYear();
		let hours = date_ob.getHours();
		let minutes = date_ob.getMinutes();
		let seconds = date_ob.getSeconds();

		return `${ year }-${ month }-${ date } ${ hours }:${ minutes }:${ seconds }`;

	}

	static async executeCommand( command ) {

		await exec( command, ( error, stdout, stderr ) => {

			Logger.debug( `Command: ${ command }` );

			if ( error ) {
				Logger.debug( `Error: ${ error.message }` );
				return;
			}

			if ( stderr ) {
				Logger.debug( `Output: ${ stderr }` );
				return;
			}

			Logger.debug( `Result: ${ stdout }` );
			return stdout;
		} );
	}
}

module.exports = Utility;
