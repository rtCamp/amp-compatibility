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
					mode: 'REQUIRED',
					description: 'Anything from post_type,taxonomy,search,404',
				},
				{
					name: 'object_subtype',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Name of post type or taxonomy.',
				},
				{
					name: 'css_size_before',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Total CSS size prior to minification => \'213,812 Bytes\'',
				},
				{
					name: 'css_size_after',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Total CSS size after minification => \'39,371 B\'',
				},
				{
					name: 'css_size_excluded',
					type: 'FLOAT',
					mode: 'REQUIRED',
					description: 'Percentage of used CSS budget (75KB) => \'52.0%\'',
				},
				{
					name: 'css_budget_percentage',
					type: 'FLOAT',
					mode: 'REQUIRED',
					description: 'Excluded minified CSS size (0 stylesheets) => \'0 Bytes\'',
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
