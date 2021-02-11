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
		let logFilePath = Utility.logPath() + '/sites';

		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		const bashFilePath = `${ projectRoot }scripts/sites/wp-site-run-test.sh`;


		await Utility.sleep( Utility.random( 1, 10 ) );

		if ( args.domain.startsWith( 'adhoc-synthetic-data' ) ) {
			logFilePath = `${logFilePath}/adhoc-synthetic-data/${args.domain}.log`;
		} else {
			const date = Utility.getCurrentDate().replace( / |:/g, '-' );
			logFilePath = `${ logFilePath }/synthetic-data/${ date }/${ args.domain }.log`;
		}

		const command = `bash ${ bashFilePath } --domain=${ args.domain } --plugins=${ args.plugins } --theme=${ args.theme } 2>&1 | tee -a ${ logFilePath }`;

		try {
			await this.executeCommand( command );

			// TODO: Sync ${ logFilePath } to GCP bucket.
		} catch ( exception ) {
			console.error( exception );
		}

	}

	async executeCommand( command ) {
		await Utility.executeCommand( command );
	}

}

module.exports = WordPressSite;