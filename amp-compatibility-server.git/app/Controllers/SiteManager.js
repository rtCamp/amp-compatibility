'use strict';

const WordPressSite = use( 'App/Controllers/Sites/WordPressSite' );

const Logger = use( 'Logger' );
const _ = require( 'underscore' );

class SiteManager {

	get type() {
		return this.options.type;
	}

	get paths() {
		return this.options.paths;
	}

	/**
	 * Construct method.
	 */
	constructor( options ) {

		this.options = _.defaults( options, {
			type: 'wp',
			paths: [],
		} );

		if ( ! _.isArray( this.paths ) || _.isEmpty( this.paths ) ) {
			throw 'Please provide site paths';
		}

		this.setupSites();
	}

	setupSites() {

		const sites = [];

		for ( const index in this.paths ) {
			const args = {
				path: this.paths[ index ],
			};
			const instance = new WordPressSite( args );

			sites.push( instance );
		}

		this.sites = sites;
	}

	getAvailableSite() {

		for ( const index in this.sites ) {
			if ( true === this.sites[ index ].isAvailable ) {
				return this.sites[ index ];
			}
		}

		return false;
	}

}

module.exports = SiteManager;
