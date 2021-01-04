'use strict';

const _ = require( 'underscore' );
const Redis = use( 'Redis' );
const Utility = use( 'App/Helpers/Utility' );
const Env = use( 'Env' );

class Cache {

	/**
	 * To get cached data.
	 *
	 * @param {String} key Key name.
	 * @param {String} group Group name. default value will be "default"
	 *
	 * @returns {Promise<string|*>}
	 */
	static async get( key, group = 'default' ) {

		const id = this.getKey( key, group );

		if ( _.isEmpty( id ) ) {
			return '';
		}

		let response = await Redis.get( id );
		response = Utility.maybeParseJSON( response );

		return response;
	}

	/**
	 * To set value in cache.
	 *
	 * @param {String} key Key name
	 * @param {String} data Data that need to store
	 * @param {*} group Group name. default value will be "default"
	 *
	 * @returns {Promise<boolean>}
	 */
	static async set( key, data, group = 'default' ) {

		const id = this.getKey( key, group );

		if ( _.isEmpty( data ) || _.isEmpty( id ) ) {
			return false;
		}

		if ( _.isArray( data ) || _.isObject( data ) ) {
			data = JSON.stringify( data );
		}

		try {
			await Redis.set( id, data );
		} catch ( exception ) {
			console.error( exception );
		}

		return true;
	}

	/**
	 * To delete cached value.
	 *
	 * @param {String} key Key to delete.
	 * @param {String} group Key from this group to delete. default is "default".
	 *
	 * @returns {Promise<boolean>}
	 */
	static async delete( key, group = 'default' ) {

		const id = this.getKey( key, group );

		if ( _.isEmpty( id ) ) {
			return false;
		}

		try {
			await Redis.del( id );
		} catch ( exception ) {
			console.error( exception );
		}

		return true;
	}

	/**
	 * To delete whole group of cache.
	 *
	 * @param {String} group Group to delete from cache.
	 *
	 * @returns {Promise<boolean>}
	 */
	static async deleteGroup( group ) {

		if ( _.isEmpty( group ) ) {
			return false;
		}

		try {
			await Redis.del( group );
		} catch ( exception ) {
			console.error( exception );
		}

		return true;
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
		let redisKey = `${ group }:${ key }`;

		return redisKey;
	}

	/**
	 * To flush all cache.
	 *
	 * @returns {Promise<*>}
	 */
	static async flushdb() {
		return await Redis.flushdb();
	}

	/**
	 * To quit cache connection.
	 *
	 * @returns {Promise<void>}
	 */
	static async close() {
		return await Redis.quit( Env.get( 'REDIS_CONNECTION', 'local' ) );
	}

	/**
	 * To slugify the string.
	 *
	 * @param {String} text String to make slugify.
	 *
	 * @returns {string} Slugify string.
	 */
	static slugify( text ) {
		return text
			.toString()
			.trim()
			.toLowerCase()
			.replace( /\s+/g, '-' )
			.replace( /[^\w\-]+/g, '-' )
			.replace( /\-\-+/g, '-' )
			.replace( /^-+/, '-' )
			.replace( /-+$/, '-' );
	}
}

module.exports = Cache;
