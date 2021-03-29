'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQuerySiteRequestsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'site_requests';
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
					name: 'site_request_id',
					type: 'STRING',
					mode: 'REQUIRED',
					description: '',
				},
				{
					name: 'site_url',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Site url without protocol without trailing slash in lowercase with query string. e.g. www.example.com',
				},
				{
					name: 'status',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'e.g. pending, success, fail',
				},
				{
					name: 'created_on',
					type: 'DATETIME',
					mode: 'REQUIRED',
					description: 'creation data.',
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
		await BigQuery.dropTable( this.table );
	}
}

module.exports = BigQuerySiteRequestsSchema
