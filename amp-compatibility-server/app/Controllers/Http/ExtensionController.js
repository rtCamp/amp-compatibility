'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Database = use( 'Database' );

const ExtensionModel = use( 'App/Models/Extension' );
const ErrorSourceModel = use( 'App/Models/ErrorSource' );
const ErrorModel = use( 'App/Models/Error' );
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const UrlErrorRelationshipModel = use( 'App/Models/UrlErrorRelationship' );

const ReportUuidController = use( 'App/Controllers/Http/ReportUuidController' );

const View = use( 'View' );
const Templates = use( 'App/Controllers/Templates' );
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
			perPage: 20,
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

		return view.render( 'dashboard/extensions/list', data );
	}

	async show( { request, params, view } ) {

		const { extension_slug: extensionSlug } = params;

		if ( ! extensionSlug ) {
			return view.render( 'dashboard/extensions/not-found' );
		}

		/**
		 * 1. Get extension and it's version details.
		 */
		const queryParams = {
			whereClause: {
				extension_slug: extensionSlug,
			},
		};

		const reportUuidController = new ReportUuidController();
		const errorDetails = {};
		const { extensions, extensionVersions } = await this.getExtensionData( queryParams );
		const extension = extensions[ 0 ];

		if ( ! extension ) {
			return view.render( 'dashboard/extensions/not-found' );
		}

		/**
		 * 2. Get errors, error sources and it's mapping for each extension versions.
		 */
		for ( const index in extensionVersions ) {
			const extensionVersionSlug = extensionVersions[ index ].extension_version_slug;
			errorDetails[ extensionVersionSlug ] = await this._getErrorAndErrorSourceInfoByExtensionVersion( extensionVersionSlug );
		}

		/**
		 * 3. Prepare table args for extension version table.
		 */
		let tableArgs = this._prepareExtensionVersionTableArgs( {
			slug: {
				slug: extension.slug,
			},
			type: extension.type,
		}, extensionVersions );

		tableArgs = _.defaults( tableArgs, {
			collapsible: {
				accordionClass: 'extension-versions',
				bodyCallback: ( value ) => {

					const extensionVersionSlug = value.verification_status.extensionVersionSlug;
					const errorDetail = errorDetails[ extensionVersionSlug ];
					value.errors = errorDetail.errors;

					const tableArgs = reportUuidController._prepareErrorTableArgs( value, errorDetail.allErrors, errorDetail.allErrorSources );

					return Templates.renderComponent( 'table', tableArgs );
				},
			},
		} );

		/**
		 * 4. View Data.
		 */
		const viewData = {
			infoBoxList: {
				extensionInfo: {
					title: 'Extension Info',
					items: {
						name: extension.name,
						slug: ( extension.wporg ) ? `<a href="https://wordpress.org/plugins/${ extension.slug }" target="_blank" title="${ extension.slug }">${ extension.slug }</a>` : extension.slug,
						wporg: `<span class="text-info">${ !! extension.wporg ? 'Yes' : 'No' }</span>`,
						latest_version: extension.latest_version,
						active_installs: humanFormat( extension.active_installs ),
						last_updated: extension.last_updated,
						verification_status: extension.verification_status,
						is_partner: `<span class="text-info">${ !! extension.is_partner ? 'Yes' : 'No' }</span>`,
					},
				},
			},
			tableArgs: tableArgs,
		};

		return view.render( 'dashboard/extensions/show', viewData );
	}

	async update( { request } ) {
		const postData = request.post();
		let response = {
			status: 'fail',
		};

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
			const result = await ExtensionModel.save( item );

			if ( result ) {
				response = {
					status: 'ok',
				};
			}

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
	 * To query and get result of extension and extension version.
	 *
	 * @param {Object} params
	 *
	 * @return {Promise<{extensions: *, extensionVersions: *}>}
	 */
	async getExtensionData( params ) {

		const extensionArgs = _.clone( params );
		let hasError = false;

		const extensionTable = '`' + `${ ExtensionModel.table }` + '`';
		const errorSourceTable = '`' + `${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ ExtensionVersionModel.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ UrlErrorRelationshipModel.table }` + '`';

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

		let query = `SELECT * FROM ( ${ _.toArray( queryObject ).join( "\n" ) } ) AS extension_detail`;

		// Remove the limit before querying count query.
		delete queryObject.limit;
		let countQuery = `SELECT count(1) AS count FROM ( ${ _.toArray( queryObject ).join( "\n" ) } ) AS extension_detail`;

		if ( hasError ) {
			query += ` WHERE errorCount != 0;`;
			countQuery += ` WHERE errorCount != 0;`;
		}

		const [ extensions ] = await Database.raw( query );
		let [ extensionCount ] = await Database.raw( countQuery );

		if ( ! _.isEmpty( extensionCount ) ) {
			extensionCount = extensionCount[ 0 ].count ? extensionCount[ 0 ].count : 0;
		} else {
			extensionCount = 0;
		}

		/**
		 * Extension version query.
		 */
		let extensionVersions = [];
		let extensionSlugs = _.pluck( extensions, 'extension_slug' );

		if ( ! _.isEmpty( extensionSlugs ) ) {

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

			[ extensionVersions ] = await Database.raw( query );

		}

		return {
			extensionCount: extensionCount,
			extensions: extensions,
			extensionVersions: extensionVersions,
		};
	}

	/**
	 * To get error and error source information from extension version.
	 *
	 * @private
	 *
	 * @param {String} extensionVersionSlug Extension version slug.
	 *
	 * @return {Promise<{allErrors: {}, errors: {}, allErrorSources}>}
	 */
	async _getErrorAndErrorSourceInfoByExtensionVersion( extensionVersionSlug ) {

		let allErrorData = {};
		let allErrorSlugs = [];
		let errorSourceRelationships = {};

		/**
		 * 1. Get all error source information by extension version.
		 */
		const { data: allErrorSourceData } = await ErrorSourceModel.getResult( {
			whereClause: {
				extension_version_slug: extensionVersionSlug,
			},
		} );

		/**
		 * 2. From error source information. get all URL error relationships.
		 */
		let errorSourceSlugChunks = _.pluck( allErrorSourceData, 'error_source_slug' );
		errorSourceSlugChunks = _.chunk( errorSourceSlugChunks, 200 );

		for ( const index in errorSourceSlugChunks ) {
			const errorSourceSlugChunk = errorSourceSlugChunks[ index ];

			let { data: errorSourceRelationship } = await UrlErrorRelationshipModel.getResult( {
				selectFields: [
					'error_slug',
					'error_source_slug',
				],
				whereClause: {
					error_source_slug: errorSourceSlugChunk,
				},
			} );

			let errorsSlugs = _.pluck( errorSourceRelationship, 'error_slug' );
			allErrorSlugs = [ ...allErrorSlugs, ...errorsSlugs ];

			errorSourceRelationships = _.defaults( errorSourceRelationship, errorSourceRelationships );
		}

		allErrorSlugs = _.uniq( allErrorSlugs );
		const errorSlugChunks = _.chunk( allErrorSlugs, 200 );

		for ( const index in errorSlugChunks ) {
			const errorSlugChunk = errorSlugChunks[ index ];

			const { data: errorData } = await ErrorModel.getResult( {
				whereClause: {
					error_slug: errorSlugChunk,
				},
			} );

			allErrorData = _.defaults( errorData, allErrorData );
		}

		/**
		 * 3. Map error and error source relations.
		 */
		const errors = {};
		for ( const index in errorSourceRelationships ) {
			const errorSourceRelationship = errorSourceRelationships[ index ];
			const errorSlug = errorSourceRelationship.error_slug;
			const errorSourceSlug = errorSourceRelationship.error_source_slug;

			if ( ! errors[ errorSlug ] ) {
				errors[ errorSlug ] = {
					error_slug: errorSlug,
					sources: [],
				};
			}

			if ( ! errors[ errorSlug ].sources.includes( errorSourceSlug ) ) {
				errors[ errorSlug ].sources.push( errorSourceSlug );
			}

		}

		return {
			errors: errors,
			allErrors: allErrorData,
			allErrorSources: allErrorSourceData,
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
				name: {
					name: item.name,
					extension_slug: item.extension_slug,
				},
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
					case 'name':
						value = `<a href="/admin/extension/${ value.extension_slug }">${ value.name }</a>`;
						break;
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
						const dateObject = new Date( value );
						const date = ( '0' + dateObject.getDate() ).slice( -2 );
						const month = ( '0' + ( dateObject.getMonth() + 1 ) ).slice( -2 );
						const year = dateObject.getFullYear();
						const dateString = `${ year }-${ month }-${ date }`;

						value = `<time datetime="${ dateString }" title="${ dateString }">${ dateString }</time>`;
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
					has_synthetic_data: item.has_synthetic_data || false,
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

					case 'has_synthetic_data':
						if ( value ) {
							value = `<span class="text-success">Yes</span>`;
						} else {
							value = `<span class="text-danger">No</span>`;
						}
						break;
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
		let response = {
			status: 'fail',
		};

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
			const result = await ExtensionVersionModel.save( item );

			if ( result ) {
				response = {
					status: 'ok',
				};
			}

		} catch ( exception ) {

			console.log( exception );
			response = {
				status: 'ok',
				data: exception,
			};
		}

		return response;
	}
}

module.exports = ExtensionController;
