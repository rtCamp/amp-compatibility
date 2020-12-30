'use strict';

const { Command } = require( '@adonisjs/ace' );
const RequestQueueController = use( 'App/Controllers/RequestQueueController' );

class Worker extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return 'worker';
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'Worker to process job queue of amp-comp data';
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {
		this.info( 'Processing requests queue.' );

		RequestQueueController.startWorker();
	}
}

module.exports = Worker;
