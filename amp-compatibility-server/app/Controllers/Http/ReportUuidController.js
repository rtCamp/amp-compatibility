'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const BigQuery = use( 'App/BigQuery' );
const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQueryUrlErrorRelationship' );

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

		if ( ! siteRequest ) {
			return view.render( 'dashboard/reports/uuid/not-found' );
		}

		const rawData = siteRequest.raw_data.trim();
		const requestData = JSON.parse( rawData );
		const allSiteInfo = requestData.site_info || {};
		const errorLog = siteRequest.error_log || '';

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

		const pluginTableArgs = await this.preparePluginTableArgs( requestData.plugins );

		const urlTableArgs = {
			items: requestData.urls,
			valueCallback: ( key, value ) => {
				value = value ? value : '-';

				switch ( key ) {
					case 'url':
						value = `<a href="${ value }" target="_blank" title="${ value }">${ value }</a>`;
						break;
					default:
						value = `<div class="text-center">${ value }</div>`;
						break;
				}

				return value;
			},
		};

		return view.render( 'dashboard/reports/uuid/show', {
			uuid,
			infoBoxList,
			pluginTableArgs,
			urlTableArgs,
			errorLog
		} );
	}

	/**
	 * To prepare args for plugin table.
	 *
	 * @param {Object} plugins List of plugins.
	 *
	 * @return {Promise<{valueCallback: function(*, *=): string, items: []}>}
	 */
	async preparePluginTableArgs( plugins ) {

		const preparedList = {};

		for ( const index in plugins ) {

			const plugin = plugins[ index ];
			const extensionVersionSlug = ExtensionVersionModel.getPrimaryValue( {
				type: 'plugin',
				slug: plugin.slug,
				version: plugin.version,
			} );

			preparedList[ extensionVersionSlug ] = plugin;
		}

		const extensionVersionSlugs = _.keys( preparedList );
		const preparedExtensionVersionSlugs = _.map( extensionVersionSlugs, ExtensionVersionModel._prepareValueForDB );

		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const errorSourceTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ UrlErrorRelationshipModel.table }` + '`';

		let query = '';
		let queryObject = {
			select: 'SELECT extension_versions.extension_version_slug, extensions.name, extension_versions.slug, extension_versions.version, extensions.latest_version, count( DISTINCT url_error_relationships.error_slug ) AS error_count, extension_versions.is_verified, extension_versions.has_synthetic_data',
			from: `FROM ${ extensionVersionTable } AS extension_versions ` +
				  `LEFT JOIN ${ extensionTable } AS extensions ON extension_versions.extension_slug = extensions.extension_slug ` +
				  `LEFT JOIN ${ errorSourceTable } AS error_sources ON extension_versions.extension_version_slug = error_sources.extension_version_slug ` +
				  `LEFT JOIN ${ urlErrorRelationshipTable } AS url_error_relationships ON url_error_relationships.error_source_slug = error_sources.error_source_slug `,
			where: `WHERE extension_versions.extension_version_slug IN ( ${ preparedExtensionVersionSlugs.join( ', ' ) } )`,
			groupby: 'GROUP BY extension_versions.extension_version_slug, extension_versions.slug, extensions.name, extension_versions.version, extension_versions.type, extensions.active_installs, extension_versions.is_verified, extensions.latest_version, extension_versions.has_synthetic_data',
		};

		for ( const index in queryObject ) {
			query += `\n ${ queryObject[ index ] }`;
		}

		const results = await BigQuery.query( query );
		const preparedPluginList = [];

		for ( const index in results ) {
			const item = results[ index ];
			const extensionVersionSlug = item.extension_version_slug;

			const preparedItem = _.defaults( item, preparedList[ extensionVersionSlug ] );
			preparedPluginList.push( {
				name: preparedItem.name,
				slug: preparedItem.slug,
				version: {
					version: preparedItem.version,
					latest_version: preparedItem.latest_version || false,
				},
				error_count: preparedItem.error_count || 0,
				has_synthetic_data: preparedItem.has_synthetic_data || false,
				is_verified: !! preparedItem.is_verified,
			} );

		}

		const pluginTableArgs = {
			items: preparedPluginList,
			valueCallback: ( key, value ) => {

				switch ( key ) {
					case 'version':

						if ( value.latest_version ) {
							if ( value.version === value.latest_version ) {
								value = `<span class="text-success" title="Up to date with latest version.">${ value.version }</span>`;

							} else {
								value = `<span class="text-danger" title="Plugin is not up to date with latest version.">${ value.version }</span> <small>(Latest version: ${ value.latest_version })</small>`;
							}

						} else {
							value = `<span class="text-warning" title="Latest version info not available.">${ value.version }</span>`;
						}

						break;
					case 'error_count':
						value = `<span class="text-center">${ value ? value : '-' }</span>`;
						break;
					case 'has_synthetic_data':
					case 'is_verified':
						if ( value ) {
							value = `<span class="text-success">Yes</span>`;
						} else {
							value = `<span class="text-danger">No</span>`;
						}
						break;
					default:
						break;
				}

				return value;
			},
		};

		return pluginTableArgs;
	}
}

module.exports = ReportUuidController;
