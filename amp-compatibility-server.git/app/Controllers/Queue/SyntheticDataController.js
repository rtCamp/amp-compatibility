'use strict';

const Base = use( 'App/Controllers/Queue/Base' );
const WordPressSite = use( 'App/Controllers/Sites/WordPressSite' );
const Logger = use( 'Logger' );
const BigQuery = use( 'App/BigQuery' );

const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

const { exit } = require( 'process' );
const _ = require( 'underscore' );

/**
 * Helper to manage request queue.
 */
class SyntheticDataController extends Base {

	/**
	 * Queue name.
	 *
	 * @returns {string} Queue name
	 */
	static get queueName() {
		return 'synthetic_data_queue';
	}

	/**
	 * Action before starting worker.
	 *
	 * @param {Object} options Options pass in startWorker.
	 *
	 * @returns {Promise<void>}
	 */
	static async beforeStartWorker( options ) {

		this.onJobSucceeded = this.onJobSucceeded.bind( this );

		// Terminate the worker if all jobs are completed
		this.queue.on( 'job succeeded', this.onJobSucceeded );

	}

	/**
	 * Callback function on each job success.
	 *
	 * Terminate the worker if all jobs are completed
	 *
	 * @param {String} jobId Job ID
	 * @param {Object} result Result of process.
	 *
	 * @returns {Promise<void>}
	 */
	static async onJobSucceeded( jobId, result ) {

		const queueHealth = await this.queue.checkHealth();
		const totalJobs = parseInt( queueHealth.waiting + queueHealth.active + queueHealth.delayed + queueHealth.newestJob );

		if ( 0 >= totalJobs ) {
			exit( 1 );
		}
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
		Logger.info( `Queue: %s | Job: %s started.`, this.queueName, job.id );

		const siteInstance = new WordPressSite();

		if ( false === siteInstance ) {
			Logger.debug( `We don't have any available site. Please try after some site.` );
			done( 'fail' );
			return;
		}

		let result = {};
		let response = {};
		try {
			result = await siteInstance.runTest( job.data ) || {};

			const extensionVersionSlug = job.data.extension_version_slug || '';

			if ( ! _.isEmpty( extensionVersionSlug ) ) {
				const item = {
					extension_version_slug: extensionVersionSlug,
					has_synthetic_data: true,
				};

				try {
					const updateQuery = await ExtensionVersionModel.getUpdateQuery( item );
					await BigQuery.query( updateQuery );
					response = { status: 'ok' };
				} catch ( exception ) {
					response = { status: 'fail' };
				}

			}

		} catch ( exception ) {
			console.error( exception );
		}

		return { status: 'ok', data: { result: result, response: response } };
	}
}

module.exports = SyntheticDataController;