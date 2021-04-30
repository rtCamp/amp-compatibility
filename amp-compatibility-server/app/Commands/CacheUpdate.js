'use strict';

const { Command } = require( '@adonisjs/ace' );

// Models
const AmpValidatedUrlModel = use( 'App/Models/BigQuery/AmpValidatedUrl' );
const AuthorModel = use( 'App/Models/BigQuery/Author' );
const AuthorRelationshipModel = use( 'App/Models/BigQuery/AuthorRelationship' );
const ErrorModel = use( 'App/Models/BigQuery/Error' );
const ErrorSourceModel = use( 'App/Models/BigQuery/ErrorSource' );
const ExtensionModel = use( 'App/Models/BigQuery/Extension' );
const ExtensionVersionModel = use( 'App/Models/BigQuery/ExtensionVersion' );
const SiteModel = use( 'App/Models/BigQuery/Site' );
const SiteToExtensionModel = use( 'App/Models/BigQuery/SiteToExtension' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQuery/UrlErrorRelationship' );
const SiteRequestModel = use( 'App/Models/BigQuery/SiteRequest' );

// Helpers
const Logger = use( 'Logger' );

// Utilities
const { exit } = require( 'process' );

class CacheUpdate extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return 'cache:update';
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To update local redis cache data with BigQuery.';
	}

	/**
	 * To handle functionality of command.
	 * To update local redis cache with bigquery.
	 *
	 * @return {Promise<void>}
	 */
	async handle() {

		const models = [
			AmpValidatedUrlModel,
			AuthorModel,
			AuthorRelationshipModel,
			ErrorModel,
			ErrorSourceModel,
			ExtensionModel,
			ExtensionVersionModel,
			SiteModel,
			SiteToExtensionModel,
			UrlErrorRelationshipModel,
			SiteRequestModel,
		];

		for ( let index in models ) {
			Logger.info( `- Table: %s`, models[ index ].table );
			const count = await models[ index ].updateCache();
			Logger.info( `- Records: %d` + "\n", count );
		}

		Logger.info( 'Redis cache is up to date with BigQuery.' );

		exit( 1 );
	}

}

module.exports = CacheUpdate;
