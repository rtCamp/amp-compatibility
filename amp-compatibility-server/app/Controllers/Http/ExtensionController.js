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
const { validateAll } = use( 'Validator' );

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

		const isPartner = !! request.input( 'is_partner' );
		const hasError = !! request.input( 'has_error' );

		if ( isPartner ) {
			params.whereClause = params.whereClause || {};
			params.whereClause.is_partner = true;
		}

		if ( hasError ) {
			params.whereClause = params.whereClause || {};
			params.whereClause.has_error = true;
		}

		const { extensionCount, extensions, extensionVersions } = await this.getExtensionData( params );
		const extensionsTableArgs = await this._prepareExtensionsTableArgs( extensions, extensionVersions );

		console.log( request.get() );

		const data = {
			tableArgs: extensionsTableArgs,
			pagination: {
				baseUrl: `/admin/extensions`,
				total: extensionCount,
				perPage: params.perPage,
				currentPage: params.paged,
			},
			queryStrings: request.get(),
		};

		return view.render( 'dashboard/extension', data );
	}

	/**
	 * To query BigQuery and get result of extension and extension version.
	 *
	 * @param {Object} params
	 *
	 * @return {Promise<{extensions: *, extensionVersions: *}>}
	 */
	async getExtensionData( params ) {

		const extensionArgs = _.clone( params );
		let hasError = false;

		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const errorSourceTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ UrlErrorRelationshipModel.table }` + '`';

		if ( extensionArgs.whereClause && extensionArgs.whereClause.has_error ) {
			hasError = !! extensionArgs.whereClause.has_error;
			delete extensionArgs.whereClause.has_error;
		}

		let queryObject = ExtensionModel.parseQueryArgs( extensionArgs );

		queryObject.select = `SELECT extensions.extension_slug, extensions.name, extensions.slug, extensions.wporg, extensions.type, extensions.latest_version, extensions.active_installs, extensions.is_partner, extensions.last_updated, count( DISTINCT url_error_relationships.error_slug ) AS errorCount, extension_versions.verification_status`;
		queryObject.from += `\n INNER JOIN ${ extensionVersionTable } AS extension_versions ON extensions.extension_slug = extension_versions.extension_slug AND extensions.latest_version = extension_versions.version ` +
							`\n LEFT JOIN ${ errorSourceTable } AS error_sources ON extension_versions.extension_version_slug = error_sources.extension_version_slug ` +
							`\n LEFT JOIN ${ urlErrorRelationshipTable } AS url_error_relationships ON url_error_relationships.error_source_slug = error_sources.error_source_slug `;
		queryObject.groupby = `GROUP BY extensions.extension_slug, extensions.name, extensions.slug, extensions.wporg, extensions.type, extensions.latest_version, extensions.active_installs, extensions.is_partner, extensions.last_updated, extension_versions.verification_status`;

		if ( hasError ) {
			queryObject.orderby = queryObject.orderby.replace( 'ORDER BY ', 'ORDER BY errorCount DESC, ' );
		}

		let query = `SELECT * FROM ( ${ _.toArray( queryObject ).join( "\n" ) } )`;

		// Remove the limit before querying count query.
		delete queryObject.limit;
		let countQuery = `SELECT count(1) AS count FROM ( ${ _.toArray( queryObject ).join( "\n" ) } )`;

		if ( hasError ) {
			query += ` WHERE errorCount != 0;`;
			countQuery += ` WHERE errorCount != 0;`;
		}

		const extensions = await BigQuery.query( query, true );
		let extensionCount = await BigQuery.query( countQuery );

		if ( ! _.isEmpty( extensionCount ) ) {
			extensionCount = extensionCount[ 0 ].count ? extensionCount[ 0 ].count : 0;
		} else {
			extensionCount = 0;
		}

		/**
		 * Extension version query.
		 */
		let extensionSlugs = _.pluck( extensions, 'extension_slug' );
		extensionSlugs = _.map( extensionSlugs, ExtensionModel._prepareValueForDB );

		queryObject = {
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
			extensionCount: extensionCount,
			extensions: extensions,
			extensionVersions: extensionVersions,
		};
	}

	/**
	 * Prepare table args for extension table.
	 *
	 * @private
	 *
	 * @param {object} extensions Extension list.
	 * @param {object} extensionVersions Extension version list.
	 *
	 * @return {Promise<{valueCallback: function(*, *=): string, tableID: string, headings: {}, items: *, collapsible: {accordionClass: string, bodyCallback: function(*=): *}}>}
	 */
	async _prepareExtensionsTableArgs( extensions, extensionVersions ) {

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
				error_count: item.errorCount,
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

						value = `<div class="text-center"><input type="checkbox" class="extension-partner-control" data-extension-slug="${ value.extension_slug }" data-name="${ value.name }" ${ checked ? 'checked' : '' } ></div>`;

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
						extensionVersionSlug: item.extension_version_slug,
					},
					verified_by: {
						verified_by: item.verified_by || '',
						name: item.name,
						version: item.version,
					},
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
					case 'verified_by':

						if ( ! _.isEmpty( value.verified_by ) && 'auto' !== value.verified_by ) {
							const subject = `Regarding verification status of "${ value.name } - ${ value.version }"`;
							const htmlMarkup = `<a href='mailto:${ value.verified_by }?subject=${ subject }'>${ value.verified_by }</a>`;
							value = htmlMarkup;
						} else {
							value = value.verified_by;
						}

						break;
				}

				return value;
			},
		};

		return extensionVersionsTableArgs;
	}

	async update( { request } ) {
		const postData = request.post();
		let response = {};

		const rules = {
			extensionSlug: 'required|string',
			status: 'required|string',
		};

		const messages = {
			'extensionSlug.required': 'Please provide extension version slug.',
			'status.required': 'Please provide partnership status.',
		};

		const validation = await validateAll( postData, rules, messages );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}
		const item = {
			extension_slug: postData.extensionSlug,
			is_partner: ( 'true' === postData.status.toLowerCase() ),
		};

		try {
			const updateQuery = await ExtensionModel.getUpdateQuery( item );

			await BigQuery.query( updateQuery );
			response = {
				status: 'ok',
			};
		} catch ( exception ) {
			console.log( exception );
			response = {
				status: 'ok',
				data: exception,
			};
		}

		return response;
	}

	/**
	 * POST request handler to update verify flag for synthetic data of the extension.
	 *
	 * @param {object} ctx
	 * @param {Request} request ctx.request
	 * @param {object} request ctx.auth
	 *
	 * @return {Promise<{data, status: string}|{data: *, status: string}>}
	 */
	async extensionVersionUpdate( { request, auth } ) {

		const postData = request.post();
		let response = {};

		const rules = {
			extensionVersionSlug: 'required|string',
			verificationStatus: 'required|string',
		};

		const messages = {
			'extensionVersionSlug.required': 'Please provide extension version slug.',
			'verificationStatus.required': 'Please provide verification status.',
		};

		const validation = await validateAll( postData, rules, messages );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		const user = await auth.getUser();

		const item = {
			extension_version_slug: postData.extensionVersionSlug,
			verification_status: postData.verificationStatus,
			verified_by: user.email || 'auto',
		};

		try {
			const updateQuery = await ExtensionVersionModel.getUpdateQuery( item );

			await BigQuery.query( updateQuery );
			response = {
				status: 'ok',
			};
		} catch ( exception ) {
			response = {
				status: 'ok',
				data: exception,
			};
		}

		return response;
	}
}

module.exports = ExtensionController;
