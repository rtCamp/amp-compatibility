'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

const { validateAll } = use( 'Validator' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class QueueController {

	/**
	 * Http handler for update job.
	 *
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Object} ctx.params
	 *
	 * @return {Promise<{data: *, status: string}|{message: string, status: string}>}
	 */
	async update( { request, params } ) {

		const postData = request.post();
		const queueName = params.queue || 'request-queue';
		let queue = false;
		let queueObject = false;
		let message = '';

		switch ( queueName ) {
			case 'synthetic-queue':
				queue = SyntheticDataQueueController.queue;
				queueObject = SyntheticDataQueueController;
				break;
			case 'adhoc-synthetic-queue':
				queue = AdhocSyntheticDataQueueController.queue;
				queueObject = AdhocSyntheticDataQueueController;
				break;
			case 'request-queue':
			default:
				queue = RequestQueueController.queue;
				queueObject = RequestQueueController;
				break;
		}

		const rules = {
			action: 'required|in:retry,remove',
			jobID: 'required|string',
		};

		const messages = {
			'action': 'Please provide valid action.',
			'jobID.required': 'Please provide Job ID.',
		};

		const validation = await validateAll( postData, rules, messages );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		switch ( postData.action ) {
			case 'retry':
				const job = await queueObject.queue.getJob( postData.jobID );

				const jobData = _.clone( job.data );
				await queueObject.queue.removeJob( postData.jobID );
				await queueObject.createJob( jobData );

				message = `Job ${ postData.jobID } has been added again in the queue`;
				break;
			case 'remove':
				await queueObject.queue.removeJob( postData.jobID );
				message = `Job ${ postData.jobID } has been removed from queue`;
				break;
		}

		return {
			status: 'ok',
			message: message,
		};

	}
}

module.exports = QueueController;
