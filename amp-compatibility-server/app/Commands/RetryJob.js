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
		 { --name=@value : Workers name. e.g. request, synthetic-data }
		 { --status=@value : Which status's jobs need to re add. e.g. active, succeeded, failed (Default failed) }`;
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
		const allowedStatus = [ 'active', 'succeeded', 'failed' ];

		let queueName = options.name || '';
		let status = options.status || 'failed';

		queueName = queueName.toLowerCase().trim();
		status = status.toLowerCase().trim();

		if ( _.isEmpty( queueName ) ) {
			this.error( 'Please provider worker name.' );
			return;
		}

		if ( ! allowedWorker.includes( queueName ) ) {
			this.error( 'Please provider valid worker name.' );
			return;
		}

		if ( ! allowedStatus.includes( status ) ) {
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

		let page = {
			start: 0,
			end: perPage,
		};

		if ( [ 'failed', 'succeeded' ].includes( status ) ) {
			page = { size: perPage };
		}

		do {

			const jobs = await queueController.queue.getJobs( status, page );

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
