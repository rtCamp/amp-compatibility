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

		const siteUrl = requestData.site_url || '';
		let summarizedData = _.clone( requestData );
		summarizedData = await this.summarizeSiteRequest( summarizedData );

		let uuid = Utility.generateUUID( requestData );
		uuid = `ampwp-${ uuid }`;

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

		let response = false;
		const transaction = await Database.beginTransaction();

		try {

			requestData.error_log = requestData.error_log || {};

			let errorLog = requestData.error_log.contents || '';
			errorLog = errorLog.replace( /'/g, '`' );
			errorLog = errorLog.split( "\n" );
			errorLog = JSON.stringify( errorLog );

			const item = {
				site_request_id: uuid,
				site_url: siteUrl,
				raw_data: JSON.stringify( summarizedData ),
				error_log: errorLog,
			};

			await Database.beginTransaction();

			response = await SiteRequestModel.save( item, transaction );

			requestData.uuid = uuid;
			await RequestQueueController.createJob( requestData );

			// Commit the transaction.
			await transaction.commit();

		} catch ( exception ) {

			// Rollback the transaction.
			await transaction.rollback();

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

	/**
	 * To summarize site request data to store in raw format
	 *
	 * @param {Object} requestData Request data.
	 *
	 * @return {Promise<{site_url: *, site_info: *}>}
	 */
	async summarizeSiteRequest( requestData ) {

		const summarizedData = {
			site_url: requestData.site_url,
			site_info: _.clone( requestData.site_info ),
		};

		summarizedData.wp_active_theme = {
			name: requestData.site_info.wp_active_theme.name,
			slug: requestData.site_info.wp_active_theme.slug,
			version: requestData.site_info.wp_active_theme.version,
		};

		delete ( summarizedData.site_info.wp_active_theme );

		/**
		 * Plugin summary.
		 */
		summarizedData.plugins = [];

		for ( const index in requestData.plugins ) {
			const plugin = requestData.plugins[ index ];

			summarizedData.plugins.push( {
				name: plugin.name,
				slug: plugin.slug,
				version: plugin.version,
				is_suppressed: plugin.is_suppressed,
			} );

		}

		/**
		 * Validated URL Summary.
		 */
		summarizedData.errorCount = _.size( requestData.errors ) || 0;
		summarizedData.errorSourceCount = _.size( requestData.error_sources ) || 0;
		summarizedData.urls = _.clone( requestData.urls );

		return summarizedData;
	}

}

module.exports = RestController;
