'use strict';

const _ = require( 'underscore' );
const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const AmpRequestValidator = use( 'App/Validators/AmpRequest' );
const Logger = use( 'Logger' );

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

		const validation = await AmpRequestValidator.validateAll( requestData );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		// @Todo: To use stream method. We need to make sure that same site don't request more then one time within 2 hours.
		const siteUrl = requestData.site_url || '';
		Logger.info( 'Site: %s', siteUrl );

		await RequestQueueController.createJob( requestData );

		return { status: 'ok' };
	}
}

module.exports = RestController;
