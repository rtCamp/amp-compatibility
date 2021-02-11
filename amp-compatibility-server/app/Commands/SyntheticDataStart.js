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
const Storage = use( 'Storage' );
const BigQuery = use( 'App/BigQuery' );
const Utility = use( 'App/Helpers/Utility' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const { exit } = require( 'process' );
const _ = require( 'underscore' );

class SyntheticDataStart extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `synthetic-data:start
		 { --only-themes : To generate synthetic data only for themes.. }
		 { --only-plugins : To generate synthetic data only for plugins.. }
		 { --limit=@value : The number of themes/plugins need to add to the queue and process.. }
		 { --number-of-instance=@value : The number of instances needs to create for the synthetic data process. ( Min=1, Max=100, Default=1 ) }
		 { --concurrency=@value : The number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min=1, Max=120, Default=100 ) }
		 { --vm-name=@value : Virtual machine name. ( Default=synthetic-data-generator ) }
		 { --prevent-vm-deletion : To prevent Compute engine instance to terminal. It will only prevent if there is only one instance.. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To refill synthetic data queue with any possible jobs and start process for synthetic data.';
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
	 * To prepare options passed to the command.
	 *
	 * @param {Object} options Options passed to the command.
	 *
	 * @return void
	 */
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
	 * To handle functionality of command.
	 * - To refill synthetic-data queue.
	 * - Create compute instance if not exists and setup.
	 * - Run synthetic data processes in those instance.
	 * - Terminate the compute instance.
	 *
	 * @param {Object} args Argument passed in command.
	 * @param {Object} options Options passed in command.
	 *
	 * @return {Promise<void>}
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
		const date = Utility.getCurrentDate().replace( / |:/g, '-' );
		let logDirPath = Utility.logPath() + `/secondary-server/${ date }`;

		await FileSystem.assureDirectoryExists( logDirPath );

		for ( let index = 1; index <= this.options.numberOfInstance; index++ ) {
			const instanceName = `synthetic-data-generator-${ index }`;

			this.getComputeInstance( instanceName ).then( async ( instance ) => {

				const logFilename = `${ instanceName }-jobs.log`;

				const primaryInstanceLogFilePath = `${ Utility.logPath() }/secondary-server/${ date }/${ logFilename }-jobs.log`;
				const secondaryInstanceLogFilePath = `/tmp/${ logFilename }`;

				await FileSystem.assureDirectoryExists(primaryInstanceLogFilePath);

				/**
				 * Compute engine instance is ready.
				 * Start the synthetic data worker.
				 */
				Logger.info( `%s : Starting synthetic data worker.`, instanceName );

				instance.executeCommand(
					`cd $HOME/amp-compatibility/amp-compatibility-server && ` +
					`mkdir -p ${ logDirPath } && ` +
					`node ace worker:start --name=synthetic-data --concurrency=${ this.options.concurrency } 2>&1 | tee -a ${ logFilePath }`,
				).then( async () => {

					Logger.info( `%s : Synthetic data jobs finished.`, instanceName );

					/**
					 * Copy log file from remote server (secondary instance) to primary instance.
					 */
					await instance.copyFileFromRemote( secondaryInstanceLogFilePath, primaryInstanceLogFilePath );

					/**
					 * Upload log file to GCP storage.
					 */
					await Storage.uploadFile( primaryInstanceLogFilePath );

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
	 * To create compute instance or use existing one by name and setup the instance.
	 *
	 * @param {String} instanceName Name of the compute instance.
	 *
	 * @return {ComputeEngine} Compute engine instance.
	 */
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
				'extensions.type = \'theme\'',
			);
		}

		if ( true === this.options.onlyPlugins ) {
			extensionClause.push(
				'extensions.type = \'plugin\'',
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

}

module.exports = SyntheticDataStart;
