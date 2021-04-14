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
			delete ( items[ index ].raw_data );
			delete ( items[ index ].error_log );
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

	async show( { request, response, view, params } ) {

		const uuid = params.uuid;
		const siteRequest = await SiteRequestModel.getRow( uuid );

		const rawData = siteRequest.raw_data.trim();
		const requestData = JSON.parse( rawData );
		const allSiteInfo = requestData.site_info || {};

		const requestInfo = {
			uuid: uuid,
			site_URL: siteRequest.site_url,
			status: siteRequest.status,
			urlCounts: 0,
			errorCount: 0,
			requestDate: siteRequest.created_at.value,
		};

		const siteInfo = {
			site_url: siteRequest.site_url,
			site_title: allSiteInfo.site_title,
			php_version: allSiteInfo.php_version,
			mysql_version: allSiteInfo.mysql_version,
			wp_version: allSiteInfo.wp_version,
			wp_language: allSiteInfo.wp_language,
		};

		const siteHealth = {
			wp_https_status: allSiteInfo.wp_https_status,
			object_cache_status: allSiteInfo.object_cache_status,
			libxml_version: allSiteInfo.libxml_version,
			is_defined_curl_multi: allSiteInfo.is_defined_curl_multi,
			stylesheet_transient_caching: allSiteInfo.stylesheet_transient_caching,
			loopback_requests: allSiteInfo.loopback_requests,
		};

		const ampSettings = {
			amp_mode: allSiteInfo.amp_mode,
			amp_version: allSiteInfo.amp_version,
			amp_plugin_configured: allSiteInfo.amp_plugin_configured,
			amp_all_templates_supported: allSiteInfo.amp_all_templates_supported,
			amp_supported_post_types: allSiteInfo.amp_supported_post_types,
			amp_supported_templates: allSiteInfo.amp_supported_templates,
			amp_mobile_redirect: allSiteInfo.amp_mobile_redirect,
			amp_reader_theme: allSiteInfo.amp_reader_theme,
		};

		const infoBoxList = {
			requestInfo: {
				title: 'Request Info',
				items: requestInfo,
				valueCallback: ( key, value ) => {

				},
			},
			siteInfo: {
				title: 'Site Info',
				items: siteInfo,
			},
			siteHealth: {
				title: 'Site Health',
				items: siteHealth,
			},
			ampSettings: {
				title: 'AMP Settings',
				items: ampSettings,
			},
		};

		const pluginTableArgs = {
			items: requestData.plugins,
		};

		const urlTableArgs = {
			items: requestData.urls,
		};

		return view.render( 'dashboard/reports/uuid/show', {
			uuid,
			infoBoxList,
			pluginTableArgs,
			urlTableArgs,
		} );
	}

}

module.exports = ReportUuidController;
