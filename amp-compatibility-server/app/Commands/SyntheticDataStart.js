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
		 { --plugin-active-install=@value : Active installs criteria for plugins to run synthetic data. The plugin must have more or equal active install to test. "0" means all the plugins. (Default = 0) }
		 { --theme-active-install=@value : Active installs criteria for themes to run synthetic data. The themes must have more or equal active install to test. "0" means all the plugins. (Default = 0) }
		 { --limit=@value : The number of themes/plugins need to add to the queue and process.. }
		 { --number-of-instance=@value : The number of instances needs to create for the synthetic data process. ( Min=1, Max=100, Default=1 ) }
		 { --concurrency=@value : The number of jobs that need to run concurrently on each instance. (This number of site will create at a time on secondary server.) ( Min=1, Max=120, Default=100 ) }
		 { --vm-name=@value : Virtual machine name. ( Default=synthetic-data-generator ) }
		 { --prevent-vm-deletion : To prevent Compute engine instance to terminal. It will only prevent if there is only one instance.. }
		 { --force: To generate synthetic data for extensions even if data is already exists. }`;
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

			pluginActiveInstall: ( ! isNaN( options.pluginActiveInstall ) && 0 < parseInt( options.pluginActiveInstall ) ) ? parseInt( options.pluginActiveInstall ) : 0,
			themeActiveInstall: ( ! isNaN( options.themeActiveInstall ) && 0 < parseInt( options.themeActiveInstall ) ) ? parseInt( options.themeActiveInstall ) : 0,

			numberOfInstance: ( numberOfInstance >= 1 && numberOfInstance <= 100 ) ? numberOfInstance : 1,

			// Synthetic data worker.
			concurrency: ( concurrency >= 1 && concurrency <= 120 ) ? concurrency : 100,

			// For compute instance.
			vmName: ( ! _.isEmpty( options.vmName ) && _.isString( options.vmName ) ) ? options.vmName : 'synthetic-data-generator',

			preventVmDeletion: ( true === options.preventVmDeletion ),
			force: ( true === options.force ),
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

		if ( this.options.force ) {
			let answare = await this.ask(
				'Forcing generating synthetic data for extensions will remove any previous job information related to those extensions.\n' +
				'Are you sure you want to continue with that? [Y/N] : ',
			);

			answare = answare || '';
			answare = answare.toString().toLowerCase();
			if ( ! [ 'y', 'yes' ].includes( answare ) ) {
				exit( 1 );
			}
		}

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

						exit( 1 );
					}

				} );

			} ).catch( ( error ) => {
				console.error( instanceName, error );
			} );

		}

	}

	/**
	 * To update "has_synthetic_data" flag in extension version table.
	 *
	 * @return {Promise<void>}
	 */
	async updateSuccessJobs() {

		const table = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const queueHealth = await this.queue.checkHealth();
		const successJobCount = parseInt( queueHealth.succeeded );
		const queueJobs = await this.queue.getJobs( 'succeeded', { size: successJobCount } ) || [];
		let extensions = [];

		for ( const index in queueJobs ) {
			extensions.push( queueJobs[ index ].data.domain );
		}

		extensions = _.map( extensions, ExtensionVersionModel._prepareValueForDB );
		const extensionChunks = _.chunk( extensions, 200 );

		for ( const index in extensionChunks ) {
			const chunk = extensionChunks[ index ];
			const updateQuery = `UPDATE ${ table } SET has_synthetic_data = true WHERE ${ ExtensionVersionModel.primaryKey } IN ( ${ chunk.join( ', ' ) } );`;

			try {
				const response = await BigQuery.query( updateQuery );
				console.log( response );
			} catch ( exception ) {
				console.error( exception );
			}
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
			WHERE extensions.wporg = TRUE 
			`;

		if ( ! this.options.force ) {
			query += ' AND ( extension_versions.has_synthetic_data != TRUE OR extension_versions.has_synthetic_data IS NULL ) ';
		}

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

		if ( this.options.pluginActiveInstall || this.options.themeActiveInstall ) {

			let activeInstallClause = [];

			activeInstallClause.push( `( extensions.type = 'plugin' AND extensions.active_installs >= ${ this.options.pluginActiveInstall } )` );
			activeInstallClause.push( `( extensions.type = 'theme' AND extensions.active_installs >= ${ this.options.themeActiveInstall } )` );
			query += ` AND ( ${ activeInstallClause.join( ' OR ' ) } ) `;

		}

		query += ' ORDER BY extensions.active_installs DESC, extension_versions.slug ASC ';

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
					ampSource: 'wporg',
				};

				if ( this.options.force ) {
					await SyntheticDataQueueController.queue.removeJob( job.domain );
				}

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
