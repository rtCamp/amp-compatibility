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
const compareVersions = require( 'compare-versions' );

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
				'extensions.name',
				'extensions.slug',
				'extensions.extension_slug',
			],
			orderby: {
				'extensions.active_installs': 'DESC',
				'extensions.slug': 'ASC',
			},
		} );

		const isPartner = !! request.input( 'is_partner' );
		const hasError = !! request.input( 'has_error' );

		if ( isPartner ) {
			params.whereClause = params.whereClause || {};
			params.whereClause.is_partner = true;
		}

		if ( hasError ) {
			params.whereNot = params.whereClause || {};
			params.whereNot.error_count = 0;
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
				'extensions.extension_slug': extensionSlug,
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
			latest_version: {
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
	 * Api endpoint to search extension.
	 *
	 * @param {object} ctx
	 * @param {Request} request ctx.request
	 *
	 * @return {Promise<{data, status: string}>}
	 */
	async search( { request } ) {

		const getParams = request.get();
		const queryParams = {
			selectFields: [
				'name',
				'slug',
				'extension_slug',
				'type',
			],
			perPage: 10,
			s: getParams.s || '',
			searchFields: [
				'name',
				'slug',
				'extension_slug',
			],
			orderby: {
				active_installs: 'DESC',
				slug: 'ASC',
			},
		};

		if ( getParams.type ) {
			queryParams.whereClause = {
				type: getParams.type,
			};
		}

		const { data: extensions } = await ExtensionModel.getResult( queryParams );
		const { data: extensionVersions } = await ExtensionVersionModel.getResult( {
			selectFields: [
				'extension_slug',
				'version',
			],
			whereClause: {
				extension_slug: _.keys( extensions ),
			},
			orderby: {
				version: 'DESC',
			}
		} );

		for ( const index in extensionVersions ) {

			const extensionSlug = extensionVersions[ index ].extension_slug;

			extensions[ extensionSlug ].versions = extensions[ extensionSlug ].versions || [];
			extensions[ extensionSlug ].versions.push( extensionVersions[ index ].version );
		}

		return {
			status: 'ok',
			data: extensions,
		};

	}

	/**
	 * To query and get result of extension and extension version.
	 *
	 * @param {Object} params
	 *
	 * @return {Promise<{extensions: *, extensionVersions: *}>}
	 */
	async getExtensionData( params ) {

		const selectFields = [
			'extensions.extension_slug',
			'extensions.name',
			'extensions.slug',
			'extensions.wporg',
			'extensions.type',
			'extensions.latest_version',
			'extensions.active_installs',
			'extensions.is_partner',
			'extensions.last_updated',
			'extension_versions.error_count',
			'extensions.support_threads',
			'extensions.support_threads_resolved',
			'extensions.tested_wp',
			'extension_versions.verification_status',
		];

		let query = Database.table( ExtensionModel.table ).select( selectFields )
				.innerJoin( ExtensionVersionModel.table, function () {
					this.on( 'extensions.extension_slug', 'extension_versions.extension_slug' )
						.andOn( 'extensions.latest_version', 'extension_versions.version' );
				} );

		const { data: extensions, total: extensionCount } = await ExtensionModel._prepareQuery( params, query );

		/**
		 * Extension version query.
		 */
		let extensionVersions = [];
		let extensionSlugs = _.pluck( extensions, 'extension_slug' );

		if ( ! _.isEmpty( extensionSlugs ) ) {

			for( const index in extensionSlugs ) {
				let extensionVersionsIteration = await ExtensionVersionModel.getResult( {
					whereClause: {
						extension_slug: extensionSlugs[index],
					},
					orderby: {
						version: 'DESC',
					},
				} );

				extensionVersionsIteration = extensionVersionsIteration.data || {};

				extensionVersions = { ...extensionVersions, ...extensionVersionsIteration };

			}
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

		if ( ! extensionVersionSlug ) {
			return {
				errors: {},
				allErrors: {},
				allErrorSources: {},
			};
		}

		/**
		 * 1. Get all URL Error Relationship data.
		 */
		let urlErrorRelationships = [];
		let urlErrorRelationshipsIteration = [];
		const perPage = 1000;
		let currentPage = 0;

		do {

			currentPage = currentPage + 1;

			urlErrorRelationshipsIteration = await Database
				.table( UrlErrorRelationshipModel.table )
				.select(
					[
						`${ UrlErrorRelationshipModel.table }.hash`,
						`${ UrlErrorRelationshipModel.table }.error_slug`,
						`${ UrlErrorRelationshipModel.table }.error_source_slug`,
					],
				)
				.innerJoin(
					ErrorSourceModel.table,
					`${ ErrorSourceModel.table }.error_source_slug`,
					`${ UrlErrorRelationshipModel.table }.error_source_slug`,
				)
				.where( 'extension_version_slug', extensionVersionSlug )
				.paginate( currentPage, perPage );

			urlErrorRelationshipsIteration = urlErrorRelationshipsIteration.data;

			if ( _.isEmpty( urlErrorRelationshipsIteration ) ) {
				break;
			}

			urlErrorRelationships = [ ...urlErrorRelationships, ...urlErrorRelationshipsIteration ];

		} while ( ! _.isEmpty( urlErrorRelationshipsIteration ) );


		let errorSlugs = _.pluck( urlErrorRelationships, 'error_slug' );
		errorSlugs = _.uniq( errorSlugs );

		let errorSourceSlugs = _.pluck( urlErrorRelationships, 'error_source_slug' );
		errorSourceSlugs = _.uniq( errorSourceSlugs );

		/**
		 * 2. Get error detail.
		 */
		let errors = {};
		const errorSlugChunks = _.chunk( errorSlugs, 100 );

		for ( const index in errorSlugChunks ) {
			let errorsIteration = await ErrorModel.getResult(
				{
					whereClause: {
						error_slug: errorSlugChunks[ index ],
					},
				},
			);

			errors = { ...errors, ...errorsIteration.data };
		}

		/**
		 * 3. Get error source detail.
		 */
		let errorSources = {};
		const errorSourceSlugChunks = _.chunk( errorSourceSlugs, 100 );

		for ( const index in errorSourceSlugChunks ) {
			let errorSourcesIteration = await ErrorSourceModel.getResult(
				{
					whereClause: {
						error_source_slug: errorSourceSlugChunks[ index ],
					},
				},
			);

			errorSources = { ...errorSources, ...errorSourcesIteration.data };

		}

		/**
		 * 4. Generate the mapping of error and error source.
		 */
		const errorMapping = {};

		for ( const index in urlErrorRelationships ) {

			const relationship = urlErrorRelationships[ index ];
			const errorSlug = relationship.error_slug;
			const errorSourceSlug = relationship.error_source_slug;

			if ( ! errorMapping[ errorSlug ] ) {
				errorMapping[ errorSlug ] = {
					error_slug: errorSlug,
					sources: [],
				};
			}

			if ( ! errorMapping[ errorSlug ].sources.includes( errorSourceSlug ) ) {
				errorMapping[ errorSlug ].sources.push( errorSourceSlug );
			}

		}

		return {
			errors: errorMapping,
			allErrors: errors,
			allErrorSources: errorSources,
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
				latest_version: {
					slug: item.slug,
					version: item.latest_version,
					is_wporg: item.wporg,
				},
				type: item.type,
				active_installs: humanFormat( item.active_installs ),
				error_count: item.error_count,
				support_threads: item.support_threads,
				support_threads_resolved: item.support_threads_resolved,
				tested_wp: item.tested_wp,
				is_partner: {
					extension_slug: item.extension_slug,
					name: item.name,
					is_partner: !! item.is_partner,
				},
				verification_status: item.verification_status || 'unknown',
				last_updated: item.last_updated,
			} );
		}

		const tableArgs = {
			classes: 'text-center',
			tableID: 'extension-table',
			items: _.toArray( preparedItems ),
			headings: {
				type: 'Extension Type',
				is_partner: 'Partner?',
				support_threads: "Support<br/>threads",
				support_threads_resolved: "Support threads<br/>resolved",
				tested_wp: '<span title="WordPress version">Tested Upto</span>'
			},
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
					case 'latest_version':
						if ( value.is_wporg ) {
							value = `<a href="https://wordpress.org/plugins/${ value.slug }" target="_blank" title="${ value.version }">${ value.version }</a>`;
						} else {
							value = value.latest_version;
						}

						break;
					case 'error_count':
					case 'support_threads':
					case 'support_threads_resolved':
						value = value ? value : '-';
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
			slug: extension.latest_version.slug,
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
			classes: 'text-start',
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
						value = value ? value : '-';
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
