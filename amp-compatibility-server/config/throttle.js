'use strict';

const Env = use( 'Env' );

module.exports = {
	/*
	|--------------------------------------------------------------------------
	| Throttle Driver
	|--------------------------------------------------------------------------
	|
	| The throttle driver to be used for selecting throttle cache driver. It
	| can be memory or redis.
	|
	| For `redis` driver, make sure to install and register `@adonisjs/redis`
	|
	*/
	driver: Env.get( 'THROTTLE_DRIVER', 'memory' ),

	/*
	|--------------------------------------------------------------------------
	| Redis config
	|--------------------------------------------------------------------------
	|
	| The configuration for the redis driver.
	|
	*/
	redis: {
		host: Env.get( 'QUEUE_REDIS_HOST', '127.0.0.1' ),
		port: Env.get( 'QUEUE_REDIS_PORT', 6379 ),
		password: Env.get( 'QUEUE_REDIS_PASSWORD', null ),
		db: 0,
		keyPrefix: Env.get( 'REDIS_KEYPREFIX', 'local' ),
	},
};
