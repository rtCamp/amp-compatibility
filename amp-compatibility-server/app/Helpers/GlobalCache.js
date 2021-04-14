'use strict';

const Cache = use( 'App/Helpers/Cache' );

class GlobalCache extends Cache {

	/**
	 * Redis connection name.
	 *
	 * @return {String} Redis connection name.
	 */
	static get connectionName() {
		return 'global';
	}

}

module.exports = GlobalCache;
