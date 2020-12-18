'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQuerySourcesSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'author';
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
					name: 'source_slug',
					type: 'STRING',
				},
				{
					name: 'type',
					type: 'INTEGER',
				},
				{
					name: 'name',
					type: 'STRING',
				},
				{
					name: 'file',
					type: 'STRING',
				},
				{
					name: 'line',
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

module.exports = BigQuerySourcesSchema;
