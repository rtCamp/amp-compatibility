'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const BigQuery = use( 'App/BigQuery' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQueryUrlErrorRelationship' );

const { validateAll } = use( 'Validator' );

const _ = require( 'underscore' );

class VerifyExtensionsController {

	/**
	 * To render synthetic data verification page.
	 *
	 * @param {object} ctx
	 * @param {View} view ctx.view
	 * @param {Request} request ctx.request
	 * @param {object} params ctx.params
	 *
	 * @return {Promise<Route|String|*>}
	 */
	async index( { view, request, params } ) {

		params = _.defaults( params, {
			paged: 1,
			perPage: 50,
			s: request.input( 's' ) || '',
		} );

		const offset = ( params.paged > 1 ) ? ( params.paged * params.perPage ) : 0;
		const pagination = {
			baseUrl: `/admin/verify-extensions`,
			total: 0,
			perPage: params.perPage,
			currentPage: params.paged,
		};

		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const errorSourceTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ UrlErrorRelationshipModel.table }` + '`';

		let query = '';
		let queryObject = {
			select: 'SELECT extension_versions.extension_version_slug, extensions.name, extension_versions.slug, extension_versions.version, extension_versions.type, extensions.active_installs, count( DISTINCT url_error_relationships.error_slug ) AS error_count, extension_versions.is_verified',
			from: `FROM ${ extensionVersionTable } AS extension_versions ` +
				  `LEFT JOIN ${ extensionTable } AS extensions ON extension_versions.extension_slug = extensions.extension_slug ` +
				  `LEFT JOIN ${ errorSourceTable } AS error_sources ON extension_versions.extension_version_slug = error_sources.extension_version_slug ` +
				  `LEFT JOIN ${ urlErrorRelationshipTable } AS url_error_relationships ON url_error_relationships.error_source_slug = error_sources.error_source_slug `,
			where: 'WHERE extension_versions.has_synthetic_data = TRUE',
			groupby: 'GROUP BY extension_versions.extension_version_slug, extension_versions.slug, extensions.name, extension_versions.version, extension_versions.type, extensions.active_installs, extension_versions.is_verified',
			orderby: 'ORDER BY extensions.active_installs DESC',
			limit: `LIMIT ${ params.perPage } OFFSET ${ offset }`,
		};

		/**
		 * Add clause for search.
		 */
		if ( params.s ) {
			queryObject.where += ` AND ( extension_versions.slug LIKE '%${ params.s }%' OR extensions.name LIKE '%${ params.s }%' )`;
		}

		for ( const index in queryObject ) {
			query += `\n ${ queryObject[ index ] }`;
		}

		const items = await BigQuery.query( query );

		/**
		 * Get count.
		 */
		query = '';
		queryObject.select = 'SELECT count(1)';
		delete queryObject.limit;

		for ( const index in queryObject ) {
			query += `\n ${ queryObject[ index ] }`;
		}

		const count = await BigQuery.query( query );
		pagination.total = count.length || 0;

		return view.render( 'dashboard/verify-extensions', { items, pagination, searchString: params.s } );
	}

	/**
	 * POST request handler to update verify flag for synthetic data of the extension.
	 *
	 * @param {object} ctx
	 * @param {Request} request ctx.request
	 *
	 * @return {Promise<{data, status: string}|{data: *, status: string}>}
	 */
	async update( { request } ) {

		const postData = request.post();
		let response = {};

		const rules = {
			extensionVersionSlug: 'required|string',
			isVerified: 'required|boolean',
		};

		const messages = {
			'extensionVersionSlug.required': 'Please provide extension version slug.',
			'isVerified.required': 'Please provide is verified or not.',
		};

		const validation = await validateAll( postData, rules, messages );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		postData.isVerified = postData.isVerified.toLowerCase();

		const item = {
			extension_version_slug: postData.extensionVersionSlug,
			is_verified: ( 'true' === postData.isVerified ),
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

module.exports = VerifyExtensionsController;
