'use strict';

const Queue = use( 'Bee/Queue' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class Base {

	/**
	 * Queue name.
	 *
	 * @returns {string} Queue name
	 */
	static get queueName() {
		return '';
	}

	/**
	 * Number of concurrent job can run at a time.
	 *
	 * @returns {number}
	 */
	static get concurrency() {
		return 10;
	}

	/**
	 * How many times the job should be automatically retried in case of failure.
	 *
	 * @returns {number}
	 */
	static get retries() {
		return 3;
	}

	/**
	 * To get request queue object.
	 *
	 * @returns {*} Object of queue.
	 */
	static get queue() {
		return Queue.get( this.queueName );
	}

	/**
	 * To get jobs ID.
	 *
	 * @param {Object} jobData Job data.
	 *
	 * @returns {String} Job ID.
	 */
	static getJobID( jobData ) {
		return Utility.makeHash( jobData );
	}

	/**
	 * Get jobs from queue type.
	 *
	 * @param {String} type The queue type (failed, succeeded, active, waiting, delayed)
	 * @param {?Object=} page An object containing some of the following fields.
	 * @param {Number=} page.start Start of query range for waiting/active/delayed
	 *   queue types. Defaults to 0.
	 * @param {Number=} page.end End of query range for waiting/active/delayed
	 *   queue types. Defaults to 100.
	 * @param {Number=} page.size Number jobs to return for failed/succeeded (SET)
	 *   types. Defaults to 100.
	 *
	 * @return {Promise<Job[]>} Resolves to the jobs the function found.
	 */
	static async getJobs( type, page ) {
		return ( await this.queue.getJobs.apply( null, arguments ) );
	}

	/**
	 * To create job
	 *
	 * @param {Object} data
	 *
	 * @returns {boolean}
	 */
	static async createJob( data ) {

		if ( _.isEmpty( data ) || ! _.isObject( data ) ) {
			return false;
		}

		const jobId = await this.getJobID( data );

		return await this.queue.createJob( data ).retries( this.retries ).setId( jobId ).save();
	}

	/**
	 * Action before starting worker.
	 *
	 * @param {Object} options Options pass in startWorker.
	 *
	 * @returns {Promise<void>}
	 */
	static async beforeStartWorker( options ) {}

	/**
	 * To start worker process.
	 *
	 * @returns {Queue}
	 */
	static async startWorker( options ) {

		this.processJob = this.processJob.bind( this );

		await this.beforeStartWorker( options );

		let concurrency = parseInt( options.concurrency || this.concurrency );

		if ( ! _.isNumber( concurrency ) ) {
			concurrency = this.concurrency;
		}

		return this.queue.process( concurrency, this.processJob );
	}

}

module.exports = Base;
