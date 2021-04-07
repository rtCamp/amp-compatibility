'use strict';

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const AmpRequestValidator = use( 'App/Validators/AmpRequest' );

// Models
const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );

// Helpers
const Logger = use( 'Logger' );

// Utilities
const _ = require( 'underscore' );

// For generating UUIDs
const uuidv5 = require('uuid/v5');

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

		// @Todo: Move namespace to environment file.
		// This is just a random UUID, we're using as namespace
		const namespace = 'a70e42a6-9744-42f2-98ce-2fc670bc3391';
		let uuid = uuidv5( JSON.stringify( requestData ), namespace );
		uuid = `ampwp-${ uuid }`;

		const item = {
			site_request_id: uuid,
			site_url: siteUrl,
		};

		const response = await SiteRequestModel.saveMany( [ item ], {
			useStream: false,
			allowUpdate: false,
			skipCache: true,
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
