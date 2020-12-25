'use strict';

const { Command } = require( '@adonisjs/ace' );

// Models
const AuthorModel = use( 'App/Models/BigQueryAuthor' );
const AuthorRelationshipModel = use( 'App/Models/BigQueryAuthorRelationship' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const SiteModel = use( 'App/Models/BigQuerySite' );

// Utilities
const { exit } = require( 'process' );

class Cache extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return 'cache';
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'To update data cache';
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {

		const models = [
			SiteModel,
			AuthorModel,
			AuthorRelationshipModel,
			ExtensionModel,
			ExtensionVersionModel,
		];

		for ( let index in models ) {
			this.info( `Updating cache for ${ models[ index ].table }` );
			const count = await models[ index ].updateCache();
			this.info( `-- Table: ${ models[ index ].table }, No of records: ${ count }` + "\n" );
		}

		this.success( 'Redis cache is up to date with BigQuery' );

		exit( 1 );
	}

}

module.exports = Cache;
