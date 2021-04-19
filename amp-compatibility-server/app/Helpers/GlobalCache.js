'use strict';

const Cache = use( 'App/Helpers/Cache' );
const _ = require( 'underscore' );

class GlobalCache extends Cache {

	/**
	 * Redis connection name.
	 *
	 * @return {String} Redis connection name.
	 */
	static get connectionName() {
		return 'global';
	}

	/**
	 * To get key for Redis cache.
	 *
	 * @param {String} key Key of cache.
	 * @param {String} group Group name for which key will come. default is "default"
	 *
	 * @returns {string} Redis key.
	 */
	static getKey( key, group = 'default' ) {

		if ( _.isEmpty( key ) || ! _.isString( key ) ) {
			return '';
		}

		if ( _.isEmpty( group ) || ! _.isString( group ) ) {
			group = 'default';
		}

		group = this.slugify( group );
		key = this.slugify( key );

		/**
		 * For global redis keep name
		 * @type {string}
		 */
		let redisKey = `global:${ group }:${ key }`;

		return redisKey;
	}

}

module.exports = GlobalCache;
