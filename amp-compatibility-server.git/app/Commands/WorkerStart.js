'use strict';

const { Command } = require( '@adonisjs/ace' );
const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const Logger = use( 'Logger' );

// Utilities
const _ = require( 'underscore' );

class WorkerStart extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return `worker:start
		 { --name=@value : Workers name. e.g. request, synthetic-data }
		 { --concurrency=@value : Worker's concurrency. }`;
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'To start worker to process for job queue.';
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {

		const allowedWorker = [ 'request', 'synthetic-data' ];

		let workerName = options.name || '';
		workerName = workerName.toLowerCase().trim();

		if ( _.isEmpty( workerName ) ) {
			this.error( 'Please provider worker name.' );
			return;
		}

		if ( ! allowedWorker.includes( workerName ) ) {
			this.error( 'Please provider valid worker name.' );
			return;
		}

		Logger.level = 'debug';

		const workerOptions = {
			concurrency: options.concurrency,
		};

		switch ( workerName ) {
			case 'request':
				await RequestQueueController.startWorker( workerOptions );
				break;
			case 'synthetic-data':
				await SyntheticDataQueueController.startWorker( workerOptions );
				break;
		}

		this.info( `Worker for "${ workerName }" started.` );

	}

}

module.exports = WorkerStart;
