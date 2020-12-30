'use strict';

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use( 'Env' );

module.exports = {

	name: Env.get( 'QUEUE_NAME', 'local' ),

	/*
	|--------------------------------------------------------------------------
	| connection
	|--------------------------------------------------------------------------
	|
	| Redis connection to be used by default.
	|
	*/
	connection: Env.get( 'QUEUE_CONNECTION', 'local' ),

	local: {
		prefix: Env.get( 'REDIS_KEYPREFIX', 'local' ),
		redis: {
			host: Env.get( 'QUEUE_REDIS_HOST', '127.0.0.1' ),
		},
		removeOnSuccess: true,
	},

};
