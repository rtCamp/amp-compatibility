'use strict';

const SyntheticDataController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticJobModel = use( 'App/Models/AdhocSyntheticJob' );
const WordPressSite = use( 'App/Controllers/Sites/WordPressSite' );
const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const Storage = use( 'Storage' );

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
		return 'adhoc_synthetic';
	}

	/**
	 * Database model for queue;
	 *
	 * @return {*}
	 */
	static get databaseModel() {
		return AdhocSyntheticJobModel;
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
		this.site = job.data.domain || '';
		Logger.info( ' Site: %s | Job ID: %s started.', this.site, job.id );

		job.options._logs = job.options._logs || {};

		const currentTry = ( parseInt( this.retries ) - parseInt( job.options.retries ) );
		const logFileSuffix = ( currentTry ) ? '-retry-' + currentTry : '';
		const logFilePath = `${ Utility.logPath() }/adhoc-synthetic-data/${ this.site }${ logFileSuffix }.log`;

		const siteInstance = new WordPressSite();
		let storageLogFile = '';
		let result = '';
		let response = {};

		let jobData = _.clone( job.data );
		jobData = _.defaults( jobData, {
			ampSource: 'wporg',
			logFile: logFilePath,
		} );

		try {
			result = await siteInstance.runTest( jobData ) || {};
			result = result.stdout || '';

			if ( FileSystem.isExists( logFilePath ) ) {
				storageLogFile = await Storage.uploadFile( logFilePath );
			}
		} catch ( exception ) {
			console.error( exception );

			/**
			 * Unexpected error came while running the job.
			 */
			job.options._logs[ currentTry ] = {
				status: 'fail',
				message: 'Error during running the test.',
			};

			throw `Try ${ currentTry } : Error during running the test.`;
		}

		/**
		 * Check if job was able to send AMP data or not.
		 */
		if ( -1 === result.toString().indexOf( '"status":"ok"' ) ) {

			job.options._logs[ currentTry ] = {
				status: 'fail',
				message: 'Fail to send AMP data.',
				logFile: storageLogFile,
			};

			throw `Try ${ currentTry } : Fail to send AMP data.`;
		}

		job.reportProgress( 100 );
		Logger.info( ' Site: %s | Job ID: %s completed.', this.site, job.id );

		/**
		 * Job Completed.
		 */
		job.options._logs[ currentTry ] = {
			status: 'ok',
			message: 'Completed',
			logFile: storageLogFile,
		};

		return { status: 'ok', data: { result: result, response: response } };
	}
}

module.exports = AdhocSyntheticDataController;