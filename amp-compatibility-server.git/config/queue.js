'use strict';

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use( 'Env' );

module.exports = {
	amp_comp: {
		redis: {
			host: Env.get( 'QUEUE_REDIS_HOST', '127.0.0.1' ),
		},
	},
	name: Env.get( 'QUEUE_NAME', 'amp_comp' ),
};
