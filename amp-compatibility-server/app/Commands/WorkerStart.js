'use strict';

const { Command } = require( '@adonisjs/ace' );
const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const SyntheticDataQueueController = use( 'App/Controllers/Queue/SyntheticDataController' );
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );
const Logger = use( 'Logger' );

// Utilities
const _ = require( 'underscore' );

class WorkerStart extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `worker:start
		 { --name=@value : Workers name. e.g. request, synthetic-data }
		 { --concurrency=@value : Worker's concurrency. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To start worker to process for job queue.';
	}

	/**
	 * To handle functionality of command.
	 * To start work for given queue.
	 *
	 * @param {Object} args Argument passed in command.
	 * @param {Object} options Options passed in command.
	 *
	 * @return {Promise<void>}
	 */
	async handle( args, options ) {

		const allowedWorker = [ 'request', 'synthetic-data', 'adhoc-synthetic-data' ];

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
			name: workerName,
			concurrency: options.concurrency,
		};

		switch ( workerName ) {
			case 'request':
				await RequestQueueController.startWorker( workerOptions );
				break;
			case 'synthetic-data':
				await SyntheticDataQueueController.startWorker( workerOptions );
				break;
			case 'adhoc-synthetic-data':
				await AdhocSyntheticDataQueueController.startWorker( workerOptions );
				break;
		}

		this.info( `Worker for "${ workerName }" started.` );

	}

}

module.exports = WorkerStart;
