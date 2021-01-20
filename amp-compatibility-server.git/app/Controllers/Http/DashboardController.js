'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const SyntheticDataQueueAdhocController = use( 'App/Controllers/Queue/SyntheticDataAdhocController' );

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
			SyntheticDataQueueAdhocController,
		];

		for ( const index in queueControllers ) {
			data.queues.push( {
				name: queueControllers[ index ].queueName,
				health: await queueControllers[ index ].queue.checkHealth(),
			} );
		}

		return view.render( 'dashboard/index', data );
	}

	requestQueue() {
	}

	syntheticQueue() {
	}

	adhocSyntheticQueue() {
	}

	addAdhocSyntheticQueue( { view } ) {

		return view.render( 'dashboard/add-adhoc-synthetic' );
	}

	async addAdhocSyntheticQueueFetch( { view, request, response, session } ) {

		const data = {};
		const theme = request.input( 'theme' );
		const plugins = _.filter( request.input( 'plugins' ), ( value ) => {
			return ( ! _.isEmpty( value ) );
		} );

		if ( _.isEmpty( theme ) && _.isEmpty( plugins ) ) {
			data.errorNotification = 'Please provide either theme or plugins.';
			return view.render( 'dashboard/add-adhoc-synthetic', data );
		}

		const domain = 'adhoc-synthetic-data-' + Utility.getCurrentDateTime().replace( / |:/g, '-' );
		const job = {
			domain: domain,
			plugins: plugins.join( ',' ),
		};

		if ( ! _.isEmpty( theme ) ) {
			job.theme = theme;
		}

		await SyntheticDataQueueAdhocController.createJob( job );

		data.successNotification = `Job has been added with domain "${ domain }.local"`;

		return view.render( 'dashboard/add-adhoc-synthetic', data );
	}
}

module.exports = DashboardController
