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
		 { --number-of-instance=@value : Number of instance need to create for synthetic data process. ( Min= 1, Max= 100, Default= 1 ) }
		 { --concurrency=@value : Number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min= 1, Max= 120, Default= 100 ) }
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
		const numberOfInstance = parseInt( options.numberOfInstance ) || 1;

		this.options = {
			onlyThemes: ( true === options.onlyThemes ),
			onlyPlugins: ( true === options.onlyPlugins ),
			limit: ( ! isNaN( options.limit ) && 0 < parseInt( options.limit ) ) ? parseInt( options.limit ) : false,

			numberOfInstance: ( numberOfInstance >= 1 && numberOfInstance <= 100 ) ? numberOfInstance : 1,

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
		//await this.refillQueue();

		const queueHealth = await this.queue.checkHealth();
		const totalJobs = parseInt( queueHealth.waiting + queueHealth.delayed );

		if ( 0 >= totalJobs ) {
			this.warn( 'There is not pending extension for that synthetic data is not generated.' );
			exit( 1 );
		}

		/**
		 * Check for how many compute instance actually needed.
		 * If there are less jobs and more compute instance then reduce the number of compute instance.
		 */
		const totalConcurrency = ( this.options.concurrency * this.options.numberOfInstance );

		if ( totalConcurrency > totalJobs ) {
			this.options.numberOfInstance = Math.floor( totalJobs / this.options.concurrency ) || 1;
		}

		this.info( `Total Jobs : ${ totalJobs }` );
		this.info( `Number of compute instance  : ${ this.options.numberOfInstance }` );
		this.info( `Concurancy on each instance : ${ this.options.concurrency }` );
		this.info( '======================================================================' );

		let numberOfTerminatedInstance = 0;

		for ( let index = 1; index <= this.options.numberOfInstance; index++ ) {
			const instanceName = `synthetic-data-generator-${ index }`;

			this.getComputeInstance( instanceName ).then( ( instance ) => {

				/**
				 * Compute engine instance is ready.
				 * Start the synthetic data worker.
				 */
				Logger.info( `%s : Starting synthetic data worker.`, instanceName );

				instance.executeCommand(
					`cd $HOME/amp-compatibility-server && ` +
					`node ace worker:start --name=synthetic-data --concurrency=${ this.options.concurrency } 2>&1 | tee -a /var/log/adonis.log`,
				).then( async () => {

					Logger.info( `%s : Synthetic data jobs finished.`, instanceName );

					/**
					 * Preserver compute engine instance only if one instance is requested
					 * and prevent deletion flag passed as TRUE.
					 */
					if ( ! ( 1 === this.options.numberOfInstance && true === this.options.preventVmDeletion ) ) {
						await instance.delete();
					}

					numberOfTerminatedInstance++;

					if ( numberOfTerminatedInstance >= this.options.numberOfInstance ) {
						Logger.info( 'Synthetic data process completed.' );
						exit( 1 );
					}

				} );

			} ).catch( ( error ) => {
				console.error( instanceName, error );
			} );

		}

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
				const job = {
					domain: jobData.extension_version_slug,
					type: jobData.type,
					plugins: '',
					theme: '',
				};

				if ( 'plugin' === jobData.type ) {
					job.plugins = jobData.slug + ':' + jobData.version;
				} else if ( 'theme' === jobData.type ) {
					job.theme = jobData.slug + ':' + jobData.version;
				}

				await SyntheticDataQueueController.createJob( job );
				count++;
			}

		}

		return count;
	}

	async getComputeInstance( instanceName ) {

		if ( _.isEmpty( instanceName ) || ! _.isString( instanceName ) ) {
			throw 'Please provide instance name.';
		}

		const options = {
			name: instanceName,
		};

		// Create compute engine instance as secondary instance.
		const instance = new ComputeEngine( options );
		const isExists = await instance.getInstanceIfExists();

		if ( false === isExists ) {
			await instance.create();
			await instance.setup();
		}

		return instance;
	}

}

module.exports = SyntheticDataStart;
