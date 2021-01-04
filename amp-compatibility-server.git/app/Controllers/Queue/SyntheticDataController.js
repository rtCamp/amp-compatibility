'use strict';

const Base = use( 'App/Controllers/Queue/Base' );
const Logger = use( 'Logger' );

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
	 * Handler to process the job.
	 *
	 * @param {Object} job Job to process.
	 * @param {Function} done Callback function.
	 *
	 * @returns {*}
	 */
	static async processJob( job, done ) {
		Logger.info( `Queue: %s | Job: %s started.`, this.queue, job.id );

		return { status: 'ok' };
	}
}

module.exports = SyntheticDataController;