'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const SiteRequestModel = use( 'App/Models/SiteRequest' );
const ExtensionModel = use( 'App/Models/Extension' );
const ErrorModel = use( 'App/Models/Error' );
const ErrorSourceModel = use( 'App/Models/ErrorSource' );
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const SpreadSheet = use( 'SpreadSheet' );

const { validateAll } = use( 'Validator' );
const Templates = use( 'App/Controllers/Templates' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );
const compareVersions = require( 'compare-versions' );

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
			selectFields: [
				'uuid',
				'site_url',
				'status',
				'data',
				'created_at',
			],
			s: request.input( 's' ) || '',
			searchFields: [
				'uuid',
				'site_url',
			],
			orderby: {},
		} );

		const allowSortFields = [ 'status' ];
		const sortRequest = request.input( 'sort' );

		for ( const field in sortRequest ) {
			if ( allowSortFields.includes( field ) &&
			     [ 'asc', 'desc' ].includes( sortRequest[ field ].toLowerCase() )
			) {
				params.orderby[ field ] = sortRequest[ field ];
			}
		}

		params.orderby.created_at = 'DESC';

		if ( request.input( 'exclude_synthetic' ) ) {
			params.whereClause = {
				is_synthetic: 0,
			};
		}

		const { data, total } = await SiteRequestModel.getResult( params );

		const viewData = {
			tableArgs: {
				items: _.toArray( data ),
				headings: {
					uuid: 'UUID',
					site_url: 'Site URL',
				},
				sortableFields: {
					status: params.orderby.status || 'none',
				},
				valueCallback: ( key, value ) => {

					switch ( key ) {
						case 'uuid':
							value = value.trim();
							value = `<a href="/admin/report/uuid/${ value }">...${ value.slice( value.length - 13 ) }</a>`;
							break;
						case 'site_url':
							value = `<a href="/admin/report/site/${ value }">${ value.trim() }</a>`;
							break;
						case 'data':
							value = `<button class="btn btn-primary btn-xs copy-to-clipboard" data-copy-text='${ value }'>Copy</button>`;
							break;
						case 'created_at':
							const dateObject = new Date( value );
							const date = ( '0' + dateObject.getDate() ).slice( -2 );
							const month = ( '0' + ( dateObject.getMonth() + 1 ) ).slice( -2 );
							const year = dateObject.getFullYear();

							value = `<time datetime="${ value }" title="${ value }">${ year }-${ month }-${ date }</time>`;
							break;
					}

					return value;
				},
			},
			pagination: {
				baseUrl: `/admin/report`,
				total: total,
				perPage: params.perPage,
				currentPage: params.paged,
			},
			searchString: params.s || '',
		};

		return view.render( 'dashboard/reports/uuid/list', viewData );
	}

	/**
	 * Endpoint to export site request data in CSV format.
	 *
	 * @param {object} ctx
	 * @param {Request} request ctx.request
	 * @param {Response} response ctx.response
	 *
	 * @return {Promise<Route|String|*>}
	 */
	async export( { request, response } ) {

		const getData = request.get();

		/**
		 * Validation.
		 */
		const rules = {
			start_date: 'required|date',
			end_date: 'required|date',
			include_synthetic_data: 'boolean',
		};

		const messages = {
			'start_date': 'Please provide valid start date.',
			'end_date': 'Please provide valid end date.',
		};

		const validation = await validateAll( getData, rules, messages );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		getData.include_synthetic_data = ( '1' === getData.include_synthetic_data );

		let perPage = parseInt( getData.perPage ) || 20000;
		perPage = ( 0 < perPage && perPage <= 20000 ) ? perPage : 20000;

		const queryArgs = {
			paged: 1,
			perPage: perPage,
			selectFields: [
				'uuid',
				'site_url',
				'status',
				'data',
				'created_at',
			],
			whereBetween: {
				created_at: [
					getData.start_date,
					getData.end_date,
				],
			},
			orderby: {
				created_at: 'DESC',
			},
		};

		queryArgs.orderby.created_at = 'DESC';

		if ( ! getData.include_synthetic_data ) {
			queryArgs.whereClause = {
				is_synthetic: 0,
			};
		}

		const dbResponse = await SiteRequestModel.getResult( queryArgs );
		const items = _.toArray( dbResponse.data );
		const preparedItems = [];

		items.map( ( item ) => {
			item.data = Utility.maybeParseJSON( item.data.toString() );

			const preparedItem = {
				uuid: item.uuid,
				status: item.status,
				...item.data.site_info,
				theme: Utility.jsonPrettyPrint( item.data.wp_active_theme ),
				plugins: Utility.jsonPrettyPrint( item.data.plugins ),
				error_count: item.data.errorCount,
				error_source_count: item.data.errorSourceCount,
			};

			preparedItem.amp_supported_post_types = Utility.jsonPrettyPrint( preparedItem.amp_supported_post_types );
			preparedItem.amp_supported_templates = Utility.jsonPrettyPrint( preparedItem.amp_supported_templates );

			preparedItems.push( preparedItem );
		} );

		const spreadSheet = new SpreadSheet( response, 'csv' );

		const exportData = [
			_.keys( preparedItems[ 0 ] ),
			...( preparedItems.map( item => _.toArray( item ) ) ),
		];

		spreadSheet.addSheet( 'Site Requests', exportData );
		spreadSheet.download( `site-request-export-${ Utility.getCurrentDateTime().replace( / |:/g, '-' ) }` );

		return {
			status: 'ok',
			data: {
				total: dbResponse.total || 0,
				perPage: dbResponse.perPage || 0,
				page: dbResponse.page || 0,
				lastPage: dbResponse.lastPage || 0,
			},
		};
	}

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
	async show( { request, response, view, params } ) {

		const uuid = params.uuid;

		if ( ! uuid ) {
			return view.render( 'dashboard/reports/uuid/not-found' );
		}

		let siteRequest = await SiteRequestModel.getIfExists( { uuid: uuid } );

		if ( ! siteRequest ) {
			return view.render( 'dashboard/reports/uuid/not-found' );
		}

		siteRequest = siteRequest.toObject();

		const rawData = siteRequest.data.toString();
		const requestData = JSON.parse( rawData );
		const allSiteInfo = requestData.site_info || {};

		requestData.urls = requestData.urls || [];

		let errorLog = Utility.maybeParseJSON( siteRequest.error_log.toString() ) || '';

		if ( _.isString( errorLog ) ) {
			const regex = /","|\["|"\]/gm;
			errorLog = errorLog.replace( regex, "\n" );
		} else if ( _.isArray( errorLog ) ) {
			errorLog = errorLog.join( "\n" );
		}

		const infoBoxList = {
			requestInfo: {
				title: 'Request Info',
				items: {
					UUID: uuid,
					site_URL: siteRequest.site_url,
					status: siteRequest.status,
					URL_Counts: _.size( requestData.urls ) || 0,
					request_Date: siteRequest.created_at,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'UUID':
							value = `<pre class="m-0">${ value }</pre>`;
							break;
						case 'site_URL':
							value = `<a href="/admin/report/site/${ value }" target="_blank" title="${ value }">${ value }</a>`;
							break;
						case 'request_Date':
							value = `<time datetime="${ value }">${ value }</time>`;
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
						case 'AMP_supported_templates':

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

		const themeTableArgs = await this.prepareExtensionTableArgs( [ requestData.wp_active_theme ], 'theme' );
		const pluginTableArgs = await this.prepareExtensionTableArgs( requestData.plugins, 'plugin' );
		const urlTableArgs = await this.prepareValidateURLArgs( requestData.urls );

		return view.render( 'dashboard/reports/uuid/show', {
			uuid,
			infoBoxList,
			themeTableArgs,
			pluginTableArgs,
			urlTableArgs,
			errorLog,
		} );
	}

	/**
	 * To prepare args for extension table.
	 *
	 * @param {Object} extensions List of extension.
	 * @param {string} type Type of extension. ( plugin or theme ).
	 *
	 * @return {Promise<{valueCallback: function(*, *=): string, items: []}>}
	 */
	async prepareExtensionTableArgs( extensions, type = 'plugin' ) {

		if ( _.isEmpty( extensions ) || ! ( _.isArray( extensions ) || _.isObject( extensions ) ) ) {
			return {};
		}

		const preparedExtensionList = {};
		let extensionSlugList = [];
		const extensionSlugVersionList = [];

		for ( const index in extensions ) {

			const plugin = extensions[ index ];

			const extensionSlug = ExtensionModel.getPrimaryValue( {
				type: type,
				slug: plugin.slug,
			} );

			const extensionVersionSlug = ExtensionVersionModel.getPrimaryValue( {
				type: type,
				slug: plugin.slug,
				version: plugin.version,
				is_suppressed: plugin.is_suppressed,
			} );

			extensionSlugList.push( extensionSlug );
			extensionSlugVersionList.push( extensionVersionSlug );

			preparedExtensionList[ extensionVersionSlug ] = plugin;

		}

		const { data: extensionData } = await ExtensionModel.getResult( {
			whereClause: {
				extension_slug: extensionSlugList,
			},
		} );

		const extensionVersionData = await ExtensionVersionModel.getRowsWithErrorCount( extensionSlugVersionList );

		for ( const index in preparedExtensionList ) {
			const plugin = preparedExtensionList[ index ];
			const extensionVersionSlug = index;
			const extensionSlug = ExtensionModel.getPrimaryValue( {
				type: type,
				slug: preparedExtensionList[ index ].slug,
			} );

			/**
			 * Set default values. If data is not available in database.
			 */
			extensionVersionData[ extensionVersionSlug ] = _.defaults( extensionVersionData[ extensionVersionSlug ], plugin );
			extensionData[ extensionSlug ] = _.defaults( extensionData[ extensionSlug ], plugin );

			preparedExtensionList[ index ] = {
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
				is_suppressed: preparedExtensionList[ index ].is_suppressed,
				has_synthetic_data: extensionVersionData[ index ].has_synthetic_data || false,
				verification_status: extensionVersionData[ index ].verification_status || 'unknown',
			};
		}

		const extensionsTableArgs = {
			items: _.toArray( preparedExtensionList ),
			headings: {
				is_suppressed: 'Suppressed ?',
			},
			valueCallback: ( key, value ) => {

				switch ( key ) {

					case 'slug':
						if ( value.is_wporg ) {
							value = `<a href="https://wordpress.org/${ type }s/${ value.slug }" target="_blank" title="${ value.slug }">${ value.slug }</a>`;
						} else {
							value = value.slug;
						}

						break;
					case 'version':

						if ( value.latest_version ) {
							if ( value.version === value.latest_version ) {
								value = `<span class="text-success" title="Up to date with latest version.">${ value.version }</span>`;

							} else {

								const comparison = compareVersions( value.version, value.latest_version );
								let comparisonSign = '&ne;';
								comparisonSign = ( 1 === comparison ) ? '&gt;' : comparisonSign;
								comparisonSign = ( -1 === comparison ) ? '&lt;' : comparisonSign;

								value = `<span class="text-danger" title="Plugin is not up to date with latest version.">${ value.version }</span> <strong>${ comparisonSign }</strong> ${ value.latest_version }`;
							}

						} else {
							value = `<span class="text-warning" title="Latest version info not available.">${ value.version }</span>`;
						}

						break;
					case 'error_count':

						if ( value.has_synthetic_data ) {
							value = `<span>${ value.count }</span>`;
						} else {
							value = `<span>${ value.count ? value.count : '-' }</span>`;
						}

						break;
					case 'has_synthetic_data':
						if ( value ) {
							value = `<span class="text-success">Yes</span>`;
						} else {
							value = `<span class="text-danger">No</span>`;
						}
						break;
					case 'verification_status':
						const statusLabel = {
							fail: 'Fail',
							unknown: 'Unknown',
							pass: 'Pass',
							auto_pass: 'Pass (Auto)',
						};

						value = statusLabel[ value ] || 'Unverified';
						value = `<abbr>${ value }</abbr>`;
						break;
					case 'is_suppressed':
						if ( value ) {
							value = `<span class="text-danger">Yes</span> - ${ value }`;
						} else {
							value = `<span class="text-success">No</span>`;
						}
						break;
					default:
						break;
				}

				return value;
			},
		};

		return extensionsTableArgs;
	}

	/**
	 * To prepare args for validate URLs table.
	 *
	 * @param {array} urls List of array
	 *
	 * @return {Promise<{valueCallback: function(*, *): string, tableID: string, items: *, collapsible: {accordionClass: string, bodyCallback: function(*=): *}}>}
	 */
	async prepareValidateURLArgs( urls ) {

		if ( _.isEmpty( urls ) || ! ( _.isArray( urls ) || _.isObject( urls ) ) ) {
			return {};
		}

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

		if ( ! _.isEmpty( errorData ) ) {
			const { data } = await ErrorModel.getResult( {
				whereClause: {
					error_slug: _.unique( _.keys( errorData ) ),
				},
			} );

			errorData = data;
		}

		if ( ! _.isEmpty( errorSourceData ) ) {
			const { data } = await ErrorSourceModel.getResult( {
				whereClause: {
					error_source_slug: _.unique( _.keys( errorSourceData ) ),
				},
			} );

			errorSourceData = data;
		}

		const urlTableArgs = {
			tableID: 'validateUrls',
			items: urls,
			headings: {
				url: 'URL',
			},
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
					case 'site_request_uuid':
						value = `<a href="/admin/report/uuid/${ value }">...${ value.slice( value.length - 13 ) }</a>`;
						break;
					case 'updated_at':
					case 'created_at':
						const dateObject = new Date( value );
						const date = ( '0' + dateObject.getDate() ).slice( -2 );
						const month = ( '0' + ( dateObject.getMonth() + 1 ) ).slice( -2 );
						const year = dateObject.getFullYear();
						const dateString = `${ year }-${ month }-${ date }`;

						value = `<time datetime="${ dateString }" title="${ dateString }">${ dateString }</time>`;
						break;
					case 'errors':
						value = `<div class="text-center"><strong>${ _.size( value ) || 0 }</strong></div>`;
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

		const tableArgs = {
			tableID: `error-${ Utility.makeHash( validateUrl ) }`,
			items: _.values( errorData ),
			collapsible: {
				accordionClass: 'error-data',
				bodyCallback: ( errorDetail ) => {

					const tableArgs = this._prepareErrorSourceTableArgs( errorDetail, allErrorSourceData );
					return Templates.renderComponent( 'table', tableArgs );

				},
			},
			valueCallback: ( key, value ) => {
				value = value ? value : '-';

				switch ( key ) {
					case 'error_slug':
						value = `<abbr class="copy-to-clipboard" data-copy-text='${ value }'>${ value.slice( value.length - 13 ) }</abbr>`;
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
						value = `<button class="btn btn-primary btn-xs copy-to-clipboard" data-copy-text='${ value }'>Copy</button>`;
						break;
					case 'sources':
						value = `<div class="text-center"><strong>${ _.size( value ) || 0 }</strong></div>`;
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
						value = `<abbr class="copy-to-clipboard" data-copy-text="${ value }">${ value.slice( value.length - 13 ) }</abbr>`;
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
						value = `<button class="btn btn-primary btn-xs copy-to-clipboard" data-copy-text='${ value }'>Copy</button>`;
						break;
				}

				return value;
			},
		};

		return tableArgs;
	}

}

module.exports = ReportUuidController;
