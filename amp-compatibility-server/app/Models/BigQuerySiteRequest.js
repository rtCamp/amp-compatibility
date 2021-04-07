'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );
const SiteRequestValidator = use( 'App/Validators/SiteRequest' );

class BigQuerySiteRequest extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'site_requests';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'site_request_id';
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
		return 'created_at';
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return SiteRequestValidator;
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			status: 'pending',
		};
	}

	/**
	 * To save site request in BigQuery
	 *
	 * @param {Array} items List of items.
	 * @param {Object} options Save options.
	 *                          {
	 *                              allowUpdate: Flag to perform update operation on record. By default true. If false. Record that already exists won't get updated.
	 *                              skipCache: Flag to skip updating the local Redis cache. Local Redis cache is not available on APP Engine instances.
	 *                          }
	 *
	 * @returns {Promise<Array>} True on success Otherwise False.
	 */
	static async saveSiteRequest( items, options = {} ) {

		if ( _.isObject( items ) ) {
			items = Object.values( items );
		}

		if ( ! _.isArray( items ) ) {
			return [];
		}

		options = _.defaults( options, {
			allowUpdate: true,
			skipCache: true,
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

		items = Utility.removeEmpty( items );

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
		if ( !_.isEmpty( itemsToInsert ) ) {

			// Generate update queries.
			const insertQueries = [];

			for ( let index in itemsToInsert ) {
				const query = this.getInsertQuery( itemsToInsert[ index ] );
				if ( query ) {
					insertQueries.push( query );
				}
			}

			const apiResponse = await this._executeQueries( insertQueries );

			if ( false === options.skipCache ) {
				// Store that in cache.
				for ( let index in itemsToInsert ) {
					if ( _.isEmpty( apiResponse[ index ] ) ) {
						await this.setCache( itemsToInsert[ index ] );
					}
				}
			}

			response.inserted.response = apiResponse;

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

			if ( false === options.skipCache ) {
				// Store that in cache.
				for ( let index in itemsToUpdate ) {
					if ( _.isEmpty( apiResponse[ index ] ) ) {
						await this.setCache( itemsToUpdate[ index ] );
					}
				}
			}

			response.updated.response = apiResponse;
		}

		return response;
	}
}

module.exports = BigQuerySiteRequest;
