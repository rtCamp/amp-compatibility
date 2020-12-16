'use strict';

class RestApiV1Controller {

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

		console.log( request.all() );

		return { status: 'ok' };
	}
}

module.exports = RestApiV1Controller;
