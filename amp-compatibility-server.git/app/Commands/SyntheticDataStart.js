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
		 { --limit=@value : Number of theme/plugin need add in queue. }
		 { --concurrency=@value : Worker's concurrency. (This number of site will create at a time on secondary server.) ( Min= 1, Max= 120, Default= 100 ) }
		 { --vm-name=@value : Virtual machine name. (Default: synthetic-data-generator) }
		 { --prevent-vm-deletion : Fetch all the themes. }`;
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

	parseOptions( options ) {

		const concurrency = parseInt( options.concurrency ) || 100;

		this.options = {
			onlyThemes: ( true === options.onlyThemes ),
			onlyPlugins: ( true === options.onlyPlugins ),
			limit: ( ! isNaN( options.limit ) && 0 < parseInt( options.limit ) ) ? parseInt( options.limit ) : false,

			// Synthetic data worker.
			concurrency: ( concurrency >= 1 && concurrency <= 120 ) ? concurrency : 100,

			// For compute instance.
			vmName: ( ! _.isEmpty( options.vmName ) && _.isString( options.vmName ) ) ? options.vmName : 'synthetic-data-generator',

			preventVmDeletion: ( true === options.preventVmDeletion ),
		};

	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {

		Logger.level = 'debug';

		this.parseOptions( options );

		// Refill queue with new tasks.
		this.info( 'Fetching synthetic data jobs.' );
		await this.refillQueue();

		const queueHealth = await this.queue.checkHealth();
		const totalJobs = parseInt( queueHealth.waiting + queueHealth.delayed );

		if ( 0 >= totalJobs ) {
			this.warn( 'There is not pending extension for that synthetic data is not generated.' );
			exit( 1 );
		}

		this.info( `Synthetic data will be generated for ${ totalJobs } extensions (themes/plugins).` );

		try {

			// Setup secondary instance.
			await this.getComputeEngine();

		} catch ( exception ) {
			console.error( exception );
		}

		// Start synthetic data worker in secondary instance.
		this.info( 'Starting worker for synthetic data on compute instance.' );
		await this.computeEngine.executeCommand( `cd $HOME/amp-compatibility-server && node ace worker:start --name=synthetic-data --concurrency=${ this.options.concurrency } > /var/log/adonis.log 2>&1` );

		if ( false === this.options.preventVmDeletion ) {
			this.info( 'Deleting compute instance.' );
			await this.computeEngine.delete();
		}

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

	async getComputeEngine() {

		const options = {
			name: this.options.vmName,
		};

		// Create compute engine instance as secondary instance.
		this.computeEngine = new ComputeEngine( options );

		const isExists = await this.computeEngine.getInstanceIfExists();

		if ( false === isExists ) {

			await this.computeEngine.create();
			this.info( 'Compute instance created.' );

			await this.computeEngine.setup();
			this.info( 'Setup Completed on compute instance.' );

		}

	}

}

module.exports = SyntheticDataStart;
