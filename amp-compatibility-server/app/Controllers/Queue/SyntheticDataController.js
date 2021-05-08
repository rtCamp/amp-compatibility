'use strict';

const Base = use( 'App/Controllers/Queue/Base' );
const WordPressSite = use( 'App/Controllers/Sites/WordPressSite' );
const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const Storage = use( 'Storage' );

const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const SyntheticJobModel = use( 'App/Models/SyntheticJob' );

const { exit } = require( 'process' );
const _ = require( 'underscore' );
const os = require( 'os' );

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
		return 'synthetic';
	}

	static get concurrency() {
		return parseInt( os.cpus().length ) * 2;
	}

	/**
	 * How many times the job should be automatically retried in case of failure.
	 *
	 * @returns {int}
	 */
	static get retries() {
		return 2;
	}

	/**
	 * Database model for queue;
	 *
	 * @return {*}
	 */
	static get databaseModel() {
		return SyntheticJobModel;
	}

	/**
	 * To create database record of job.
	 *
	 * @private
	 *
	 * @param {Object} data Job data
	 * @param {string} jobID Job ID.
	 *
	 * @return {Promise<void>}
	 */
	static async _createDBRecord( data, jobID ) {

		if ( ! this.databaseModel ) {
			return;
		}

		const domain = data.domain || '';

		await this.databaseModel.create( {
			uuid: jobID,
			domain: domain,
			data: JSON.stringify( data ),
		} );

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
	 * To start worker process.
	 *
	 * @returns {Queue}
	 */
	static async startWorker( options ) {

		let concurrency = parseInt( options.concurrency || this.concurrency );

		if ( ! _.isNumber( concurrency ) || concurrency > this.concurrency ) {
			Logger.debug( 'Changing concurrency to: %s instead of previous value: %s', this.concurrency, concurrency );
			options.concurrency = this.concurrency;
		}

		const startWorker = Base.startWorker.bind( this );

		return await startWorker( options );
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
	 *
	 * @returns {*}
	 */
	static async processJob( job ) {
		this.site = job.data.domain || '';
		Logger.info( ' Site: %s | Job ID: %s started.', this.site, job.id );

		job.options._logs = job.options._logs || {};

		const date = Utility.getCurrentDate().replace( / |:/g, '-' );
		const currentTry = ( parseInt( this.retries ) - parseInt( job.options.retries ) );
		const logFileSuffix = ( currentTry ) ? '-retry-' + currentTry : '';
		const logFilePath = `${ Utility.logPath() }/synthetic-data/${ date }/${ this.site }${ logFileSuffix }.log`;

		const siteInstance = new WordPressSite();
		let storageLogFile = '';
		let result = '';
		let response = {};

		let jobData = _.clone( job.data );
		jobData = _.defaults( jobData, {
			logFile: logFilePath,
		} );

		job.reportProgress( 10 );

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

		job.reportProgress( 90 );

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

		const item = {
			extension_version_slug: this.site,
			has_synthetic_data: true,
		};

		try {
			response = await ExtensionVersionModel.save( item );
		} catch ( exception ) {
			console.error( exception );
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

module.exports = SyntheticDataController;