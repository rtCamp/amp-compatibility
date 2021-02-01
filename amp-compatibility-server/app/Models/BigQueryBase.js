'use strict';

const BigQuery = use( 'App/BigQuery' );
const Cache = use( 'App/Helpers/Cache' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );
const Encryption = use( 'Encryption' );

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
	 * Primary key of the table.
	 *
	 * @returns {string} Primary key name.
	 */
	static get primaryKey() {
		return '';
	}

	/**
	 * Foreign key of the table.
	 *
	 * @returns {string} Foreign key name.
	 */
	static get foreignKey() {
		return this.primaryKey;
	}

	/**
	 * To get primary key's value for provided data.
	 *
	 * @param {Object} item To get primary value of record.
	 *
	 * @returns {string} Value for primary key.
	 */
	static getPrimaryValue( item ) {
		return ( _.has( item, this.primaryKey ) && ! _.isEmpty( item[ this.primaryKey ] ) ) ? item[ this.primaryKey ] : '';
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {};
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return false;
	}

	/**
	 * Maximum number of row that can save in single BigQuery job.
	 * In other words, Maximum number of query ( insert/update ) can execute in single job.
	 *
	 * @returns {number}
	 */
	static get maxRowToSave() {
		return 50000;
	}

	/**
	 * The attribute name for created at date time.
	 *
	 * @attribute createdAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get createdAtColumn() {
		return '';
	}

	/**
	 * The attribute name for updated at date time.
	 *
	 * @attribute updatedAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get updatedAtColumn() {
		return '';
	}

	/**
	 * Function to update cache from
	 *
	 * @returns {Promise<number>}
	 */
	static async updateCache() {

		let count = 0;

		try {
			let nextQuery = {
				autoPaginate: false,
			};
			let currentPage = 0;

			do {
				let rows = [];
				let apiResponse = {};
				currentPage++;

				[ rows, nextQuery, apiResponse ] = await this.getBigQueryTable.getRows( nextQuery );

				if ( _.isObject( rows ) ) {
					count = count + rows.length;
					this.setCache( rows );
				}

			} while ( _.isObject( nextQuery ) );

		} catch ( exception ) {
			console.log( exception );
		}

		return count;
	}

	/**
	 * Store single or multiple items in cache.
	 *
	 * @param {Object|Array} items Store single or multiple item into cache.
	 *
	 * @returns {Promise<void>}
	 */
	static async setCache( items ) {

		const saveCache = async ( item ) => {
			const clonedItem = _.clone( item );
			const primaryValue = _.isString( clonedItem[ this.primaryKey ] ) ? clonedItem[ this.primaryKey ] : false;

			// Bail out if row don't have primary value.
			if ( false === primaryValue ) {
				return;
			}

			const data = Encryption.encrypt( clonedItem );

			await Cache.set( primaryValue, data, this.table );
		};

		items = Array.isArray( items ) ? items : [ items ];

		for ( let index in items ) {
			await saveCache( items[ index ] );
		}

	}

	/**
	 * To check whether we need perform any action in BigQuery for this item or not
	 * And if we need then what it will be? update or insert.
	 *
	 * -1 : No primary value provided. [Error]
	 * 0 : For no action needed.
	 * 1 : Item need to insert.
	 * 2 : Item need to update.
	 *
	 * @param {Object} item Item to verify.
	 *
	 * @returns {Promise<number>}
	 */
	static async verify( item ) {

		const primaryValue = _.isString( item[ this.primaryKey ] ) ? item[ this.primaryKey ] : false;

		// Bail out if row don't have primary value.
		if ( false === primaryValue ) {
			return -1;
		}

		const encryptedStoredItem = await Cache.get( primaryValue, this.table );
		const storedItem = Encryption.decrypt( encryptedStoredItem );

		const clonedItem = _.clone( item );

		/**
		 * If we don't have store hash then we need to insert that item.
		 */
		if ( ! storedItem ) {
			return 1;
		}

		/**
		 * Do not consider diff of updated_at and created_at field.
		 * Since those field likely to change every time we proccess data.
		 */
		if ( ! _.isEmpty( this.updatedAtColumn ) ) {
			delete ( clonedItem[ this.updatedAtColumn ] );
			delete ( storedItem[ this.updatedAtColumn ] );
		}

		if ( ! _.isEmpty( this.createdAtColumn ) ) {
			delete ( clonedItem[ this.createdAtColumn ] );
			delete ( storedItem[ this.createdAtColumn ] );
		}

		/**
		 * If we have stored hash and that does not match with new hash
		 * Then we need to update it.
		 */
		if ( ! _.isEqual( clonedItem, storedItem ) ) {
			return 2;
		}

		/**
		 * If we have stored hash and that match with new hash
		 * Then we don't need to take any action.
		 */
		if ( _.isEqual( clonedItem, storedItem ) ) {
			return 0;
		}

		return 0;
	}

	/**
	 * To save multiple row in BigQuery.
	 *
	 * @param {Array} items List of items.
	 * @param {Object} options Save options.
	 *                          {
	 *                              useStream: To insert value as stream. Fast but with certain limitation. Reference - https://cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations
	 *                              allowUpdate: Flag to perform update operation on record. By default true. If false. Record that already exists won't get updated.
	 *                          }
	 *
	 * @returns {Promise<Array>} True on success Otherwise False.
	 */
	static async saveMany( items, options = {} ) {

		if ( _.isObject( items ) ) {
			items = Object.values( items );
		}

		if ( ! _.isArray( items ) ) {
			return [];
		}

		options = _.defaults( options, {
			useStream: false,
			allowUpdate: true,
		} );

		// Check for which item need to update or which need to insert.
		const requestedCount = items.length || 0;
		const itemsToInsert = [];
		const itemsToUpdate = [];
		const invalidItems = [];
		const itemsThatIgnored = [];
		const itemsWithoutPrimaryValue = [];

		for ( let index in items ) {
			const currentItem = _.clone( items[ index ] );

			items[ index ] = await this.prepareItem( items[ index ] );

			if ( false === items[ index ] ) {
				invalidItems.push( currentItem );
			}

		}

		items = this.removeDuplicate( items );
		items = Utility.removeEmpty( items );

		for ( let index in items ) {
			const item = items[ index ];
			const status = await this.verify( item );

			switch ( status ) {
				case -1:
					itemsWithoutPrimaryValue.push( item );
					break;
				case 0:
					itemsThatIgnored.push( item );
					break;
				case 1:
					itemsToInsert.push( item );
					break;
				case 2:
					itemsToUpdate.push( item );
					break;
			}

		}

		// Insert operations.
		const response = {
			table: this.table,
			requestedCount: requestedCount,
			itemWithoutPrimaryKey: {
				count: itemsWithoutPrimaryValue.length,
			},
			inserted: {
				count: itemsToInsert.length || 0,
				itemIds: _.pluck( itemsToInsert, this.primaryKey ),
				methodUsed: options.useStream ? 'stream' : 'default',
				response: {},
			},
			updated: {
				count: itemsToUpdate.length || 0,
				allowUpdate: options.allowUpdate,
				itemIds: _.pluck( itemsToUpdate, this.primaryKey ),
				response: {},
			},
			invalid: {
				count: invalidItems.length || 0,
				itemIds: _.pluck( invalidItems, this.primaryKey ),
				response: {},
			},
			ignored: {
				count: itemsThatIgnored.length || 0,
				itemIds: _.pluck( itemsThatIgnored, this.primaryKey ),
				response: {},
			},
		};

		/**
		 * Insert operation.
		 */
		if ( ! _.isEmpty( itemsToInsert ) ) {

			if ( true === options.useStream ) {
				const apiResponse = await this._insertRowsAsStream( itemsToInsert );

				response.inserted.response = apiResponse;
			} else {

				// Generate update queries.
				const insertQueries = [];

				for ( let index in itemsToInsert ) {
					const query = this.getInsertQuery( itemsToInsert[ index ] );
					if ( query ) {
						insertQueries.push( query );
					}
				}

				const apiResponse = await this._executeQueries( insertQueries );

				// Store that in cache.
				for ( let index in itemsToInsert ) {
					if ( _.isEmpty( apiResponse[ index ] ) ) {
						await this.setCache( itemsToInsert[ index ] );
					}
				}

				response.inserted.response = apiResponse;
			}

		}

		/**
		 * Update operations.
		 */
		if ( ! _.isEmpty( itemsToUpdate ) && true === options.allowUpdate ) {

			// Generate update queries.
			const updateQueries = [];

			for ( let index in itemsToUpdate ) {
				const query = this.getUpdateQuery( itemsToUpdate[ index ] );
				if ( query ) {
					updateQueries.push( query );
				}
			}

			let apiResponse = await this._executeQueries( updateQueries );

			// Store that in cache.
			for ( let index in itemsToUpdate ) {
				if ( _.isEmpty( apiResponse[ index ] ) ) {
					await this.setCache( itemsToUpdate[ index ] );
				}
			}

			response.updated.response = apiResponse;
		}

		return response;
	}

	/**
	 * We can not move this function our side of this scope.
	 * Otherwise there is chance that it will use by other classes.
	 *
	 * @param {Array} items List of items.
	 * @returns {Promise<Array>}
	 *
	 * @private
	 */
	static async _insertRowsAsStream( items ) {
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
		 */
		let response = {};

		const insertItemsChunks = _.chunk( insertItems, this.maxRowToSave );

		for ( let index in insertItemsChunks ) {
			const itemsChunk = insertItemsChunks[ index ];

			/**
			 * Keep the try catch in for loop.
			 * So if any chunk fails to insert data then other chunk won't get affected.
			 */
			try {
				response[ index ] = await this.getBigQueryTable.insert( itemsChunk, { raw: true } );

				// Store data in cache.
				for ( let i in itemsChunk ) {
					await this.setCache( itemsChunk[ i ].json );
				}

			} catch ( exception ) {

				response[ index ] = {
					code: exception.code,
					errors: exception.errors,
					response: exception.response,
				};
			}

		}

		return response;
	}

	/**
	 * To execute multiple queries.
	 * Please use it only for DML statement.
	 *
	 * Note: It will concat multiple queries into chunk of 900kb.
	 *
	 * @private
	 *
	 * @param {Array} queries List of all raw queries.
	 *
	 * @returns {Promise<void>}
	 */
	static async _executeQueries( queries ) {

		/**
		 * Maximum query size in kb.
		 * BigQuery have limit of 1024 kb but for safe size will keep 900.
		 *
		 * @type {string}
		 */
		const queryChunkLimit = 900;

		const response = {};
		const queryChunks = { 0: [] };
		let chunkIndex = 0;

		/**
		 * To create chunk of queries that can execute at once.
		 * BigQuery have limit of 1024 kb for query size.
		 * So here we create chunk of queries that does not exceed that limit
		 */
		for ( const index in queries ) {

			const currentQuery = queries[ index ];
			const currentQuerySize = Utility.getSizeOfText( currentQuery );
			const chunkSize = Utility.getSizeOfText( queryChunks[ chunkIndex ].join( "\n" ) );

			/**
			 * After adding current query into chunk.
			 * If chunk size increase then create new chunk and store query in that.
			 */
			if ( queryChunkLimit < ( currentQuerySize + chunkSize ) ) {
				chunkIndex++;
				queryChunks[ chunkIndex ] = [];
			}

			queryChunks[ chunkIndex ].push( currentQuery );

		}

		// Run each chunk.
		for ( const index in queries ) {

			// const chunk = queryChunks[ index ];
			// const query = chunk.join( "\n" );
			const query = queries[ index ];

			/**
			 * Keep the try catch in for loop.
			 * So if any chunk fails to insert data then other chunk won't get affected.
			 */
			try {
				response[ index ] = await BigQuery.query( query );
			} catch ( exception ) {
				response[ index ] = {
					code: exception.code,
					errors: exception.errors,
					response: exception.response,
				}
			}

		}

		return response;
	}

	/**
	 * To Delete records from table base on where clause.
	 * Note: Multiple field will join with "AND".
	 *
	 * @param {Object} whereClaus Where claus values.
	 *
	 * @returns {Promise<boolean|*>}
	 */
	static async deleteRows( whereClaus ) {

		if ( _.isEmpty( whereClaus ) || ! _.isObject( whereClaus ) ) {
			return false;
		}

		const table = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ this.table }` + '`';
		const whereFields = [];
		const preparedField = this._prepareItemForDB( whereClaus );

		for ( let key in preparedField ) {
			whereFields.push( `${ key }=${ preparedField[ key ] }` );
		}

		const selectQuery = `SELECT ${ '`' + this.primaryKey + '`' } FROM ${ table } WHERE ${ whereFields.join( ' AND ' ) };`;

		const selectResponse = await BigQuery.query( selectQuery );

		const query = `DELETE FROM ${ table } WHERE ${ whereFields.join( ' AND ' ) };`;

		const deleteResponse = await BigQuery.query( query );

		if ( ! _.isEmpty( selectResponse ) && _.isArray( selectResponse ) ) {

			const cacheKeys = _.pluck( selectResponse, this.primaryKey );

			for ( const index in cacheKeys ) {
				await Cache.delete( cacheKeys[ index ], this.table );
			}
		}

		return deleteResponse;
	}

	/**
	 * To generate insert query for provided item.
	 * Note: Data must have primary values.
	 *
	 * @param {Object} item Item for that insert query need to generate.
	 *
	 * @returns {string} Insert statement.
	 */
	static getInsertQuery( item ) {

		if ( ! _.isObject( item ) || ! _.has( item, this.primaryKey ) ) {
			return '';
		}

		const table = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ this.table }` + '`';
		const preparedItem = this._prepareItemForDB( item );
		const keys = Object.keys( preparedItem ).join( ', ' );
		const values = Object.values( preparedItem ).join( ', ' );
		const query = `INSERT INTO ${ table } ( ${ keys } ) VALUES ( ${ values } );`;

		return query;
	}

	/**
	 * To generate Update query for provided item.
	 *
	 * @param {Object} item Item for that update query need to generate.
	 *
	 * @returns {string} Update statement.
	 */
	static getUpdateQuery( item ) {

		if ( ! _.isObject( item ) || ! _.has( item, this.primaryKey ) ) {
			return '';
		}

		const table = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ this.table }` + '`';

		let fields = [];
		let primaryField = {};
		primaryField[ this.primaryKey ] = item[ this.primaryKey ];
		primaryField = this._prepareItemForDB( primaryField );

		let preparedField = _.clone( item );
		delete preparedField[ this.primaryKey ];
		preparedField = this._prepareItemForDB( preparedField );

		for ( let key in preparedField ) {
			fields.push( `${ key }=${ preparedField[ key ] }` );
		}

		let query = `UPDATE ${ table } SET ${ fields.join( ', ' ) } WHERE ${ Object.keys( primaryField ).join() }=${ Object.values( primaryField ).join() };`;

		return query;
	}

	/**
	 * To prepare object database.
	 *
	 * @private
	 *
	 * @param {Object} item Item to prepare for DB.
	 *
	 * @returns {Object}
	 */
	static _prepareItemForDB( item ) {

		if ( _.isEmpty( item ) || ! _.isObject( item ) ) {
			return {};
		}

		const prepareItem = {};

		for ( let key in item ) {
			let preparedValue = this._prepareValueForDB( item[ key ] );
			let preparedKey = '`' + key + '`';
			prepareItem[ preparedKey ] = preparedValue; //.replace( /\n/g, ' ' ).replace( /\t/g, ' ' );
		}

		return prepareItem;
	}

	/**
	 * To prepare field value for Database.
	 *
	 * @private
	 *
	 * @param {any} value Value that need to prepare for database insertion.
	 *
	 * @returns {string} Prepared value.
	 */
	static _prepareValueForDB( value ) {

		let dbValue = value;

		if ( 'UUID' === value ) {
			dbValue = 'GENERATE_UUID()';
		} else if ( 'string' === typeof value ) {
			dbValue = `'${ value }'`;
		} else if ( 'boolean' === typeof value ) {
			dbValue = ( value ) ? 'true' : 'false';
		}

		if ( ! dbValue ) {
			dbValue = 'null';
		}

		return dbValue;
	}

	/**
	 * Prepare item for insert/update in bigquery.
	 *
	 * @param {Object} item Item to insert.
	 *
	 * @returns {Promise<Boolean|Object>} Object on success otherwise False.
	 */
	static async prepareItem( item ) {

		// Item should be the object.
		if ( ! _.isObject( item ) ) {
			return false;
		}

		/**
		 * Set default values ( only if field passed as empty. Otherwise delete field )
		 */
		for ( let field in item ) {
			if ( _.has( this.defaults, field ) && 'undefined' === typeof item[ field ] ) {
				item[ field ] = this.defaults[ field ];
			}
		}

		/**
		 * Sanitize the data first.
		 */
		if ( false !== this.validator ) {
			// Sanitize the data.
			item = await this.validator.sanitize( item );
		}

		/**
		 * Set primary key if not exists.
		 */
		if ( ! _.has( item, this.primaryKey ) || _.isEmpty( item[ this.primaryKey ] ) ) {
			item[ this.primaryKey ] = this.getPrimaryValue( item );
		}

		/**
		 * Set updated at field
		 */
		if ( ! _.isEmpty( this.updatedAtColumn ) &&
			 ( ! _.has( item, this.updatedAtColumn ) || _.isEmpty( item[ this.updatedAtColumn ] ) )
		) {
			item[ this.updatedAtColumn ] = Utility.getCurrentDateTime();
		}

		/**
		 * Set default field if record is not exists already.
		 */
		const isNew = ( 1 === ( await this.verify( item ) ) );

		if ( isNew ) {
			item = _.defaults( item, this.defaults );

			/**
			 * Set created at field.
			 */
			if ( ! _.isEmpty( this.createdAtColumn ) &&
				 ( ! _.has( item, this.createdAtColumn ) || _.isEmpty( item[ this.createdAtColumn ] ) )
			) {
				item[ this.createdAtColumn ] = Utility.getCurrentDateTime();
			}

		}

		/**
		 * Validate the data.
		 */
		if ( false !== this.validator ) {

			const validation = await this.validator.validateAll( item );

			if ( validation.fails() ) {
				console.log( item );
				console.table( validation.messages() );
				return false;
			}
		}

		return item;

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

			if ( 'undefined' === typeof item[ this.primaryKey ] ) {
				return false;
			}

			const primaryValue = item[ this.primaryKey ];

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
