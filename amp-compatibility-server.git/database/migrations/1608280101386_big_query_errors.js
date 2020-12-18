'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryErrorsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'errors';
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
					name: 'node_name',
					type: 'STRING',
				},
				{
					name: 'error_slug',
					type: 'STRING',
				},
				{
					name: 'parent_name',
					type: 'STRING',
				},
				{
					name: 'code',
					type: 'STRING',
				},
				{
					name: 'type',
					type: 'STRING',
				},
				{
					name: 'node_attributes',
					type: 'STRING',
				},
				{
					name: 'node_type',
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

module.exports = BigQueryErrorsSchema;
