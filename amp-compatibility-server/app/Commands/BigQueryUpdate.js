'use strict';

const { Command } = require( '@adonisjs/ace' );

const BigQuery = use( 'App/BigQuery' );
const Config = use( 'Config' );

// Models
const SiteModel = use( 'App/Models/Site' );
const AmpValidatedUrlModel = use( 'App/Models/AmpValidatedUrl' );
const ErrorModel = use( 'App/Models/Error' );
const ErrorSourceModel = use( 'App/Models/ErrorSource' );
const UrlErrorRelationshipModel = use( 'App/Models/UrlErrorRelationship' );
const AuthorModel = use( 'App/Models/Author' );
const ExtensionModel = use( 'App/Models/Extension' );
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const AuthorRelationshipModel = use( 'App/Models/AuthorRelationship' );
const SiteToExtensionModel = use( 'App/Models/SiteToExtension' );

const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );
const { exit } = require( 'process' );

class BigQueryUpdate extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `big_query:update
			 { --create-view-only: To create only view.}`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To update BigQuery dataset with MySQL';
	}

	/**
	 * To handle functionality of command.
	 * To update local redis cache with bigquery.
	 *
	 * @return {Promise<void>}
	 */
	async handle( args, options ) {

		if ( true === options.createViewOnly ) {
			await this.createViews();
			this.success( `${ this.icon( 'success' ) } View created.`, '' );
			exit( 1 );
		}

		/**
		 * 1. Reset BigQuery dataset. ( Remove existing and create new one with same name )
		 */
		const bigQueryDatasetName = Config.get( 'bigquery.dataset' );

		const dropResponse = await BigQuery.dropDataset( bigQueryDatasetName );
		if ( true !== dropResponse ) {
			this.warn( `Fail to delete bigquery dataset.` );
		} else {
			this.success( `${ this.icon( 'success' ) } Dataset droped.` );
		}

		await Utility.sleep( 60 );

		const createResponse = await BigQuery.createDataset( bigQueryDatasetName );
		if ( true !== createResponse ) {
			this.error( `Fail to create bigquery dataset.` );
			exit( 1 );
		} else {
			this.success( `${ this.icon( 'success' ) } Dataset created.` );
		}

		await Utility.sleep( 60 );

		const databaseModels = [
			SiteModel,
			AmpValidatedUrlModel,
			ErrorModel,
			ErrorSourceModel,
			AuthorModel,
			ExtensionModel,
			ExtensionVersionModel,
			AuthorRelationshipModel,
			SiteToExtensionModel,
			UrlErrorRelationshipModel,
		];

		const perPage = 25000;

		/**
		 * 2. Create table.
		 * 3. Insert record in BigQuery record.
		 */
		for ( const index in databaseModels ) {

			const model = databaseModels[ index ];

			this.info( `\nTable : ${ model.table }` );

			/**
			 * 2. Create table.
			 */
			const bigQueryTableFields = await model.getBigQuerySchema();
			const bigQueryTableSchema = {
				fields: bigQueryTableFields,
			};

			await BigQuery.createTable( model.table, bigQueryTableSchema );

			this.completed( `${ this.icon( 'success' ) } Created `, model.table );

			/**
			 * 3. Insert record in BigQuery record.
			 */
			const queryArgs = model.getBigqueryQueryArgs();
			queryArgs.perPage = perPage;
			let currentPage = 0;
			let totalPage = 0;

			do {

				let items = [];
				currentPage = currentPage + 1;
				queryArgs.paged = currentPage;

				if ( 0 === totalPage ) {
					const result = await model.getResult( queryArgs );
					items = result.data;
					totalPage = result.lastPage;
				} else {
					queryArgs.withoutCount = true;
					items = await model.getResult( queryArgs );
				}

				items = _.toArray( items ).map( ( item ) => this.prepareItemForBQ( item ) );

				if ( currentPage > totalPage || _.isEmpty( items ) ) {
					break;
				}

				this.info( `\nInserting page ${ currentPage } / ${ totalPage }` );
				const response = await model.bigQueryInsertRowsAsStream( items );

				this.completed( 'Response ', Utility.jsonPrettyPrint( response ) );

				await Utility.sleep( 2 );

			} while ( true );

			await Utility.sleep( 10 );

		}

		this.success( `${ this.icon( 'success' ) } Tables are imported.` );

		/**
		 * 4. Create views and cached table in BigQuery.
		 */
		await this.createViews();
		this.success( `${ this.icon( 'success' ) } View created.` );

		exit( 1 );
	}

	/**
	 * Prepare row for Bigquery.
	 *
	 * @param {Object} item
	 *
	 * @return {{}}
	 */
	prepareItemForBQ( item ) {

		const preparedItem = {};

		for ( const field in item ) {
			let value = item[ field ];

			switch ( field ) {
				case 'created_at':
				case 'updated_at':
					const dateObject = new Date( value );
					const date = ( '0' + dateObject.getDate() ).slice( -2 );
					const month = ( '0' + ( dateObject.getMonth() + 1 ) ).slice( -2 );
					const year = dateObject.getFullYear();
					const hours = dateObject.getHours();
					const minutes = dateObject.getMinutes();
					const seconds = dateObject.getSeconds();

					value = `${ year }-${ month }-${ date } ${ hours }:${ minutes }:${ seconds }`;

					break;
				case 'text':
				case 'raw_data':
				case 'data':
				case 'error_log':
				case 'result':
				case 'message':
					value = value ? value.toString() : '';
					break;

			}

			preparedItem[ field ] = value;
		}

		return preparedItem;
	}

	/**
	 * To get list of queries for view.
	 *
	 * @return {Object}
	 */
	_getViewQueries() {

		const types = [ 'plugin', 'theme' ];

		const siteTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ SiteModel.table }` + '`';
		const extensionVersionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';

		const queries = {
			'amp_mode_group': `SELECT amp_mode, COUNT(1) AS row_count FROM ${ siteTable } GROUP BY amp_mode`,
			'amp_version_group': `SELECT amp_version, COUNT(1) AS row_count FROM ${ siteTable } GROUP BY amp_version`,
			'extension_error_group': `SELECT * FROM (
SELECT 1 AS index, 'None' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count = 0
UNION ALL
SELECT 2 AS index, '1 - 10' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count BETWEEN 1 AND 10
UNION ALL
SELECT 3 AS index, '11 - 50' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count BETWEEN 11 AND 50
UNION ALL
SELECT 4 AS index, '51 - 100' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count BETWEEN 51 AND 100
UNION ALL
SELECT 5 AS index, '101 - 250' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count BETWEEN 101 AND 250
UNION ALL
SELECT 6 AS index, '251 - 500' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count BETWEEN 251 AND 500
UNION ALL
SELECT 7 AS index, '500 - 1000' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count BETWEEN 500 AND 1000
UNION ALL
SELECT 8 AS index, 'Above 1000' AS label, count(*) AS value FROM ${ extensionVersionTable } WHERE error_count > 1000
) as extension_error_group ORDER BY index ASC`,
			'extensions_with_error_count': `SELECT extensions.*, extension_versions.error_count
FROM ${ extensionTable } AS extensions
	INNER JOIN ${ extensionVersionTable } AS extension_versions
	ON extensions.extension_slug = extension_versions.extension_slug AND extensions.latest_version = extension_versions.version
ORDER BY extensions.active_installs DESC, extensions.slug ASC`,
		};

		for ( const index in types ) {
			const type = types[ index ];

			const query = `SELECT * FROM (
SELECT 1 AS index, 'Below 100' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs BETWEEN 0 AND 100
UNION ALL
SELECT 2 AS index, '101 - 1K' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs BETWEEN 101 AND 1000
UNION ALL
SELECT 3 AS index, '1K - 10K' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs BETWEEN 1001 AND 10000
UNION ALL
SELECT 4 AS index, '10K - 100K' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs BETWEEN 10001 AND 100000
UNION ALL
SELECT 5 AS index, '100K - 500K' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs BETWEEN 100001 AND 500000
UNION ALL
SELECT 6 AS index, '500K - 1M' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs BETWEEN 500001 AND 1000000
UNION ALL
SELECT 7 AS index, 'Above 1M' AS label, count(*) AS value FROM ${ extensionTable } WHERE type='${ type }' AND active_installs > 1000000
) as active_install_group ORDER BY index ASC `;

			const dbname = `active_install_group_${ type }`;

			queries[ dbname ] = query;
		}

		return queries;
	}

	/**
	 * Create view for active install group.
	 *
	 * @return {Promise<*>}
	 */
	async createViews() {

		const queries = this._getViewQueries();

		for ( const dbname in queries ) {
			const query = queries[ dbname ];

			const viewName = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.view_${ dbname }` + '`';
			const cachedTableName = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.cached_${ dbname }` + '`';

			let bqQuery = `CREATE OR REPLACE VIEW ${ viewName } AS ( ${ query } );`;
			await BigQuery.query( bqQuery, true );

			bqQuery = `CREATE OR REPLACE TABLE ${ cachedTableName } AS ( SELECT * FROM ${ viewName } );`;
			await BigQuery.query( bqQuery, true );
		}

	}

}

module.exports = BigQueryUpdate;
