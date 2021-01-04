'use strict';

const { Command } = require( '@adonisjs/ace' );

// Controllers
const ComputeEngine = use( 'App/Controllers/ComputeEngine' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );

// Models
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );

// Helpers
const Logger = use( 'Logger' );
const BigQuery = use( 'App/BigQuery' );
const { exit } = require( 'process' );
const _ = require( 'underscore' );

class SyntheticDataStart extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return `synthetic-data:start
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
	 * Get synthetic data queue.
	 *
	 * @returns {*}
	 */
	get queue() {
		return SyntheticDataQueueController.queue;
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {

		Logger.level = 'debug';

		this.options = {
			onlyThemes: ( true === options.onlyThemes ),
			onlyPlugins: ( true === options.onlyPlugins ),
			limit: ( ! isNaN( options.limit ) && 0 < parseInt( options.limit ) ) ? parseInt( options.limit ) : false,
		};

		this.info( 'Fetching synthetic data jobs.' );

		// Refill queue with new tasks.
		await this.refillQueue();
		exit( 1 );

		const queueHealth = await this.queue.checkHealth();
		const totalJobs = parseInt( queueHealth.waiting + queueHealth.delayed );

		if ( 0 >= totalJobs ) {
			this.warn( 'There is not pending extension for that synthetic data is not generated.' );
			return;
		}

		this.info( `Synthetic data will be generated for ${ totalJobs } extensions (themes/plugins).` );

		// Create compute engine instance as secondary instance.
		this.computeEngine = new ComputeEngine();

		// Setup secondary instance.
		await this.computeEngine.create();
		await this.computeEngine.setup();
		await this.computeEngine.createSites();

		// Start synthetic data worker in secondary instance.
		await this.computeEngine.executeCommand( `node ace worker:start --name=synthetic-data --concurrency=10` );

		// Delete secondary instance.
		await this.computeEngine.delete();

		exit( 1 );
	}

	/**
	 * To refill queue for synthetic data.
	 *
	 * @returns {Promise<number>} Number of jobs that added to the queue.
	 */
	async refillQueue() {

		const versionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';

		let query = `SELECT extension_versions.extension_version_slug, extension_versions.type, extension_versions.slug, extension_versions.version
			FROM ${ versionTable } AS extension_versions
			INNER JOIN ${ extensionTable } AS extensions ON extension_versions.extension_slug = extensions.extension_slug
			WHERE extension_versions.has_synthetic_data != TRUE OR extension_versions.has_synthetic_data IS NULL 
				AND extensions.wporg = TRUE 
			`;

		let extensionClause = [];

		if ( true === this.options.onlyThemes ) {
			extensionClause.push(
				"extensions.type = 'theme'",
			);
		}

		if ( true === this.options.onlyPlugins ) {
			extensionClause.push(
				"extensions.type = 'plugin'",
			);
		}

		if ( ! _.isEmpty( extensionClause ) ) {
			query += ` AND ( ${ extensionClause.join( ' OR ' ) } )`;
		}

		query += ' ORDER BY extensions.active_installs DESC';

		if ( this.options.limit ) {
			query += ` LIMIT ${ this.options.limit }`;
		}

		query += ';';

		const result = await BigQuery.query( query );
		let count = 0;

		if ( _.isArray( result ) && ! _.isEmpty( result ) ) {

			for ( const index in result ) {
				const jobData = result[ index ];
				await SyntheticDataQueueController.createJob( jobData );
				count++;
			}

		}

		return count;
	}
}

module.exports = SyntheticDataStart;
