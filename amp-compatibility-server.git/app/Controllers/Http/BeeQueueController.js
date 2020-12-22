'use strict';

const _ = require( 'underscore' );
const Queue = use( 'Bee/Queue' );
const Config = use( 'Config' );

class BeeQueueController {

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
	store( { request } ) {

		const requestData = request.all();
		if ( _.isEmpty( requestData ) ) {
			return { status: 'fail' };
		}

		Queue
			.get( Config.get( 'queue.name' ) )
			.createJob( requestData )
			.save();

		return { status: 'ok' };
	}
}

module.exports = BeeQueueController;
