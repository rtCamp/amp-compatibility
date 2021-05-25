'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use( 'Model' );
const Database = use( 'Database' );

const BigQuery = use( 'App/BigQuery' );

// Utilities
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class Base extends Model {

	/**
	 * Model boot.
	 *
	 * @return void
	 */
	static boot() {
		super.boot();

		this.addHook( 'beforeSave', async ( instance ) => {
			await instance.sanitize();
		} );

		this.addHook( 'beforeCreate', async ( instance ) => {
			await instance.setPrimaryValue();
		} );

		this.addHook( 'beforeSave', async ( instance ) => {
			await instance.validate();
		} );

		/**
		 * Add support of hook for child class.
		 */
		const events = [
			'beforeCreate',
			'afterCreate',
			'beforeUpdate',
			'afterUpdate',
			'beforeSave',
			'afterSave',
			'beforeDelete',
			'afterDelete',
		];

		for ( const index in events ) {
			const event = events[ index ];

			this.addHook( event, async ( instance ) => {

				if ( instance[ event ] ) {
					await instance[ event ]();
				}
			} );

		}

	}

	/**
	 * The primary key for the model.
	 *
	 * @attribute primaryKey
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get primaryKey() {
		return '';
	}

	/**
	 * The foreign key for the model.
	 * Same as Primary key.
	 *
	 * @attribute foreignKey
	 *
	 * @return {String}
	 *
	 */
	static get foreignKey() {
		return this.primaryKey;
	}

	/**
	 * Tell Lucid whether primary key is supposed to be incrementing
	 * or not. If `false` is returned then you are responsible for
	 * setting the `primaryKeyValue` for the model instance.
	 *
	 * @attribute incrementing
	 *
	 * @return {Boolean}
	 *
	 * @static
	 */
	static get incrementing() {
		return false;
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
	 * Query argument for data that need to send in BigQuery.
	 * If false then data for that table won't be push to BigQuery.
	 * If empty object then whole table will send to Bigquery.
	 *
	 * Check query args in this.getResult()
	 *
	 * @return {{}}
	 */
	static get getBigqueryQueryArgs() {
		return false;
	}

	/**
	 * Maximum row can send to BQ.
	 *
	 * @return {number}
	 */
	static get bqMaxRowToSave() {
		return 1000;
	}

	/**
	 * To get record if exists.
	 *
	 * @static
	 *
	 * @param {object} item Record data.
	 *
	 * @return {Promise<boolean>} Whether or not the model was persisted
	 */
	static async getIfExists( item ) {

		const primaryKey = this.primaryKey;

		if ( _.isEmpty( item ) || ! _.isObject( item ) ) {
			throw {
				message: 'Please provide valid object',
				data: item,
			};
		}

		if ( _.isEmpty( item[ primaryKey ] ) && 'function' === typeof this.getPrimaryValue ) {

			item[ primaryKey ] = this.getPrimaryValue( item );
		}

		if ( _.isEmpty( item[ primaryKey ] ) ) {
			throw {
				message: 'Primary key is missing and not able to set.',
				data: item,
			};
		}

		if ( this.validator ) {
			item = await this.validator.sanitize( item );
		}

		const instance = await this.find( item[ primaryKey ] );

		return instance ? instance : false;
	}

	/**
	 * To create record if not exists otherwise find and update the record.
	 *
	 * @static
	 *
	 * @param {object} item Record data.
	 * @param {object} trx Transaction object to be used
	 *
	 * @return {Promise<boolean>} Whether or not the model was persisted
	 */
	static async save( item, trx ) {

		let instance = await this.getIfExists( item );

		if ( ! instance ) {
			instance = ( new this() );
			instance.merge( this.defaults );
		}

		instance.merge( item );

		return ( await instance.save( trx ) );

	}

	/**
	 * To create record if not exists.
	 *
	 * @static
	 *
	 * @param {object} item Record data.
	 * @param {object} trx Transaction object to be used
	 *
	 * @return {Promise<boolean>} Whether or not the model was persisted
	 */
	static async createIfNotExists( item, trx ) {

		const instance = await this.getIfExists( item );

		if ( instance ) {
			return false;
		}

		item = _.defaults( item, this.defaults );

		await this.create( item, trx );

		return true;
	}

	/**
	 * To sanitize the model object.
	 *
	 * @return {Promise<void>}
	 */
	async sanitize() {

		if ( ! this.constructor.validator ) {
			return;
		}

		let item = this.toObject();
		item = await this.constructor.validator.sanitize( item );

		this.merge( item );

	}

	/**
	 * To set primary value based on model object.
	 *
	 * @return {Promise<void>}
	 */
	async setPrimaryValue() {

		if ( this.constructor.getPrimaryValue ) {
			this.primaryKeyValue = this.constructor.getPrimaryValue( this.toObject() );
		}

	}

	/**
	 * To validate the model.
	 *
	 * @return {Promise<void>}
	 */
	async validate() {

		if ( ! this.constructor.validator ) {
			return;
		}

		const item = this.toObject();
		const validation = await this.constructor.validator.validateAll( item );

		if ( validation.fails() ) {
			console.table( validation.messages() );
			console.trace( item );
			throw 'Validation failed';
		}
	}

	// From BigQuery base.

	/**
	 * To parse query arguments.
	 *
	 * @param {Object} args Page query params.
	 *
	 * @return {{select: string, limit: string, orderby: string, from: string, where: string, groupby: string}}
	 */
	static async _prepareQuery( args, query = null ) {

		const params = _.defaults( args, {
			selectFields: [],
			paged: 1,
			perPage: 1000,
			whereClause: {},
			whereNot: {},
			orderby: {},
			s: '',
			searchFields: [],
		} );

		if ( ! query ) {
			query = Database.from( this.table );
		}

		if ( ! _.isEmpty( params.selectFields ) && _.isArray( params.selectFields ) ) {

			let selectFields = [ ...params.selectFields, this.primaryKey ];
			selectFields = _.unique( selectFields );

			query = query.select( selectFields );
		}

		/**
		 * Where Clause.
		 */
		if ( ! _.isEmpty( params.whereClause ) && _.isObject( params.whereClause ) ) {

			for ( const field in params.whereClause ) {
				const value = params.whereClause[ field ];

				if ( _.isArray( value ) ) {
					query = query.whereIn( field, value );
				} else {
					query = query.where( field, value );
				}
			}
		}

		/**
		 * Where Not Clause.
		 */
		if ( ! _.isEmpty( params.whereNot ) && _.isObject( params.whereNot ) ) {

			for ( const field in params.whereNot ) {
				const value = params.whereNot[ field ];

				if ( _.isArray( value ) ) {
					query = query.whereNotIn( field, value );
				} else {
					query = query.whereNot( field, value );
				}
			}
		}

		/**
		 * Add clause for search.
		 */
		if ( params.s && ! _.isEmpty( params.searchFields ) && _.isArray( params.searchFields ) ) {
			const searchObject = [];

			for ( let index in params.searchFields ) {
				searchObject.push( `${ params.searchFields[ index ] } LIKE '%${ params.s }%'` );
			}

			query.whereRaw( `( ${ searchObject.join( ' OR ' ) } )` );
		}

		/**
		 * Order by clauses.
		 */
		if ( ! _.isEmpty( params.orderby ) && _.isObject( params.orderby ) ) {

			for ( let field in params.orderby ) {
				query = query.orderBy( field, params.orderby[ field ] );
			}
		}

		/**
		 * Pagination.
		 */
		if ( parseInt( params.perPage ) && 0 < parseInt( params.perPage ) ) {

			if ( true !== params.withoutCount ) {
				query = query.paginate( params.paged, params.perPage );
			} else {
				query = query.forPage( params.paged, params.perPage );
			}

		}

		return query;
	}

	/**
	 * Get BigQuery from current table by args.
	 *
	 * @param {Object} args
	 *
	 * @return {Promise<*>}
	 */
	static async getResult( args ) {

		let result = await this._prepareQuery( args );

		const preparedItems = {};

		for ( const index in result.data ) {
			const item = result.data[ index ];
			preparedItems[ item[ this.primaryKey ] ] = item;
		}

		result.data = preparedItems;

		return result;

	}

	/**
	 * To parse query arguments.
	 *
	 * @param {Object} args Page query parama.
	 *
	 * @return {{select: string, limit: string, orderby: string, from: string, where: string, groupby: string}}
	 */
	static parseQueryArgs( args ) {

		const params = _.defaults( args, {
			paged: 1,
			perPage: -1,
			whereClause: {},
			orderby: {},
			s: '',
			searchFields: [],
		} );

		let queryObject = {
			select: 'SELECT *',
			from: `FROM ${ this.table } AS ${ this.table } `,
			where: 'WHERE 1=1 ',
			groupby: '',
			orderby: '',
		};

		if ( parseInt( params.perPage ) && 0 < parseInt( params.perPage ) ) {
			const paged = params.paged ? params.paged - 1 : 0;
			const offset = paged * params.perPage;
			queryObject.limit = `LIMIT ${ params.perPage } OFFSET ${ offset }`;
		}

		if ( ! _.isEmpty( params.whereClause ) && _.isObject( params.whereClause ) ) {

			const whereFields = [];
			const preparedField = this._prepareItemForDB( params.whereClause );

			for ( let key in preparedField ) {

				if ( ! preparedField[ key ] || _.isEmpty( preparedField[ key ] ) ) {
					continue;
				}

				if ( _.isArray( preparedField[ key ] ) ) {
					let preparedValues = _.map( preparedField[ key ], this._prepareValueForDB );
					whereFields.push( `${ this.table }.${ key } IN ( ${ preparedValues.join( ', ' ) } )` );
				} else {
					whereFields.push( `${ this.table }.${ key } = ${ preparedField[ key ] }` );
				}

			}

			const additionalWhereClause = whereFields.join( ' AND ' );

			if ( additionalWhereClause ) {
				queryObject.where += ` AND ${ whereFields.join( ' AND ' ) } `;
			}

		}

		if ( ! _.isEmpty( params.orderby ) && _.isObject( params.orderby ) ) {
			const orderByObject = [];

			for ( let field in params.orderby ) {
				orderByObject.push( `${ this.table }.${ field } ${ params.orderby[ field ] }` );
			}

			queryObject.orderby = `ORDER BY ${ orderByObject.join( ', ' ) }`;
		}

		/**
		 * Add clause for search.
		 */
		if ( params.s && ! _.isEmpty( params.searchFields ) && _.isArray( params.searchFields ) ) {
			const searchObject = [];

			for ( let index in params.searchFields ) {
				searchObject.push( `${ this.table }.${ params.searchFields[ index ] } LIKE '%${ params.s }%'` );
			}

			queryObject.where += ` AND ( ${ searchObject.join( ' OR ' ) } ) `;
		}

		return queryObject;
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
			dbValue = `"${ value.toString().replace( /"/g, '\'' ) }"`;
		} else if ( 'boolean' === typeof value ) {
			dbValue = ( value ) ? 'true' : 'false';
		}

		if ( ! dbValue ) {
			dbValue = 'null';
		}

		return dbValue;
	}

	/**
	 * To get database schema.
	 *
	 * @return {Promise<*>}
	 */
	static async getDBSchema() {

		const query = `DESCRIBE ${ this.table };`;

		const [ schema ] = await Database.raw( query );

		return schema;
	}

	/**
	 * To get bigquery schema based on database schema.
	 *
	 * @return {Promise<[]>}
	 */
	static async getBigQuerySchema() {

		const dbSchema = await this.getDBSchema();
		const bigQuerySchema = [];

		const datatypeMapping = {
			TINYINT: 'INT64',
			SMALLINT: 'INT64',
			MEDIUMINT: 'INT64',
			INT: 'INT64',
			BIGINT: 'INT64',
			DECIMAL: 'NUMERIC',
			FLOAT: 'FLOAT64',
			DOUBLE: 'FLOAT64',
			BIT: 'BOOL',
			CHAR: 'STRING',
			VARCHAR: 'STRING',
			BINARY: 'BYTES',
			VARBINARY: 'BYTES',
			TINYTEXT: 'STRING',
			TEXT: 'STRING',
			MEDIUMTEXT: 'STRING',
			LONGTEXT: 'STRING',
			DATE: 'DATE',
			TIME: 'TIME',
			DATETIME: 'DATETIME',
			TIMESTAMP: 'DATETIME',
		};

		for ( const index in dbSchema ) {

			const field = dbSchema[ index ];

			const type = field.Type.replace( 'unsigned', '' ).replace( /\(.*\)/gm, '' ).trim().toUpperCase();

			const bqField = {
				name: field.Field,
				type: datatypeMapping[ type ] || 'STRING',
				mode: ( 'YES' !== field.Null ) ? 'REQUIRED' : 'NULLABLE',
			};

			bigQuerySchema.push( bqField );

		}

		return bigQuerySchema;
	}

	/**
	 * BigQuery Functions.
	 */


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
	 * We can not move this function our side of this scope.
	 * Otherwise there is chance that it will use by other classes.
	 *
	 * @param {Array} items List of items.
	 * @returns {Promise<Array>}
	 *
	 * @private
	 */
	static async bigQueryInsertRowsAsStream( items ) {

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

		const insertItemsChunks = _.chunk( insertItems, this.bqMaxRowToSave );

		for ( let index in insertItemsChunks ) {
			const itemsChunk = insertItemsChunks[ index ];

			/**
			 * Keep the try catch in for loop.
			 * So if any chunk fails to insert data then other chunk won't get affected.
			 */
			try {
				response[ index ] = await this.getBigQueryTable.insert( itemsChunk, { raw: true } );

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
}

module.exports = Base;
