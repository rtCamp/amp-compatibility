'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class DashboardController {

	/**
	 * Request handle for admin dashboard.
	 *
	 * @param {object} ctx
	 * @param {View} ctx.view
	 *
	 * @return {Promise<*>}
	 */
	async index( { view } ) {

		const data = {
			queues: [],
		};

		const queueControllers = [
			RequestQueueController,
			SyntheticDataQueueController,
			AdhocSyntheticDataQueueController,
		];

		for ( const index in queueControllers ) {
			data.queues.push( {
				name: queueControllers[ index ].queueName,
				health: await queueControllers[ index ].queue.checkHealth(),
			} );
		}

		return view.render( 'dashboard/index', data );
	}

}

module.exports = DashboardController;

