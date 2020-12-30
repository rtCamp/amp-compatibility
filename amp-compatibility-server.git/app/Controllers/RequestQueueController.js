'use strict';

const Queue = use( 'Bee/Queue' );
const _ = require( 'underscore' );

/**
 * Helper to manage request queue.
 */
class RequestQueueController {

	/**
	 * Queue name.
	 *
	 * @returns {string} Queue name
	 */
	static get queueName() {
		return 'request_queue_1';
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
	 * To get request queue object.
	 *
	 * @returns {*} Object of queue.
	 */
	static get queue() {
		return Queue.get( this.queueName );
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

		return await this.queue.createJob( data ).save();
	}

	/**
	 * To start worker process.
	 *
	 * @returns {Queue}
	 */
	static startWorker() {

		return this.queue.process( this.concurrency, this.processJob );
	}

	/**
	 * Handler to process the job.
	 *
	 * @param {Object} job Job to process.
	 * @param {Function} done Callback function.
	 *
	 * @returns {*}
	 */
	static processJob( job, done ) {
		console.log( `Processing job ${ job.id }`, job );
		return done( null, null );
	}

}

module.exports = RequestQueueController;
