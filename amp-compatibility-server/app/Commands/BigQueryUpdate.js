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
		return 'big_query:update';
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

		/**
		 * 1. Reset BigQuery dataset. ( Remove existing and create new one with same name )
		 */
		const bigQueryDatasetName = Config.get( 'bigquery.dataset' );

		const dropResponse = await BigQuery.dropDataset( bigQueryDatasetName );
		if ( true !== dropResponse ) {
			this.warn( `Fail to delete bigquery dataset.` );
		}

		const createResponse = await BigQuery.createDataset( bigQueryDatasetName );
		if ( true !== createResponse ) {
			this.error( `Fail to create bigquery dataset.` );
			exit( 1 );
		}

		const databaseModels = [
			SiteModel,
			AmpValidatedUrlModel,
			ErrorModel,
			ErrorSourceModel,
			UrlErrorRelationshipModel,
			AuthorModel,
			ExtensionModel,
			ExtensionVersionModel,
			AuthorRelationshipModel,
			SiteToExtensionModel,
		];

		const perPage = 10000;

		/**
		 * 2. Create table for each necessary tables.
		 * 3. Insert record in BigQuery record.
		 */
		for( const index in databaseModels ) {

			const model = databaseModels[index];

			this.info( `\n\nTable : ${ model.table }` );
			/**
			 * 2. Create table for each necessary tables.
			 */
			const bigQueryTableFields = await model.getBigQuerySchema();
			const bigQueryTableSchema = {
				fields: bigQueryTableFields,
			};

			await BigQuery.createTable( model.table, bigQueryTableSchema );

			this.success( `${this.icon('success')} "${ model.table }" created` )

			/**
			 * 3. Insert record in BigQuery record.
			 */
			const queryArgs = model.getBigqueryQueryArgs();
			queryArgs.perPage = perPage;
			let currentPage = 0;

			do {

				currentPage = currentPage + 1;
				queryArgs.paged = currentPage;


				const result = await model.getResult( queryArgs );

				const items = _.toArray( result.data );
				const totalPage = result.lastPage;

				if ( currentPage > totalPage || _.isEmpty( items ) ) {
					break;
				}

				this.info( `Inserting page ${ currentPage } / ${ totalPage }` );
				await model.bigQueryInsertRowsAsStream( items );

				await Utility.sleep( 2 );

			} while ( true );


			await Utility.sleep( 10 );

		}

		/**
		 * 4. Create views and cached table in BigQuery.
		 */


	}
}

module.exports = BigQueryUpdate;
