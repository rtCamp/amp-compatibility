'use strict';

/** @typedef {import('@adonisjs/framework/src/View')} View */

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use( 'Env' );
const Database = use( 'Database' );

const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

class SystemReportController {

	/**
	 * To render system report page.
	 *
	 * @param {object} ctx
	 * @param {View} view View object
	 *
	 * @return {Promise<*>}
	 */
	async index( { view } ) {

		/**
		 * Database table information.
		 */
		const databaseInfo = await this._getDatabaseInformation();
		const databaseInfoTableArgs = {
			headings: {
				name: 'Name',
				row_count: 'row_count',
				data_size: 'Data Size (MB)',
				index_size: 'Index Size (MB)',
				total_size: 'Total Size (MB)',
				free_size: 'Data Free Size (MB)',
			},
			items: databaseInfo,
		};

		/**
		 * Queue status count.
		 */
		const queueInformation = await this._getQueueInformation();

		return view.render( 'dashboard/system-report', {
			databaseInfoTableArgs,
			queueInformation,
		} );
	}

	/**
	 * To get database table information.
	 *
	 * @private
	 *
	 * @return {Promise<*>}
	 */
	async _getDatabaseInformation() {
		const databaseName = Env.get( 'DB_DATABASE', 'adonis' );

		const query = `SELECT TABLE_NAME AS name,
							TABLE_ROWS AS row_count,
							(DATA_LENGTH / 1024 / 1024) AS data_size,
							(INDEX_LENGTH / 1024 / 1024) AS index_size,
							((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024) AS total_size,
							(DATA_FREE / 1024 / 1024) AS data_free_size
						FROM information_schema.TABLES
						WHERE TABLE_SCHEMA = '${ databaseName }'
						ORDER BY total_size DESC;`;

		const [ result ] = await Database.raw( query );

		return result;
	}

	/**
	 * To get queue information.
	 *
	 * @private
	 *
	 * @return {Promise<{}>}
	 */
	async _getQueueInformation() {

		const response = {};
		const queueControllers = {
			RequestQueueController,
			SyntheticDataQueueController,
			AdhocSyntheticDataQueueController,
		};

		for ( const index in queueControllers ) {
			const queueController = queueControllers[ index ];

			/**
			 * Redis data.
			 */
			const redisQueueHealth = await queueController.queue.checkHealth();

			/**
			 * Database data.
			 */
			const databaseCountResult = await Database
				.select( 'status' )
				.count( 'status AS count' )
				.from( queueController.databaseModel.table )
				.groupBy( 'status' );
			const databaseCounts = {};
			databaseCountResult.map( ( item ) => {
				databaseCounts[ item.status ] = item.count || 0;
			} );

			/**
			 * Merge both data.
			 */
			const queueName = queueController.queueName;
			response[ queueName ] = {
				name: queueName,
				items: [],
			};

			for ( const status in redisQueueHealth ) {

				const rowItem = {
					status: status,
					redis: redisQueueHealth[ status ] || '-',
					database: databaseCounts[ status ] || '-',
				};

				response[ queueName ].items.push( rowItem );
			}
		}

		return response;
	}
}

module.exports = SystemReportController;
