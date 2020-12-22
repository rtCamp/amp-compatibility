'use strict';

const { Command } = require( '@adonisjs/ace' );
const Queue = use( 'Bee/Queue' );
const Config = use( 'Config' );

class Worker extends Command {
	static get signature() {
		return 'worker';
	}

	static get description() {
		return 'Worker to process job queue of amp-comp data';
	}

	async handle( args, options ) {
		this.info( 'Processing job queue of amp-comp data.' );

		Queue.get( Config.get( 'queue.name' ) ).process( 1, function ( job, done ) {
				console.log( `Processing job ${ job.id }` );
				// job.data -> Contains queued data.
				// Actually process the data and insert it into BigQuery.
				return done( null, null );
			},
		);
	}
}

module.exports = Worker;
