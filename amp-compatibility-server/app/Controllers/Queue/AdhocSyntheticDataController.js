'use strict';

const SyntheticDataController = use( 'App/Controllers/Queue/SyntheticDataController' );
const WordPressSite = use( 'App/Controllers/Sites/WordPressSite' );
const Logger = use( 'Logger' );
const BigQuery = use( 'App/BigQuery' );

const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

const { exit } = require( 'process' );
const _ = require( 'underscore' );

/**
 * Helper to manage request queue.
 */
class AdhocSyntheticDataController extends SyntheticDataController {

	/**
	 * Queue name.
	 *
	 * @returns {string} Queue name
	 */
	static get queueName() {
		return 'adhoc_synthetic_data_queue';
	}

	/**
	 * Callback function on each job success.
	 *
	 * @param {String} jobId Job ID
	 * @param {Object} result Result of process.
	 *
	 * @returns {Promise<void>}
	 */
	static async onJobSucceeded( jobId, result ) {

		const queueHealth = await this.queue.checkHealth();
		const totalJobs = parseInt( queueHealth.waiting + queueHealth.active + queueHealth.delayed + queueHealth.newestJob );

		Logger.info( '%s jobs left.', totalJobs );
	}

	/**
	 * Handler to process the job.
	 *
	 * @param {Object} job Job to process.
	 * @param {Function} done Callback function.
	 *
	 * @returns {*}
	 */
	static async processJob( job, done ) {
		this.site = job.data.extension_version_slug || '';
		Logger.info( ' Site: %s | Job ID: %s started.', this.site, job.id );

		const currentTry = ( this.retries - job.options.retries ) + 1;
		const siteInstance = new WordPressSite( { currentTry: currentTry } );
		let result = '';
		let response = {};

		job.data = _.defaults( job.data, {
			ampSource: 'wporg',
		} );

		result = await siteInstance.runTest( job.data ) || {};

		try {
			result = await siteInstance.runTest( job.data ) || {};
			result = result.stdout || '';
		} catch ( exception ) {
			console.error( exception );
			throw `Try ${ currentTry } : Error during running the test.`;
		}

		job.reportProgress( 90 );

		if ( -1 === result.toString().indexOf( '{"status":"ok"}' ) ) {
			throw `Try ${ currentTry } : Fail to send AMP data.`;
		}

		return { status: 'ok', data: { result: result, response: response } };
	}
}

module.exports = AdhocSyntheticDataController;