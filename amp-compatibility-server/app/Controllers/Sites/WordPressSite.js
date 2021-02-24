'use strict';

const Helpers = use( 'Helpers' );
const Storage = use( 'Storage' );

// Utilities
const Utility = use( 'App/Helpers/Utility' );
const FileSystem = use( 'App/Helpers/FileSystem' );
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
		let logFilePath = Utility.logPath();
		let logFileSuffix = '';

		projectRoot += projectRoot.endsWith( '/' ) ? '' : '/';
		const bashFilePath = `${ projectRoot }scripts/sites/wp-site-run-test.sh`;

		await Utility.sleep( Utility.random( 1, 10 ) );

		if ( this.options.currentTry !== 1 ) {
			logFileSuffix = '-retry-' + this.options.currentTry;
		}

		if ( args.domain.startsWith( 'adhoc-synthetic-data' ) ) {
			logFilePath = `${ logFilePath }/adhoc-synthetic-data/${ args.domain }${ logFileSuffix }.log`;
		} else {
			const date = Utility.getCurrentDate().replace( / |:/g, '-' );
			logFilePath = `${ logFilePath }/synthetic-data/${ date }/${ args.domain }${ logFileSuffix }.log`;
		}

		await FileSystem.assureDirectoryExists( logFilePath );
		const command = `bash -x ${ bashFilePath } --domain=${ args.domain } --plugins=${ args.plugins } --theme=${ args.theme } --amp-source=${ args.ampSource } 2>&1 | tee -a ${ logFilePath }`;

		let response = {};
		try {
			response = await this.executeCommand( command );
			// TODO: Sync ${ logFilePath } to GCP bucket.
		} catch ( exception ) {
			console.error( exception );
		}

		await Storage.uploadFile( logFilePath );

		return response;
	}

	async executeCommand( command ) {
		return await Utility.executeCommand( command );
	}

}

module.exports = WordPressSite;