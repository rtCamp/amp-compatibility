'use strict';
/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryAuthorsSchema extends Schema {

	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'authors';
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
					name: 'profile',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author\'s profile URL.',
				}, {
					name: 'user_nicename',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author nicename',
				}, {
					name: 'avatar',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Author\'s avatar URL',
				}, {
					name: 'display_name',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Display name of author.',
				}, {
					name: 'status',
					type: 'STRING',
					mode: 'NULLABLE',
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

module.exports = BigQueryAuthorsSchema;
