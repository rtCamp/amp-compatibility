'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );
const Config = use( 'Config' );
const Redis = use( 'Redis' );
const Env = use( 'Env' );

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
		await BigQuery.dropDataset( this.dataset );
		// Clear Redis cache.
		await Redis.flushdb();
		await Redis.quit( Env.get( 'REDIS_CONNECTION', 'local' ) );
	}
}

module.exports = BigQueryCreateDataset;
