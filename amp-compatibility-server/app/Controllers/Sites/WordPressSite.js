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
		const bashFilePath = `${ projectRoot }scripts/sites/wp-site-run-test.sh`;

		await Utility.sleep( Utility.random( 1, 10 ) );

		if ( args.domain.startsWith( 'adhoc-synthetic-data' ) ) {
			logFileName = args.domain;
		} else {
			const date = Utility.getCurrentDateTime().replace( / |:/g, '-' );
			logFileName = args.domain + '-' + date;
		}
		const command = `bash -x ${ bashFilePath } --domain=${ args.domain } --plugins=${ args.plugins } --theme=${ args.theme } 2>&1 | tee -a /var/log/sites/${ logFileName }.log`;

		try {
			await this.executeCommand( command );
			// TODO: Sync ${ logFileName } to GCP bucket.
		} catch ( exception ) {
			console.error( exception );
		}

	}

	async executeCommand( command ) {
		await Utility.executeCommand( command );
	}

}

module.exports = WordPressSite;