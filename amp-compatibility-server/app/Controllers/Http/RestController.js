'use strict';

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const AmpRequestValidator = use( 'App/Validators/AmpRequest' );

// Models
const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );

// Helpers
const Logger = use( 'Logger' );

// Utilities
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

		let uuid = await SiteRequestModel.getUUID();
		uuid = `ampwp-${ uuid }`;

		const item = {
			site_request_id: uuid,
			site_url: siteUrl,
		};

		const response = await SiteRequestModel.saveMany( [ item ], {
			useStream: false,
			allowUpdate: false,
		} );

		let insertCount = response.inserted.count || 0;
		insertCount = parseInt( insertCount );

		if ( 1 !== insertCount ) {
			return {
				status: 'fail',
				data: {
					message: 'Fail to generate UUID',
				},
			};
		}

		requestData.uuid = uuid;

		await RequestQueueController.createJob( requestData );

		return {
			status: 'ok',
			data: {
				uuid: uuid,
			},
		};
	}

}

module.exports = RestController;
