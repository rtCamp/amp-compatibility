'use strict';

const Helpers = use( 'Helpers' );

// Utilities
const Utility = use( 'App/Helpers/Utility' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const _ = require( 'underscore' );

class WordPressSite {

	/**
	 * Run Synthetic data test for WordPress site.
	 *
	 * @param {Object} args Job detail.
	 *
	 * @return {Promise<{}>}
	 */
	async runTest( args ) {

		let projectRoot = Helpers.appRoot();

		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		const bashFilePath = `${ projectRoot }scripts/sites/wp-site-run-test.sh`;

		await Utility.sleep( Utility.random( 1, 10 ) );

		if ( args.logFile ) {
			await FileSystem.assureDirectoryExists( args.logFile );
		}

		const command = `bash ${ bashFilePath } --domain=${ args.domain } --plugins=${ args.plugins } --theme=${ args.theme } --amp-source="${ args.ampSource }" 2>&1 | tee -a ${ args.logFile }`;

		let response = {};
		try {
			response = await Utility.executeCommand( command );
		} catch ( exception ) {
			console.error( exception );
		}

		return response;
	}

}

module.exports = WordPressSite;