'use strict';

const { Command } = require( '@adonisjs/ace' );

// Controllers
const ComputeEngine = use( 'App/Controllers/ComputeEngine' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );

// Models
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const ExtensionModel = use( 'App/Models/Extension' );

// Helpers
const Logger = use( 'Logger' );
const Storage = use( 'Storage' );
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
		 { --number-of-instance=@value : The number of instances needs to create for the synthetic data process. ( Min=1, Max=100, Default=1 ) }
		 { --concurrency=@value : The number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min=1, Max=120, Default=100 ) }
		 { --vm-name=@value : Virtual machine name. ( Default=synthetic-data-generator ) }
		 { --prevent-vm-deletion : To prevent Compute engine instance to terminal. It will only prevent if there is only one instance. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To start process for synthetic data.';
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

				const primaryInstanceLogFilePath = `${ Utility.logPath() }/secondary-server/${ date }/${ logFilename }`;
				const secondaryInstanceLogFilePath = `/tmp/${ logFilename }`;

				await FileSystem.assureDirectoryExists( primaryInstanceLogFilePath );

				/**
				 * Compute engine instance is ready.
				 * Start the synthetic data worker.
				 */
				Logger.info( `%s : Starting synthetic data worker.`, instanceName );

				instance.executeCommand(
					`cd $HOME/amp-compatibility/amp-compatibility-server && ` +
					`mkdir -p ${ logDirPath } && ` +
					`node ace worker:start --name=synthetic-data --concurrency=${ this.options.concurrency } 2>&1 | tee ${ secondaryInstanceLogFilePath }`,
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
						Logger.info( 'Updating flag for synthetic data.' );
						await this.updateSuccessJobs();

						await Utility.sleep( 10 );
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
	 * To update "has_synthetic_data" flag in extension version table.
	 *
	 * @return {Promise<void>}
	 */
	async updateSuccessJobs() {

		const queueHealth = await this.queue.checkHealth();
		const successJobCount = parseInt( queueHealth.succeeded );
		const queueJobs = await this.queue.getJobs( 'succeeded', { size: successJobCount } ) || [];
		let extensions = [];

		for ( const index in queueJobs ) {
			extensions.push( queueJobs[ index ].data.domain );
		}

		const extensionChunks = _.chunk( extensions, 200 );

		for ( const index in extensionChunks ) {
			const chunk = extensionChunks[ index ];

			try {

				const response = await ExtensionVersionModel.query()
															.where( 'extension_version_slug', 'IN', chunk )
															.update( { 'has_synthetic_data': true } );

				console.log( response );
			} catch ( exception ) {
				console.error( exception );
			}
		}

	}

}

module.exports = SyntheticDataStart;
