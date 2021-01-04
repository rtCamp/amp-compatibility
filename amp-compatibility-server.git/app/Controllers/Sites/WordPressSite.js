'use strict';

const Helpers = use( 'Helpers' );
const Logger = use( 'Logger' );

// Utilities
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class WordPressSite {

	get path() {
		return this.options.path;
	}

	/**
	 * Construct method.
	 */
	constructor( options ) {

		this.options = _.defaults( options, {
			path: '',
			createSite: false,
		} );

		this.verify();

		this.isAvailable = true;
	}

	verify() {

		if ( _.isEmpty( this.path ) ) {
			throw 'Please provide WordPress site path.';
		}

		const isLegit = true;

		if ( false === isLegit ) {
			throw 'Please provide valid WordPress site path. And make sure wp-cli is installed.';
		}

	}

	async runTest( args ) {

		this.isAvailable = false;

		let projectRoot = Helpers.appRoot();
		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		const bashFilePath = `${ projectRoot }scripts/wp-site-run-test.sh`;

		const command = `bash ${ bashFilePath } ${ args.extension_version_slug } ${ args.type } ${ args.slug } ${ args.version }`

		await this.executeCommand( command );

		await Utility.sleep( 10 );

		this.isAvailable = true;
	}

	async executeCommand( command ) {

		await Utility.executeCommand( `cd ${ this.path }` );
		await Utility.executeCommand( command );

	}

}

module.exports = WordPressSite;