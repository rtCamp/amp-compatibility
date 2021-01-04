'use strict';

const { Command } = require( '@adonisjs/ace' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );

const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const BigQuery = use( 'App/BigQuery' );

const { exit } = require( 'process' );
const _ = require( 'underscore' );

class SyntheticDataRefill extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return `synthetic-data:refill
		 { --only-themes : Fetch all the themes. }
		 { --only-plugins : Fetch all the plugins. }
		 { --limit=@value : Number of theme/plugin need add in queue. }`;
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'To refill synthetic data queue with any possible jobs.';
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {

		const versionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';

		const query = `SELECT extension_versions.extension_version_slug, extension_versions.type, extension_versions.slug, extension_versions.version
			FROM ${ versionTable } AS extension_versions
			INNER JOIN ${ extensionTable } AS extensions ON extension_versions.extension_slug = extensions.extension_slug
			WHERE extension_versions.has_synthetic_data != TRUE OR extension_versions.has_synthetic_data IS NULL 
				AND extensions.wporg = TRUE 
			ORDER BY extensions.active_installs DESC;`;

		const result = await BigQuery.query( query );

		if ( ! _.isArray( result ) || _.isEmpty( result ) ) {
			this.warn( 'No job found for synthetic data' );
			return;
		}

		for ( const index in result ) {
			const jobData = result[ index ];
			await SyntheticDataQueueController.createJob( jobData );
		}

		this.info( `${ result.length } number of added to the queue.` );

		exit( 1 );
	}
}

module.exports = SyntheticDataRefill;
