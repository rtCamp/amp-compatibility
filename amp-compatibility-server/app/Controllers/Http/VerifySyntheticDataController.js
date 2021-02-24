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

const _ = require( 'underscore' );

class VerifySyntheticDataController {

	async index( { view, request, params } ) {

		params = _.defaults( params, {
			paged: 1,
			perPage: 50,
			s: request.input( 's' ) || '',
		} );

		const offset = ( params.paged > 1 ) ? ( params.paged * params.perPage ) : 0;
		const pagination = {
			baseUrl: `/admin/verify-synthetic-data`,
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
			select: 'SELECT extension_versions.extension_version_slug, extensions.name, extension_versions.version, extension_versions.type, extensions.active_installs, count( DISTINCT url_error_relationships.error_slug ) AS error_count, extension_versions.is_verified',
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

		return view.render( 'dashboard/verify-synthetic-data', { items, pagination, searchString: params.s } );
	}
}

module.exports = VerifySyntheticDataController;
