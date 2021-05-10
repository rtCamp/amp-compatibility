'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryAmpValidatedUrlsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'amp_validated_urls';
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
					mode: 'REQUIRED',
					description: 'Site url without protocol without trailing slash in lowercase with query string. e.g. www.example.com',
				},
				{
					name: 'page_url',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Page url without protocol without trailing slash in lowercase with query string. e.g. www.example.test/sample-page',
				},
				{
					name: 'object_type',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Anything from post, term, user, search, 404',
				},
				{
					name: 'object_subtype',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Name of post type or taxonomy.',
				},
				{
					name: 'css_size_before',
					type: 'INTEGER',
					mode: 'REQUIRED',
					description: 'Total CSS size prior to minification in bytes \'213,812 Bytes\'',
				},
				{
					name: 'css_size_after',
					type: 'INTEGER',
					mode: 'REQUIRED',
					description: 'Total CSS size after minification => \'39,371 B\'',
				},
				{
					name: 'css_size_excluded',
					type: 'FLOAT',
					mode: 'REQUIRED',
					description: 'Excluded minified CSS size (0 stylesheets) => \'0 Bytes\'',
				},
				{
					name: 'css_budget_percentage',
					type: 'FLOAT',
					mode: 'REQUIRED',
					description: 'Percentage of used CSS budget (75KB) => \'52.0%\'',
				},
				{
					name: 'updated_at',
					type: 'DATETIME',
					mode: 'REQUIRED',
					description: 'Last update date time.',
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

module.exports = BigQueryAmpValidatedUrlsSchema;
