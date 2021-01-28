'use strict';

const BeeQueue = require( 'bee-queue' );

class Queue {

	/**
	 * Constructor method.
	 *
	 * @param config
	 */
	constructor( config ) {

		this.connection = config.connection;
		this.config = config[ this.connection ];

		if ( this.config.prefix ) {
			this.config.prefix += ':queues:';
		}

		this._queuesPool = {};
	}

	/**
	 * To get queue object bu name.
	 *
	 * @param {String} name Name of the queue.
	 *
	 * @returns {*}
	 */
	get( name ) {
		/**
		 * If there is an instance of queue already, then return it
		 */
		if ( this._queuesPool[ name ] ) {
			return this._queuesPool[ name ];
		}

		/**
		 * Create a new queue instance and save it's
		 * reference
		 */
		this._queuesPool[ name ] = new BeeQueue( name, this.config );

		/**
		 * Return the instance back
		 */
		return this._queuesPool[ name ];
	}
}

module.exports = Queue;
