'use strict';

const { Command } = require( '@adonisjs/ace' );

// Models
const AmpValidatedUrlModel = use( 'App/Models/BigQueryAmpValidatedUrl' );
const AuthorModel = use( 'App/Models/BigQueryAuthor' );
const AuthorRelationshipModel = use( 'App/Models/BigQueryAuthorRelationship' );
const ErrorModel = use( 'App/Models/BigQueryError' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const SiteModel = use( 'App/Models/BigQuerySite' );
const SiteToExtensionModel = use( 'App/Models/BigQuerySiteToExtension' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQueryUrlErrorRelationship' );

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
