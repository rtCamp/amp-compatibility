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

		await Utility.sleep( Utility.random( 1, 10 ) );

		const command = `bash -x ${ bashFilePath } --domain=${ args.domain } --plugins=${ args.plugins } --theme=${ args.theme } 2>&1 | tee -a /var/log/sites/${ args.domain }.log`;

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