'use strict';

const { Command } = require( '@adonisjs/ace' );
const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class RetryJob extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `retry:job
		 { --name=@value : Workers name. e.g. request, synthetic-data }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To add all jobs in queue';
	}

	async handle( args, options ) {

		const allowedWorker = [ 'request-queue', 'synthetic-queue', 'adhoc-synthetic-queue' ];

		let queueName = options.name || '';
		queueName = queueName.toLowerCase().trim();

		if ( _.isEmpty( queueName ) ) {
			this.error( 'Please provider worker name.' );
			return;
		}

		if ( ! allowedWorker.includes( queueName ) ) {
			this.error( 'Please provider valid worker name.' );
			return;
		}

		Logger.level = 'debug';

		const queueControllerList = {
			'request-queue': RequestQueueController,
			'synthetic-queue': SyntheticDataQueueController,
			'adhoc-synthetic-queue': AdhocSyntheticDataQueueController,
		};

		const queueController = queueControllerList[ queueName ];
		const perPage = 1000;

		do {

			const jobs = await queueController.queue.getJobs( 'failed', { size: perPage } );

			if ( _.isEmpty( jobs ) ) {
				break;
			}

			for ( const index in jobs ) {
				const job = jobs[ index ];

				if ( _.isEmpty( job ) ) {
					continue;
				}

				const jobID = job.id;
				let jobData = _.clone( job.data );

				// if ( 'request-queue' === queueName ) {
				// 	jobData = await queueController.databaseModel.query().select( 'data' ).where( 'uuid', jobID ).first();
				// 	jobData = Utility.maybeParseJSON( jobData.data ) || {};
				// } else {
				// 	jobData = _.clone( job.data );
				// }

				switch ( queueName ) {
					case 'adhoc-synthetic-queue':

						await queueController.queue.removeJob( jobID );
						await queueController.databaseModel.query().where( 'uuid', jobID ).delete(); // Remove job from synthetic queue table.
						await SyntheticDataQueueController.createJob( jobData );

						break;
					default:
						await queueController.queue.removeJob( jobID );
						await queueController.createJob( jobData );
						break;
				}

			}

		} while ( true );

		process.exit( 1 );

	}
}

module.exports = RetryJob;
