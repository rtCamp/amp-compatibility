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
			UrlErrorRelationshipModel,
			AuthorModel,
			ExtensionModel,
			ExtensionVersionModel,
			AuthorRelationshipModel,
			SiteToExtensionModel,
		];

		const perPage = 10000;

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

			do {

				currentPage = currentPage + 1;
				queryArgs.paged = currentPage;

				const result = await model.getResult( queryArgs );

				const items = _.toArray( result.data ).map( ( item ) => this.prepareItemForBQ( item ) );
				const totalPage = result.lastPage;

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

		/**
		 * 4. Create views and cached table in BigQuery.
		 */

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
}

module.exports = BigQueryUpdate;
