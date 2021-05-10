'use strict';

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const AmpRequestValidator = use( 'App/Validators/AmpRequest' );

// Models
/** @typedef {import('../../Models/SiteRequest')} SiteRequest */
const SiteRequestModel = use( 'App/Models/SiteRequest' );

// Helpers
const Database = use( 'Database' );
const Utility = use( 'App/Helpers/Utility' );
const Logger = use( 'Logger' );
const _ = require( 'underscore' );

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

		let response = { status: 'fail' };
		const requestData = request.post();

		if ( _.isEmpty( requestData ) ) {
			return response;
		}

		const validation = await AmpRequestValidator.validateAll( requestData );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		const uuid = RequestQueueController.getJobID( requestData );
		const siteRequest = await SiteRequestModel.find( uuid );

		if ( siteRequest ) {
			return {
				status: 'ok',
				data: {
					uuid: uuid,
					message: 'UUID is already exist.',
				},
			};
		}

		try {
			response = await RequestQueueController.createJob( requestData );

		} catch ( exception ) {
			Logger.crit( 'Fail to store data.', exception );
		}

		if ( false === response ) {
			return {
				status: 'fail',
				data: {
					message: 'Fail to generate UUID',
				},
			};
		}

		return {
			status: 'ok',
			data: {
				uuid: uuid,
			},
		};
	}

}

module.exports = RestController;
