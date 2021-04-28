'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const BigQuery = use( 'App/BigQuery' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ErrorModel = use( 'App/Models/BigQueryError' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQueryUrlErrorRelationship' );

const View = use( 'View' );
const Templates = use( 'App/Controllers/Templates' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );
const humanFormat = require( 'human-format' );

class ExtensionController {

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
				'name',
				'slug',
				'extension_slug',
			],
			orderby: {
				active_installs: 'DESC',
				slug: 'ASC',
			},
		} );

		const total = await ExtensionModel.getCount( params, false );
		const extensionsTableArgs = await this._prepareExtensionsTableArgs( params );

		const data = {
			tableArgs: extensionsTableArgs,
			pagination: {
				baseUrl: `/admin/extensions`,
				total: total,
				perPage: params.perPage,
				currentPage: params.paged,
			},
			searchString: params.s || '',
		};

		return view.render( 'dashboard/extension', data );
	}

	/**
	 * To query BigQuery and get result of extension and extension version.
	 *
	 * @private
	 *
	 * @param {Object} params
	 *
	 * @return {Promise<{extensions: *, extensionVersions: *}>}
	 */
	async _getExtensionData( params ) {

		const extensions = await ExtensionModel.getRows( params, true );

		let extensionSlugs = _.keys( extensions );
		extensionSlugs = _.map( extensionSlugs, ExtensionModel._prepareValueForDB );

		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const errorSourceTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ UrlErrorRelationshipModel.table }` + '`';

		let query = '';
		let queryObject = {
			select: 'SELECT extensions.extension_slug, extensions.name, extension_versions.extension_version_slug, extensions.name, extension_versions.slug, extension_versions.version, extension_versions.type, extensions.active_installs, count( DISTINCT url_error_relationships.error_slug ) AS error_count, extension_versions.verification_status, extension_versions.verified_by',
			from: `FROM ${ extensionVersionTable } AS extension_versions ` +
				  `LEFT JOIN ${ extensionTable } AS extensions ON extension_versions.extension_slug = extensions.extension_slug ` +
				  `LEFT JOIN ${ errorSourceTable } AS error_sources ON extension_versions.extension_version_slug = error_sources.extension_version_slug ` +
				  `LEFT JOIN ${ urlErrorRelationshipTable } AS url_error_relationships ON url_error_relationships.error_source_slug = error_sources.error_source_slug `,
			where: `WHERE extensions.extension_slug IN ( ${ extensionSlugs.join( ', ' ) } )`,
			groupby: 'GROUP BY extensions.extension_slug, extensions.name, extension_versions.extension_version_slug, extension_versions.slug, extensions.name, extension_versions.version, extension_versions.type, extensions.active_installs, extension_versions.verification_status, extension_versions.verified_by',
			orderby: 'ORDER BY extensions.active_installs DESC, extension_versions.slug ASC',
		};

		query = _.toArray( queryObject ).join( "\n" );

		const extensionVersions = await BigQuery.query( query, true );

		return {
			extensions: extensions,
			extensionVersions: extensionVersions,
		};
	}

	/**
	 * Prepare table args for extension table.
	 *
	 * @private
	 *
	 * @param {object} params Query params.
	 *
	 * @return {Promise<{valueCallback: function(*, *=): string, tableID: string, headings: {}, items: *, collapsible: {accordionClass: string, bodyCallback: function(*=): *}}>}
	 */
	async _prepareExtensionsTableArgs( params ) {
		const { extensions, extensionVersions } = await this._getExtensionData( params );

		const preparedItems = [];

		for ( const index in extensions ) {
			const item = extensions[ index ];

			preparedItems.push( {
				name: item.name,
				slug: {
					slug: item.slug,
					is_wporg: item.wporg,
				},
				type: item.type,
				latest_version: item.latest_version,
				active_installs: humanFormat( item.active_installs ),
				is_partner: {
					extension_slug: item.extension_slug,
					name: item.name,
					is_partner: !! item.is_partner,
				},
				last_updated: item.last_updated,
			} );
		}

		const tableArgs = {
			tableID: 'extension-table',
			items: _.toArray( preparedItems ),
			headings: {},
			collapsible: {
				accordionClass: 'extension-versions',
				bodyCallback: ( extension ) => {

					const tableArgs = this._prepareExtensionVersionTableArgs( extension, extensionVersions );

					return Templates.renderComponent( 'table', tableArgs );
				},
			},
			valueCallback: ( key, value ) => {

				switch ( key ) {
					case 'slug':
						if ( value.is_wporg ) {
							value = `<a href="https://wordpress.org/plugins/${ value.slug }" target="_blank" title="${ value.slug }">${ value.slug }</a>`;
						} else {
							value = value.slug;
						}

						break;
					case 'updated_at':
					case 'created_at':
					case 'last_updated':
						value = ( _.isObject( value ) ) ? value.value : value;
						const dateObject = new Date( value );
						const date = ( '0' + dateObject.getDate() ).slice( -2 );
						const month = ( '0' + ( dateObject.getMonth() + 1 ) ).slice( -2 );
						const year = dateObject.getFullYear();

						value = `<time datetime="${ value }" title="${ value.replace( 'T', ' ' ) }">${ year }-${ month }-${ date }</time>`;
						break;
					case 'is_partner':
						const checked = !! value.is_partner;

						value = `<div class="text-center"><input type="checkbox" data-extension-version="${ value.extension_slug }" data-name="${ value.name }" ${ checked ? 'checked' : '' } ></div>`;

						break;
				}

				return value;
			},
		};

		return tableArgs;
	}

	/**
	 * Prepare table args for extension versions.
	 *
	 * @private
	 *
	 * @param {object} extension
	 * @param {object} allExtensionVersions
	 *
	 * @return {{valueCallback: function(*, *): string, tableID: *, items: *}|{}}
	 */
	_prepareExtensionVersionTableArgs( extension, allExtensionVersions ) {

		if ( _.isEmpty( extension ) || _.isEmpty( allExtensionVersions ) || ! _.isObject( allExtensionVersions ) ) {
			return {};
		}

		const extensionSlug = ExtensionModel.getPrimaryValue( {
			type: extension.type,
			slug: extension.slug.slug,
		} );

		const preparedItems = [];

		for ( const index in allExtensionVersions ) {
			const item = allExtensionVersions[ index ];

			if ( extensionSlug === item.extension_slug ) {
				preparedItems.push( {
					version: item.version,
					error_count: item.error_count,
					verification_status: {
						status: item.verification_status || 'unknown',
						name: item.name,
						version: item.version,
					},
					verified_by: item.verified_by || '',
				} );
			}
		}

		const extensionVersionsTableArgs = {
			tableID: extensionSlug,
			items: _.toArray( preparedItems ),
			valueCallback: ( key, value ) => {

				switch ( key ) {

					case 'error_count':
						value = `<div class="text-center">${ value ? value : '-' }</div>`;
						break;
					case 'verification_status':
						const options = {
							fail: 'Fail',
							unknown: 'Unknown',
							pass: 'Pass',
							auto_pass: 'Pass (Auto)',
						};

						let htmlMarkup = `<select class="extension-verify-status form-select form-select-xs" data-extension-name="${ value.name }" data-extension-version="${ value.version }" data-extension-version-slug="${ value.extensionVersionSlug }" >`;

						for ( const index in options ) {
							htmlMarkup += `<option value="${ index }" ${ index === value.status ? 'selected' : '' } ${ [ 'auto_pass' ].includes( index ) ? 'disabled' : '' } >${ options[ index ] }</option>`;
						}

						htmlMarkup += '</select>';

						value = htmlMarkup;
						break;
				}

				return value;
			},
		};

		return extensionVersionsTableArgs;

	}
}

module.exports = ExtensionController;
