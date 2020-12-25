'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryUrlErrorRelationshipSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'url_error_relationships';
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
					name: 'hash',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Encrypted hash of `${page_url}-${error_slug}-${error_source_slug}`',
				},
				{
					name: 'page_url',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Page url without protocol without trailing slash in lowercase with query string. e.g. www.example.test/sample-page',
				},
				{
					name: 'error_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Encrypted hash of the JSON stringify error data.',
				},
				{
					name: 'error_source_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Encrypted hash of the JSON stringify error source data.',
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

module.exports = BigQueryUrlErrorRelationshipSchema;
