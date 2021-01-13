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

		const command = `bash -x ${ bashFilePath } --domain=${ args.domain } --plugins=${ args.plugins } --plugin-versions=${ args.plugin_versions } --theme=${ args.theme } --theme-version=${ args.theme_version } | tee -a /var/log/sites/${ args.domain }.log`;

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