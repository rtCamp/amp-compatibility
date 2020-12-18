'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use( 'Model' );
const BigQuery = use( 'App/BigQuery' );
const Cache = use( 'App/Helpers/Cache' );
const _ = require( 'underscore' );

class BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return ''
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return '';
	}

	/**
	 * Maximum number of row that can save in single BigQuery job.
	 * In other words, Maximum number of query ( insert/update ) can execute in single job.
	 *
	 * @returns {number}
	 */
	static get maxRowToSave() {
		return 10000;
	}

	/**
	 * Get BigQuery table object.
	 *
	 * @note DO NOT override this.
	 *
	 * @returns {Table} BigQuery table object.
	 */
	static get getBigQueryTable() {
		return BigQuery.dataset.table( this.table );
	}

	/**
	 * Check if row is exists or not in table based on primary key value.
	 *
	 * @param {String} key Primary key's value to check.
	 *
	 * @returns {Promise<boolean>}
	 */
	static async isRowExists( key ) {

		// First check in local cache.
		const value = Cache.get( key, this.table );

		// @Todo: If value is empty then maybe check with actual BigQuery query.

		return ! _.isEmpty( value );
	}

	/**
	 * To save multiple row in BigQuery.
	 *
	 * @param {Array} items List of items.
	 *
	 * @returns {Promise<boolean>} True on success Otherwise False.
	 */
	static async saveMany( items ) {

		if ( ! _.isArray( items ) ) {
			return false;
		}

		/**
		 * We can not move this function our side of this scope.
		 * Otherwise there is chance that it will use by other classes.
		 *
		 * @param {Array} items List of items.
		 * @returns {Promise<void>}
		 *
		 * @private
		 */
		const _saveChunk = async ( items ) => {

			const insertItems = [];

			for ( let index in items ) {

				const item = items[ index ];
				const data = {
					insertId: item[ this.primaryKey ],
					json: item,
				};

				insertItems.push( data );

			}

			/**
			 * Reference for options https://googleapis.dev/nodejs/bigquery/latest/Table.html#insert
			 *
			 * @Todo: Check the response from callback and handle it.
			 */
			await this.getBigQueryTable.insert( insertItems, { raw: true } );

		};

		// Normalize all the items.
		this.normalize = this.normalize.bind( this );

		items = items.map( this.normalize );
		items = this.removeDuplicate( items );

		// Chunk it in small sizes.
		let itemsChunks = _.chunk( items, this.maxRowToSave );

		// save each chunk.
		for ( let index in itemsChunks ) {
			const items = itemsChunks[ index ];
			await _saveChunk( items );
		}

	}

	/**
	 * To normalize single item.
	 *
	 * @param {Object} item Single Item.
	 *
	 * @returns {boolean|Object} False on fail otherwise normalized item.
	 */
	static normalize( item ) {

		// Item should be the object.
		if ( ! _.isObject( item ) ) {
			return false;
		}

		// Bail out, if data don't have primary key value.
		if ( _.isEmpty( item[ this.primaryKey ] ) ) {
			return false;
		}

		let normalizedItem = {};
		for ( let field in this.fields ) {

			const fieldDetail = this.fields[ field ];
			const isEmpty = (
				! _.has( item, field ) || _.isEmpty( item[ field ] )
			);

			if ( true === fieldDetail.required && isEmpty ) {
				return false;
			}

			if ( ! isEmpty ) {
				normalizedItem[ field ] = this.sanitizeFieldValue( field, item[ field ] );
			} else {
				normalizedItem[ field ] = (
					'function' === typeof fieldDetail.default
				) ? fieldDetail.default() : fieldDetail.default;
			}

		}

		return normalizedItem;
	}

	/**
	 * Sanitize value based on field provided.
	 *
	 * @param {String} field Table field.
	 * @param {String} value Value to sanitize.
	 *
	 * @returns {string|(string|number|boolean)} Sanitized value.
	 */
	static sanitizeFieldValue( field, value ) {

		if ( _.isEmpty( field ) || _.isEmpty( this.fields[ field ] ) ) {
			return '';
		}

		const fieldData = this.fields[ field ];
		let dbValue = value;

		if ( 'UUID' === field ) {
			dbValue = 'GENERATE_UUID()';
		} else if ( 'string' === fieldData.type ) {
			dbValue = value;
		} else if ( 'integer' === fieldData.type ) {
			dbValue = parseInt( value ) || 0;
		} else if ( 'float' === fieldData.type ) {
			dbValue = parseFloat( value ) || 0;
		} else if ( 'boolean' === fieldData.type ) {
			dbValue = ! _.isEmpty( value );
		}

		return dbValue;
	}

	/**
	 * Remove duplicate item.
	 *
	 * @param {Array} items List of items to check.
	 *
	 * @returns {Array} List of items after removing duplicates.
	 */
	static removeDuplicate( items ) {

		// Remove duplicate.
		let list = [];

		items = _.filter( items, ( item ) => {
			const primaryValue = item[ this.primaryKey ];

			if ( _.isEmpty( primaryValue ) ) {
				return false;
			}

			if ( list.includes( primaryValue ) ) {
				return false;
			}

			list.push( primaryValue );

			return true;
		} );

		return items;
	}
}

module.exports = BigQueryBase;
