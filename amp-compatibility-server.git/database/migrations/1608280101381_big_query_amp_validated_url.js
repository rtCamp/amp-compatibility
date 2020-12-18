'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryAmpValidatedUrlSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'amp_validated_url';
	}

	/**
	 * Table schema for BigQuery.
	 *
	 * @returns {{fields: *[]}} Fields.
	 */
	get schema() {
		return {
			fields: [
				{
					name: 'site_url',
					type: 'STRING',
				},
				{
					name: 'page_url',
					type: 'STRING',
				},
				{
					name: 'post_date_gmt',
					type: 'TIMESTAMP',
				},
				{
					name: 'guid',
					type: 'STRING',
				},
			],
		};
	}

	/**
	 * To create table.
	 *
	 * @return void
	 */
	async up() {
		await BigQuery.createTable( this.table, this.schema );
	}

	/**
	 * To drop table.
	 *
	 * @return void.
	 */
	async down() {
		// await BigQuery.dropTable( this.table );
	}
}

module.exports = BigQueryAmpValidatedUrlSchema;
