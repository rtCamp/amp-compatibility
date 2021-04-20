'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ErrorModel = use( 'App/Models/BigQueryError' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

const Templates = use( 'App/Controllers/Templates' );
const Utility = use( 'App/Helpers/Utility' );
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

		const items = await SiteRequestModel.getRows( params, true );
		const total = await SiteRequestModel.getCount( params, true );

		for ( const index in items ) {
			items[ index ].created_at = items[ index ].created_at ? items[ index ].created_at.value : '';
			delete ( items[ index ].created_on );
			delete ( items[ index ].raw_data );
			delete ( items[ index ].error_log );
		}

		const data = {
			tableArgs: {
				items: _.toArray( items ),
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
		const siteRequest = await SiteRequestModel.getRow( uuid, true );

		if ( ! siteRequest ) {
			return view.render( 'dashboard/reports/uuid/not-found' );
		}

		const rawData = siteRequest.raw_data.trim();
		const requestData = JSON.parse( rawData );
		const allSiteInfo = requestData.site_info || {};


		requestData.urls = requestData.urls || [];

		let errorLog = siteRequest.error_log || '';

		try {
			errorLog = JSON.parse( errorLog );
			errorLog = errorLog.join( "\n" );
		} catch ( error ) {
			// Do nothing.
		}

		const infoBoxList = {
			requestInfo: {
				title: 'Request Info',
				items: {
					UUID: uuid,
					site_URL: siteRequest.site_url,
					status: siteRequest.status,
					URL_Counts: requestData.urls.length || 0,
					// errorCount: 0,
					request_Date: siteRequest.created_at.value,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'UUID':
							value = `<pre class="m-0">${ value }</pre>`;
							break;
						case 'site_URL':
							value = `<a href="${ value }" target="_blank" title="${ value }">${ value }</a>`;
							break;
						case 'request_Date':
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
		const urlTableArgs = await this.prepareValidateURLArgs( requestData.urls );

		return view.render( 'dashboard/reports/uuid/show', {
			uuid,
			infoBoxList,
			pluginTableArgs,
			urlTableArgs,
			errorLog,
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

		const preparedPluginList = {};
		const extensionSlugList = [];
		const extensionSlugVersionList = [];

		for ( const index in plugins ) {

			const plugin = plugins[ index ];

			const extensionSlug = ExtensionModel.getPrimaryValue( {
				type: 'plugin',
				slug: plugin.slug,
			} );

			const extensionVersionSlug = ExtensionVersionModel.getPrimaryValue( {
				type: 'plugin',
				slug: plugin.slug,
				version: plugin.version,
				is_suppressed: plugin.is_suppressed,
			} );

			extensionSlugList.push( extensionSlug );
			extensionSlugVersionList.push( extensionVersionSlug );

			preparedPluginList[ extensionVersionSlug ] = plugin;

		}

		const extensionData = await ExtensionModel.getRows( {
			whereClause: {
				extension_slug: extensionSlugList,
			},
		} );

		const extensionVersionData = await ExtensionVersionModel.getRowsWithErrorCount( extensionSlugVersionList );

		for ( const index in preparedPluginList ) {
			const plugin = preparedPluginList[ index ];
			const extensionVersionSlug = index;
			const extensionSlug = ExtensionModel.getPrimaryValue( {
				type: 'plugin',
				slug: preparedPluginList[ index ].slug,
			} );

			/**
			 * Set default values. If data is not available in BigQuery
			 */
			extensionVersionData[ extensionVersionSlug ] = _.defaults( extensionVersionData[ extensionVersionSlug ], plugin );
			extensionData[ extensionSlug ] = _.defaults( extensionData[ extensionSlug ], plugin );

			preparedPluginList[ index ] = {
				name: extensionData[ extensionSlug ].name,
				slug: {
					slug: extensionData[ extensionSlug ].slug,
					is_wporg: !! extensionData[ extensionSlug ].wporg,
				},
				version: {
					version: extensionVersionData[ index ].version || plugin.version,
					latest_version: extensionData[ extensionSlug ].latest_version || false,
				},
				error_count: {
					count: extensionVersionData[ index ].error_count || 0,
					has_synthetic_data: extensionVersionData[ index ].has_synthetic_data || false,
				},
				is_suppressed: preparedPluginList[ index ].is_suppressed,
				has_synthetic_data: extensionVersionData[ index ].has_synthetic_data || false,
				is_verified: !! extensionVersionData[ index ].is_verified,
			};
		}

		const pluginTableArgs = {
			items: _.toArray( preparedPluginList ),
			valueCallback: ( key, value ) => {

				switch ( key ) {

					case 'slug':
						if ( value.is_wporg ) {
							value = `<a href="https://wordpress.org/plugins/${ value.slug }" target="_blank" title="${ value.slug }">${ value.slug }</a>`;
						} else {
							value = value.slug;
						}

						break;
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

						if ( value.has_synthetic_data ) {
							value = `<span class="text-center">${ value.count }</span>`;
						} else {
							value = `<span class="text-center">${ value.count ? value.count : '-' }</span>`;
						}

						break;
					case 'has_synthetic_data':
					case 'is_verified':
						if ( value ) {
							value = `<span class="text-success">Yes</span>`;
						} else {
							value = `<span class="text-danger">No</span>`;
						}
						break;
					case 'is_suppressed':
						if ( value ) {
							value = `<span class="text-success">Yes</span> <small>(From ${ value })</small>`;
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

	/**
	 * To prepare args for validate URLs table.
	 *
	 * @param {array} urls List of array
	 *
	 * @return {Promise<{valueCallback: function(*, *): string, tableID: string, items: *, collapsible: {accordionClass: string, bodyCallback: function(*=): *}}>}
	 */
	async prepareValidateURLArgs( urls ) {

		/**
		 * Prepare all error and error source information.
		 */
		let errorData = {};
		let errorSourceData = {};

		for ( const index in urls ) {
			const errors = urls[ index ].errors || [];

			for ( const errorIndex in errors ) {
				const error = errors[ errorIndex ];
				const errorSources = error.sources || [];
				errorData[ error.error_slug ] = {};

				for ( const errorSourceIndex in errorSources ) {
					if ( errorSources[ errorSourceIndex ] ) {
						errorSourceData[ errorSources[ errorSourceIndex ] ] = {};
					}
				}
			}
		}

		errorData = await ErrorModel.getRows( _.keys( errorData ) );
		errorSourceData = await ErrorSourceModel.getRows( _.keys( errorSourceData ) );

		const urlTableArgs = {
			tableID: 'validateUrls',
			items: urls,
			collapsible: {
				accordionClass: 'validated-url',
				bodyCallback: ( validateUrl ) => {
					const tableArgs = this._prepareErrorTableArgs( validateUrl, errorData, errorSourceData );
					return Templates.renderComponent( 'table', tableArgs );
				},
			},
			valueCallback: ( key, value ) => {
				value = value ? value : '-';

				switch ( key ) {
					case 'url':
						value = `<a href="${ value }" target="_blank" title="${ value }">${ value }</a>`;
						break;
					case 'errors':
						value = value.length || 0;
					default:
						value = `<div class="text-center">${ value }</div>`;
						break;
				}

				return value;
			},
		};

		return urlTableArgs;
	}

	/**
	 * To prepare args for error table.
	 *
	 * @private
	 *
	 * @param {array} validateUrl List of validated URL
	 * @param {object} allErrorData List of error detail that occurs in Validated URL.
	 * @param {object} allErrorSourceData List of error source detail that occurs in Validated URL
	 *
	 * @return {{valueCallback: function(*, *=): string, tableID: string, items: *, collapsible: {accordionClass: string, bodyCallback: function(*=): *}}}
	 */
	_prepareErrorTableArgs( validateUrl, allErrorData, allErrorSourceData ) {

		const errors = validateUrl.errors || [];
		const errorData = [];

		for ( const index in errors ) {
			const errorSlug = errors[ index ].error_slug;
			const error = allErrorData[ errorSlug ] || {};

			errorData[ errorSlug ] = {
				error_slug: errorSlug,
				code: error.code,
				type: error.type,
				node_name: error.node_name,
				node_attributes: error.node_attributes,
				sources: errors[ index ].sources,
				raw_data: error.raw_data,
			};

		}

		let collapsible = {
			accordionClass: 'error-data',
			bodyCallback: ( errorDetail ) => {

				const tableArgs = this._prepareErrorSourceTableArgs( errorDetail, allErrorSourceData );
				return Templates.renderComponent( 'table', tableArgs );

			},
		};

		const tableArgs = {
			tableID: `error-${ Utility.makeHash( validateUrl.url ) }`,
			items: _.values( errorData ),
			collapsible: false,
			valueCallback: ( key, value ) => {
				value = value ? value : '-';

				switch ( key ) {
					case 'error_slug':
						value = `<abbr class="copy-to-clipboard" data-copy-text='${ value }'>${ value.slice( value.length - 10 ) }</abbr>`;
						break;
					case 'node_attributes':
						if ( value ) {
							value = Utility.maybeParseJSON( value );
							if ( _.isObject( value ) ) {
								value = `<pre class="json-data mh-100" style="max-width: 400px;">${ Utility.jsonPrettyPrint( value ) }</pre>`;
							} else {
								value = `<pre class="json-data mh-100" style="max-width: 400px;">${ value }</pre>`;
							}

						} else {
							value = `<div class="text-center">${ value }</div>`;
						}
						break;
					case 'raw_data':
						value = `<button class="btn btn-outline-primary btn-xs copy-to-clipboard" data-copy-text='${ value }'>Copy to clipboard</button>`;
						break;
					case 'sources':
						value = value.length || 0;
					default:
						value = `<div class="text-center">${ value }</div>`;
						break;
				}

				return value;
			},
		};

		return tableArgs;
	}

	/**
	 * To prepare args for error source table.
	 *
	 * @private
	 *
	 * @param {array} errorDetail List of errors.
	 * @param {object} allErrorSourceData List of error source detail that occurs in error.
	 *
	 * @return {{valueCallback: function(*, *=): string, tableID: string, items: *, collapsible: {accordionClass: string, bodyCallback: function(*=): *}}}
	 */
	_prepareErrorSourceTableArgs( errorDetail, allErrorSourceData ) {

		const sources = errorDetail.sources || [];
		const sourceData = {};

		for ( const index in sources ) {
			const errorSourceSlug = sources[ index ];
			const source = allErrorSourceData[ errorSourceSlug ] || {};

			sourceData[ errorSourceSlug ] = {
				error_source_slug: errorSourceSlug,
				extension_version_slug: source.extension_version_slug,
				//name: source.name,
				file: source.file,
				line: source.line,
				function: source.function,
				hook: source.hook,
				priority: source.priority,
				handle: source.handle,
				dependency_type: source.dependency_type,
				raw_data: source.raw_data,
			};
		}

		const tableArgs = {
			tableID: `error-source-${ errorDetail.error_slug }`,
			items: _.values( sourceData ),
			valueCallback: ( key, value ) => {
				value = value ? value : '-';

				switch ( key ) {
					case 'error_source_slug':
						value = `<abbr class="copy-to-clipboard" data-copy-text="${ value }">${ value.slice( value.length - 10 ) }</abbr>`;
						break;
					case 'file':
					case 'line':
					case 'function':
					case 'priority':
					case 'handle':
					case 'hook':
						value = `<small>${ value }</small>`;
						break;
					case 'raw_data':
						value = `<button class="btn btn-outline-primary btn-xs copy-to-clipboard" data-copy-text='${ value }'>Copy to clipboard</button>`;
						break;
				}

				return value;
			},
		};

		return tableArgs;
	}

}

module.exports = ReportUuidController;
