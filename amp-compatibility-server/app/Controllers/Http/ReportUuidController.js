'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );

const _ = require( 'underscore' );

class ReportUuidController {

	/**
	 * To List All UUIDs.
	 *
	 * @param {object} ctx
	 * @param {View} view ctx.view
	 * @param {Request} request ctx.request
	 * @param {Response} response ctx.response
	 * @param {object} params ctx.params
	 *
	 * @return {Promise<Route|String|*>}
	 */
	async index( { request, response, view, params } ) {

		params = _.defaults( params, {
			paged: 1,
			perPage: 50,
			s: request.input( 's' ) || '',
			searchFields: [
				'site_request_id',
				'site_url',
			],
			orderby: {
				created_at: 'DESC',
			},
		} );

		const items = await SiteRequestModel.getRows( params );
		const total = await SiteRequestModel.getCount( params );

		for ( const index in items ) {
			items[ index ].created_at = items[ index ].created_at ? items[ index ].created_at.value : '';
			delete ( items[ index ].created_on );
		}

		const data = {
			tableArgs: {
				items: items,
				headings: {
					site_request_id: 'UUID',
				},
				valueCallback: ( key, value ) => {

					if ( 'site_request_id' === key ) {
						value = `<a href="/admin/report/uuid/${ value }">${ value }</a>`;
					}

					return value;
				},
			},
			pagination: {
				baseUrl: `/admin/report/uuid`,
				total: total,
				perPage: params.perPage,
				currentPage: params.paged,
			},
			searchString: params.s || '',
		};

		return view.render( 'dashboard/reports/uuid/list', data );
	}

	async show( { request, response, view } ) {

		return view.render( 'dashboard/reports/uuid/show' );
	}

}

module.exports = ReportUuidController;
