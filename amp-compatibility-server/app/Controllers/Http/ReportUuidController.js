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

		const infoBoxList = {
			requestInfo: {
				title: 'Request Info',
				items: {
					UUID: uuid,
					site_URL: siteRequest.site_url,
					status: siteRequest.status,
					urlCounts: 0,
					errorCount: 0,
					requestDate: siteRequest.created_at.value,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'UUID':
							value = `<pre class="m-0">${ value }</pre>`;
							break;
						case 'site_URL':
							value = `<a href="${ value }" target="_blank" title="${ value }">${ value }</a>`;
							break;
						case 'requestDate':
							value = `<time datetime="${ value.replace( 'T', ' ' ) }">${ value.replace( 'T', ' ' ) }</time>`;
							break;
					}
					return value;
				},
			},
			siteInfo: {
				title: 'Site Info',
				items: {
					site_URL: siteRequest.site_url,
					site_title: allSiteInfo.site_title,
					PHP_version: allSiteInfo.php_version,
					MySQL_version: allSiteInfo.mysql_version,
					WordPress_version: allSiteInfo.wp_version,
					WordPress_language: allSiteInfo.wp_language,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'site_URL':
							value = `<a href="${ value }" target="_blank" title="${ value }">${ value }</a>`;
							break;
					}
					return value;
				},
			},
			siteHealth: {
				title: 'Site Health',
				items: {
					https_status: allSiteInfo.wp_https_status,
					object_cache_status: allSiteInfo.object_cache_status,
					libxml_version: allSiteInfo.libxml_version,
					is_defined_curl_multi: allSiteInfo.is_defined_curl_multi,
					stylesheet_transient_caching: allSiteInfo.stylesheet_transient_caching,
					loopback_requests: allSiteInfo.loopback_requests,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'https_status':
						case 'object_cache_status':
						case 'is_defined_curl_multi':
							value = parseInt( value ) ? `<span class="text-success">Yes</span>` : `<span class="text-danger">No</span>`;
							break;
					}
					return value;
				},
			},
			ampSettings: {
				title: 'AMP Settings',
				items: {
					AMP_mode: allSiteInfo.amp_mode,
					AMP_version: allSiteInfo.amp_version,
					AMP_plugin_configured: allSiteInfo.amp_plugin_configured,
					AMP_all_templates_supported: allSiteInfo.amp_all_templates_supported,
					AMP_supported_post_types: allSiteInfo.amp_supported_post_types,
					AMP_supported_templates: allSiteInfo.amp_supported_templates,
					AMP_mobile_redirect: allSiteInfo.amp_mobile_redirect,
					AMP_reader_theme: allSiteInfo.amp_reader_theme,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'AMP_plugin_configured':
						case 'AMP_all_templates_supported':
						case 'AMP_mobile_redirect':
							value = parseInt( value ) ? `<span class="text-success">Yes</span>` : `<span class="text-danger">No</span>`;
							break;
						case 'AMP_supported_post_types':

							const postTypes = value.map( ( postType ) => {
								return `<li class="list-group-item p-0 border-0 bg-transparent">${ postType }</li>`;
							} );

							value = '<ul class="list-group list-sm list-group-flush mt-0 mb-0">' + postTypes.join( '' ) + '</ul>';


							break;
					}
					return value;
				},
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
