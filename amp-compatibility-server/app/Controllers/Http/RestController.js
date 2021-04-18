'use strict';

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const AmpRequestValidator = use( 'App/Validators/AmpRequest' );

// Models
const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );
const GlobalCache = use( 'App/Helpers/GlobalCache' );
const Utility = use( 'App/Helpers/Utility' );

// Helpers
const Logger = use( 'Logger' );
const BigQuery = use( 'App/BigQuery' );

// Utilities
const _ = require( 'underscore' );

// For generating UUIDs
const uuidv5 = require( 'uuid/v5' );

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

		// @Todo: Move namespace to environment file.
		// This is just a random UUID, we're using as namespace
		const namespace = 'a70e42a6-9744-42f2-98ce-2fc670bc3391';

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
		const summarizedData = await this.summarizeSiteRequest( requestData );
		let uuid = uuidv5( JSON.stringify( requestData ), namespace );
		uuid = `ampwp-${ uuid }`;

		const existingRequest = await GlobalCache.get( uuid, 'site_requests' );

		if ( existingRequest ) {
			return {
				status: 'ok',
				data: {
					uuid: uuid,
					message: 'UUID is already exist.',
				},
			};
		}

		requestData.error_log = requestData.error_log || {};

		Logger.info( 'Site: %s | UUID: %s', siteUrl, uuid );

		const item = {
			site_request_id: uuid,
			site_url: siteUrl,
			status: 'pending',
			created_at: Utility.getCurrentDateTime(),
			raw_data: JSON.stringify( summarizedData ),
			error_log: requestData.error_log.contents || '',
		};

		const insertQuery = this.getInsertQuery( item );
		const response = await BigQuery.query( insertQuery );

		if ( false === response ) {
			return {
				status: 'fail',
				data: {
					message: 'Fail to generate UUID',
				},
			};
		}

		requestData.uuid = uuid;

		await RequestQueueController.createJob( requestData );

		await GlobalCache.set( uuid, 'pending', 'site_requests' );

		return {
			status: 'ok',
			data: {
				uuid: uuid,
			},
		};
	}

	/**
	 * To Get Insert query for site request.
	 *
	 * @param {Object} item Item object.
	 *
	 * @return {string} Insert query.
	 */
	getInsertQuery( item ) {

		const rawData = item.raw_data;
		let errorLog = item.error_log || '';

		delete ( item.raw_data );
		delete ( item.error_log );

		errorLog = errorLog.replace( /'/g, '`' );
		errorLog = errorLog.split( "\n" );
		errorLog = JSON.stringify(errorLog);

		const table = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ SiteRequestModel.table }` + '`';
		const preparedItem = SiteRequestModel._prepareItemForDB( item );
		const keys = Object.keys( preparedItem ).join( ', ' );
		const values = Object.values( preparedItem ).join( ', ' );
		const query = `INSERT INTO ${ table } ( ${ keys }, raw_data, error_log ) VALUES ( ${ values }, '${ rawData }', '${ errorLog }' );`;

		return query;
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
			site_info: _.clone(requestData.site_info),
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
			} );

		}

		/**
		 * Validated URL Summary.
		 */
		summarizedData.urls = [];

		for ( const index in requestData.urls ) {

			const url = requestData.urls[ index ];

			url.errorsCount = _.size( url.errors ) || 0;

			delete ( url.errors );

			summarizedData.urls.push( url );
		}

		return summarizedData;
	}

}

module.exports = RestController;
