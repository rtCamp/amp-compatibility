'use strict';

const _ = require( 'underscore' );
const RequestQueueController = use( 'App/Controllers/RequestQueueController' );

class RestController {

	/**
	 * API endpoint callback.
	 *
	 * @method GET
	 *
	 * @return object Response data.
	 */
	index() {
		return { status: 'ok' };
	}

	/**
	 * API endpoint callback.
	 *
	 * @method POST
	 *
	 * @return object Response data.
	 */
	async store( { request } ) {

		const requestData = request.post();

		if ( _.isEmpty( requestData ) ) {
			return { status: 'fail' };
		}

		await RequestQueueController.createJob( requestData );

		return { status: 'ok' };
	}
}

module.exports = RestController;
