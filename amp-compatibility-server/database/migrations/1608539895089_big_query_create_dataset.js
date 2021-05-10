'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );
const Config = use( 'Config' );
const Cache = use( 'App/Helpers/Cache' );

class BigQueryCreateDataset extends Schema {
	/**
	 * Dataset name.
	 *
	 * @returns {string} Name of BigQuery dataset.
	 */
	get dataset() {
		return Config.get( 'bigquery.dataset' );
	}

	/**
	 * To create BigQuery Dataset.
	 *
	 * @return void
	 */
	async up() {
		await BigQuery.createDataset( this.dataset );
	}

	/**
	 * To delete BigQuery Dataset and remove local object cache.
	 *
	 * @return void.
	 */
	async down() {

		// Clear Redis cache.
		await Cache.flushdb();
		await Cache.close();
	}
}

module.exports = BigQueryCreateDataset;
