'use strict';

const Queue = use( 'Bee/Queue' );
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
		this.processJob = this.processJob.bind( this );

		this.queue.on( 'job progress', ( jobId, progress ) => {
			console.log( `Job ${ jobId } reported progress: ${ progress }%` );
		} );

		return this.queue.process( this.concurrency, this.processJob );
	}

}

module.exports = Base;
