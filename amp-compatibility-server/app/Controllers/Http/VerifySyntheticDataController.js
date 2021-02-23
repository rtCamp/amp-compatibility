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

	async index( { view, params } ) {

		params = _.defaults( params, {
			paged: 1,
			perPage: 50,
			s: '',
		} );

		const offset = ( params.paged > 1 ) ? ( params.paged * params.perPage ) : 0;

		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const errorSourceTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ UrlErrorRelationshipModel.table }` + '`';

		const query = `SELECT extension_versions.slug, extension_versions.version, extension_versions.type, count( DISTINCT url_error_relationships.error_slug ) AS error_count
						FROM ${ extensionVersionTable } AS extension_versions
							LEFT JOIN ${ errorSourceTable } AS error_sources ON extension_versions.extension_version_slug = error_sources.extension_version_slug
							LEFT JOIN ${ urlErrorRelationshipTable } AS url_error_relationships ON url_error_relationships.error_source_slug = error_sources.error_source_slug
						WHERE extension_versions.has_synthetic_data = TRUE
						GROUP BY extension_versions.slug, extension_versions.version, extension_versions.type
						ORDER BY error_count DESC
						LIMIT ${ params.perPage } OFFSET ${ offset };`;

		const items = await BigQuery.query( query );

		return view.render( 'dashboard/verify-synthetic-data', { items } );
	}
}

module.exports = VerifySyntheticDataController;
