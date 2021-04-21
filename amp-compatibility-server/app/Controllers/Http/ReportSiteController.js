'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const BigQuery = use( 'App/BigQuery' );

const SiteModel = use( 'App/Models/BigQuerySite' );
const SiteToExtensionModel = use( 'App/Models/BigQuerySiteToExtension' );
const AmpValidatedUrlModel = use( 'App/Models/BigQueryAmpValidatedUrl' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQueryUrlErrorRelationship' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

const Utility = use( 'App/Helpers/Utility' );

const ReportUuidController = use( 'App/Controllers/Http/ReportUuidController' );
const _ = require( 'underscore' );

class ReportSiteController {

	/**
	 * To Show report based on site.
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

		const site = params.site || '';

		if ( ! site ) {
			return view.render( 'dashboard/reports/site/not-found' );
		}

		const siteInfo = await SiteModel.getRow( site );

		if ( ! siteInfo ) {
			return view.render( 'dashboard/reports/site/not-found' );
		}

		const reportUuidController = new ReportUuidController();

		// Get active plugins.
		const plugins = await this._getPlugins( site );
		const pluginTableArgs = await reportUuidController.preparePluginTableArgs( plugins );

		// Get Validate URLs.
		const preparedValidateUrls = await this._getValidateURLs( site );
		const urlTableArgs = await reportUuidController.prepareValidateURLArgs( preparedValidateUrls );

		let infoBoxList = this._getInfoboxList( siteInfo );
		infoBoxList.requestInfo.items.URL_Counts = preparedValidateUrls.length || 0;

		return view.render( 'dashboard/reports/site/show', {
			infoBoxList,
			urlTableArgs,
			pluginTableArgs,
		} );
	}

	/**
	 * Prepare infobox from site info..
	 *
	 * @param siteInfo
	 * @return {{siteHealth: {valueCallback: (function(*, *=): string), title: string, items: {is_defined_curl_multi: (string|*), libxml_version: (string|*), object_cache_status: (boolean|string|*), stylesheet_transient_caching: (string|*), loopback_requests: (string|*), https_status: (string|*)}}, requestInfo: {valueCallback: (function(*, *): string), title: string, items: {last_updated, site_URL, URL_Counts: number}}, siteInfo: {valueCallback: (function(*, *): string), title: string, items: {MySQL_version: (string|*), site_URL, PHP_version: (string|*), WordPress_version: (string|*), WordPress_language: (string|*), site_title: (string|*)}}, ampSettings: {valueCallback: (function(*, *=): string), title: string, items: {AMP_reader_theme: (string|*), AMP_version: (string|*), AMP_mode: (string|*), AMP_mobile_redirect: (string|*), AMP_supported_templates: (string|*|string), AMP_plugin_configured: (string|*), AMP_supported_post_types: (string|*|string), AMP_all_templates_supported: (string|*)}}}}
	 * @private
	 */
	_getInfoboxList( siteInfo ) {
		return {
			requestInfo: {
				title: 'Request Info',
				items: {
					site_URL: siteInfo.site_url,
					//status: siteInfo.status,
					URL_Counts: 0,
					// errorCount: 0,
					last_updated: siteInfo.updated_at.value,
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
					site_URL: siteInfo.site_url,
					site_title: siteInfo.site_title,
					PHP_version: siteInfo.php_version,
					MySQL_version: siteInfo.mysql_version,
					WordPress_version: siteInfo.wp_version,
					WordPress_language: siteInfo.wp_language,
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
					https_status: siteInfo.wp_https_status,
					object_cache_status: siteInfo.object_cache_status,
					libxml_version: siteInfo.libxml_version,
					is_defined_curl_multi: siteInfo.is_defined_curl_multi,
					stylesheet_transient_caching: siteInfo.stylesheet_transient_caching,
					loopback_requests: siteInfo.loopback_requests,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'https_status':
						case 'object_cache_status':
						case 'is_defined_curl_multi':
							value = ( value || parseInt( value ) ) ? `<span class="text-success">Yes</span>` : `<span class="text-danger">No</span>`;
							break;
					}
					return value;
				},
			},
			ampSettings: {
				title: 'AMP Settings',
				items: {
					AMP_mode: siteInfo.amp_mode,
					AMP_version: siteInfo.amp_version,
					AMP_plugin_configured: siteInfo.amp_plugin_configured,
					AMP_all_templates_supported: siteInfo.amp_all_templates_supported,
					AMP_supported_post_types: siteInfo.amp_supported_post_types,
					AMP_supported_templates: siteInfo.amp_supported_templates,
					AMP_mobile_redirect: siteInfo.amp_mobile_redirect,
					AMP_reader_theme: siteInfo.amp_reader_theme,
				},
				valueCallback: ( key, value ) => {
					switch ( key ) {
						case 'AMP_plugin_configured':
						case 'AMP_all_templates_supported':
						case 'AMP_mobile_redirect':
							value = ( value || parseInt( value ) ) ? `<span class="text-success">Yes</span>` : `<span class="text-danger">No</span>`;
							break;
						case 'AMP_supported_post_types':

							if ( _.isString( value ) && -1 !== value.indexOf( ',' ) ) {
								value = value.replace( '[', '' ).replace( ']', '' ).replace( /'/g, '' );
								value = value.split( ',' );

							} else {
								value = [];
							}

							const items = value.map( ( item ) => {
								return `<li class="list-group-item p-0 border-0 bg-transparent">${ item }</li>`;
							} );

							value = '<ul class="list-group list-sm list-group-flush mt-0 mb-0">' + items.join( '' ) + '</ul>';

							break;
					}
					return value;
				},
			},
		};
	}

	/**
	 * To get list of plugin by site.
	 *
	 * @param {string } site Site domain.
	 *
	 * @return {Promise<*>}
	 *
	 * @private
	 */
	async _getPlugins( site ) {

		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const siteToExtensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ SiteToExtensionModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';

		let query = '';
		let queryObject = {
			select: 'SELECT extensions.name, extension_versions.slug, extension_versions.version, site_to_extensions.amp_suppressed',
			from: `FROM ${ siteToExtensionTable } AS site_to_extensions ` +
				  `INNER JOIN ${ extensionVersionTable } AS extension_versions ON extension_versions.extension_version_slug = site_to_extensions.extension_version_slug ` +
				  `INNER JOIN ${ extensionTable } AS extensions ON extensions.extension_slug = extension_versions.extension_slug `,
			where: `WHERE site_to_extensions.site_url='${ site }' AND extensions.type='plugin'`,
			orderby: 'ORDER BY extensions.active_installs DESC, extension_versions.slug ASC',
		};

		for ( const index in queryObject ) {
			query += `\n ${ queryObject[ index ] }`;
		}

		const items = await BigQuery.query( query, true );

		return items;
	}

	/**
	 * To get validate URLs by site.
	 *
	 * @param {string} site Site doamin.
	 *
	 * @return {Promise<[]>}
	 *
	 * @private
	 */
	async _getValidateURLs( site ) {

		const validateUrls = await AmpValidatedUrlModel.getRows( {
			whereClause: {
				site_url: site,
			},
		} );

		const urlErrorRelationships = await UrlErrorRelationshipModel.getRows( {
				whereClause: {
					site_url: site,
				},
			},
		);

		for ( const index in urlErrorRelationships ) {

			const relationship = urlErrorRelationships[ index ];
			const pageUrl = relationship.page_url;

			if ( _.isEmpty( validateUrls[ pageUrl ] ) || ! _.isObject( validateUrls[ pageUrl ] ) ) {
				continue;
			}

			validateUrls[ pageUrl ].errors = validateUrls[ pageUrl ].errors || {};

			const errorSlug = relationship.error_slug;
			const errorSourceSlug = relationship.error_source_slug;

			validateUrls[ pageUrl ].errors[ errorSlug ] = validateUrls[ pageUrl ].errors[ errorSlug ] || {};

			validateUrls[ pageUrl ].errors[ errorSlug ].error_slug = errorSlug;

			validateUrls[ pageUrl ].errors[ errorSlug ].sources = validateUrls[ pageUrl ].errors[ errorSlug ].sources || [];

			validateUrls[ pageUrl ].errors[ errorSlug ].sources.push( errorSourceSlug );

		}

		const preparedValidateUrls = [];

		for ( const index in validateUrls ) {
			const preparedValidateUrl = _.defaults(
				{
					url: _.clone( validateUrls[ index ].page_url ),
				},
				validateUrls[ index ],
			);

			preparedValidateUrl.errors = _.toArray( preparedValidateUrl.errors );

			delete ( preparedValidateUrl.site_url );
			delete ( preparedValidateUrl.page_url );

			preparedValidateUrls.push( preparedValidateUrl );
		}

		return preparedValidateUrls;
	}
}

module.exports = ReportSiteController;
