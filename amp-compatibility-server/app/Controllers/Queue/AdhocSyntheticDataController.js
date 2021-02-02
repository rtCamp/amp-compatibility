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
		Logger.info( 'Job ID: %s | Site: %s started.', job.id, this.site );

		const siteInstance = new WordPressSite();

		let result = {};
		let response = {};
		try {
			result = await siteInstance.runTest( job.data ) || {};
			
			// @TODO: send email
		} catch ( exception ) {
			console.error( exception );
		}

		return { status: 'ok', data: { result: result, response: response } };
	}
}

module.exports = AdhocSyntheticDataController;