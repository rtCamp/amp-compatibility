'use strict';

const Helpers = use( 'Helpers' );
const Logger = use( 'Logger' );

// Utilities
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class WordPressSite {

	/**
	 * Construct method.
	 */
	constructor( options ) {
		this.options = _.defaults( options, {} );
	}

	async runTest( args ) {

		let projectRoot = Helpers.appRoot();
		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		const bashFilePath = `${ projectRoot }scripts/wp-site-run-test.sh`;

		const command = `bash -x ${ bashFilePath } ${ args.extension_version_slug } ${ args.type } ${ args.slug } ${ args.version }`;

		try {
			await this.executeCommand( command );
		} catch ( exception ) {
			console.error( exception );
		}

	}

	async executeCommand( command ) {
		await Utility.executeCommand( command );
	}

}

module.exports = WordPressSite;