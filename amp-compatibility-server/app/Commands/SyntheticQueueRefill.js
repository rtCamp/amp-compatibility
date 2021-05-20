'use strict';

const { Command } = require( '@adonisjs/ace' );

// Controllers
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );

// Models
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const ExtensionModel = use( 'App/Models/Extension' );
const SyntheticJobModel = use( 'App/Models/SyntheticJob' );

// Database
const Database = use( 'Database' );

// Helpers
const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const { exit } = require( 'process' );
const _ = require( 'underscore' );

class SyntheticQueueRefill extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `synthetic_queue:refill
		 { --only-themes : To generate synthetic data only for themes.. }
		 { --only-plugins : To generate synthetic data only for plugins.. }
		 { --plugin-active-install=@value : Active installs criteria for plugins to run synthetic data. The plugin must have more or equal active install to test. "0" means all the plugins. (Default = 0) }
		 { --theme-active-install=@value : Active installs criteria for themes to run synthetic data. The themes must have more or equal active install to test. "0" means all the plugins. (Default = 0) }
		 { --force: To generate synthetic data for extensions even if data is already exists. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
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
	 * To prepare options passed to the command.
	 *
	 * @param {Object} options Options passed to the command.
	 *
	 * @return void
	 */
	parseOptions( options ) {

		this.options = {
			onlyThemes: ( true === options.onlyThemes ),
			onlyPlugins: ( true === options.onlyPlugins ),
			pluginActiveInstall: ( ! isNaN( options.pluginActiveInstall ) && 0 < parseInt( options.pluginActiveInstall ) ) ? parseInt( options.pluginActiveInstall ) : 0,
			themeActiveInstall: ( ! isNaN( options.themeActiveInstall ) && 0 < parseInt( options.themeActiveInstall ) ) ? parseInt( options.themeActiveInstall ) : 0,
			force: ( true === options.force ),
		};

	}

	/**
	 * To prepare options passed to the command.
	 *
	 * @param {Object} options Options passed to the command.
	 *
	 * @return void
	 */
	async handle( args, options ) {
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
		const newJobCount = await this.refillQueue();

		const queueHealth = await this.queue.checkHealth();
		const totalJobs = parseInt( queueHealth.waiting + queueHealth.delayed );

		if ( 0 >= totalJobs ) {
			this.warn( 'There is not pending extension for that synthetic data is not generated.' );
		} else {
			this.info( `Total Jobs : ${ totalJobs }` );
			this.info( `New Jobs: ${ newJobCount }` );
		}

		exit( 1 );
	}

	/**
	 * To refill queue for synthetic data.
	 *
	 * @returns {Promise<number>} Number of jobs that added to the queue.
	 */
	async refillQueue() {

		const perPage = 50;
		let currentPage = 0;
		const previousVersionCap = 5;
		let newJobCount = 0;

		do {
			currentPage = currentPage + 1;

			const extensionsResult = await Database
				.select( 'extension_slug' )
				.from( ExtensionModel.table )
				.where( 'wporg', true )
				.where( ( query ) => {

					if ( true === this.options.onlyThemes ) {
						query.where( 'type', 'theme' );
					}

					if ( true === this.options.onlyPlugins ) {
						query.orWhere( 'type', 'theme' );
					}

				} )
				.where( ( query ) => {

					if ( this.options.pluginActiveInstall || this.options.themeActiveInstall ) {

						const activeInstallClause = [];
						activeInstallClause.push( `( extensions.type = 'plugin' AND extensions.active_installs >= ${ this.options.pluginActiveInstall } )` );
						activeInstallClause.push( `( extensions.type = 'theme' AND extensions.active_installs >= ${ this.options.themeActiveInstall } )` );

						query.whereRaw( ` ( ${ activeInstallClause.join( ' OR ' ) } ) ` );

					}

				} )
				.orderBy( 'active_installs', 'DESC' )
				.orderBy( 'slug', 'ASC' )
				.paginate( currentPage, perPage );

			const extensions = extensionsResult.data || [];

			/**
			 * If There is not extension left then bail out.
			 */
			if ( _.isEmpty( extensions ) ) {
				break;
			}

			this.info( `\n${ this.icon( 'info' ) } Processing ${ currentPage } / ${ extensionsResult.lastPage }` );

			const extensionSlugs = _.pluck( extensions, 'extension_slug' );

			for ( const index in extensionSlugs ) {
				const extensionSlug = extensionSlugs[ index ];
				const addedVersions = [];

				const { data: extensionVersions } = await Database
					.select( [ 'extension_version_slug', 'type', 'slug', 'version', 'has_synthetic_data', 'uuid' ] )
					.from( ExtensionVersionModel.table )
					.leftJoin( SyntheticJobModel.table, `${SyntheticJobModel.table}.domain`, `${ExtensionVersionModel.table}.extension_version_slug` )
					.where( 'extension_slug', extensionSlug )
					.whereNot( 'version', 'trunk' )
					.orderBy( 'version', 'DESC' )
					.paginate( 1, previousVersionCap );

				/**
				 * Extension Versions iteration.
				 */
				for ( const extensionVersionIndex in extensionVersions ) {
					const item = extensionVersions[ extensionVersionIndex ];

					// If we have synthetic data. And force option is not set then bail out.
					if( ! this.options.force &&
						(
							true === item.has_synthetic_data || // If we have synthetic data then don't add
							item.uuid // If it's already there then don't try to add.
						)
					) {
						continue;
					}

					const job = {
						domain: item.extension_version_slug,
						type: item.type,
						plugins: '',
						theme: '',
						ampSource: 'wporg',
					};

					if ( 'plugin' === item.type ) {
						job.plugins = item.slug + ':' + item.version;
					} else if ( 'theme' === item.type ) {
						job.theme = item.slug + ':' + item.version;
					}

					if ( this.options.force && item.uuid ) {
						await SyntheticDataQueueController.queue.removeJob( item.uuid );
					}

					await SyntheticDataQueueController.createJob( job );
					newJobCount++;

					addedVersions.push( item.version );

				}

				if ( ! _.isEmpty( addedVersions ) ) {
					this.info( `${ extensionSlug.padEnd( 80 ) } : ${ addedVersions.map( version => version.padEnd( 18 ) ).join( ' ' ) }` );
				}

			}

			await Utility.sleep( 2 );

		} while ( true );

		return newJobCount;
	}
}

module.exports = SyntheticQueueRefill;
