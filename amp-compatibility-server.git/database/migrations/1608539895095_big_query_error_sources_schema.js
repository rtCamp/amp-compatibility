'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryErrorSourcesSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'error_sources';
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
					name: 'error_source_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Encrypted hash of the JSON stringify error source data.',
				},
				{
					name: 'extension_version_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of extension version. `${type}-${extension_slug}-${version}` e.g. plugin-woocommerce-4.1',
				},
				{
					name: 'type',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'plugin|theme|block',
				},
				{
					name: 'name',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'e.g. gravityforms',
				},
				{
					name: 'file',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'e.g. gravityforms.php',
				},
				{
					name: 'line',
					type: 'INTEGER',
					mode: 'REQUIRED',
					description: 'Line number e.g. 276',
				},
				{
					name: 'function',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'function name e.g. GFForms::init',
				},
				{
					name: 'hook',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'WordPress hook e.g. init',
				},
				{
					name: 'priority',
					type: 'INTEGER',
					mode: 'REQUIRED',
					description: 'e.g. 10',
				},
				{
					name: 'dependency_type',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'e.g. script',
				},
				{
					name: 'handle',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'e.g. gform_masked_input',
				},
				{
					name: 'dependency_handle',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'extra_key',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'text',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'filter',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'sources',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'block_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'block_content_index',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'block_attrs',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'shortcode',
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
		const response = await BigQuery.createTable( this.table, this.schema );
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

module.exports = BigQueryErrorSourcesSchema;
