'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryExtensionVersionsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'extension_versions';
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
					name: 'extension_version_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of extension version. `${type}-${extension_slug}-${version}` e.g. plugin-woocommerce-4.1',
				},
				{
					name: 'extension_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of extension. `${type}-${extension_slug}` e.g. plugin-woocommerce',
				},
				{
					name: 'type',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Type of extension. Possible values plugin|theme.',
				},
				{
					name: 'slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of theme/plugin. e.g. redirection.',
				},
				{
					name: 'version',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Version of theme/plugin e.g. 4.5',
				},
				{
					name: 'error_count',
					type: 'INTEGER',
					mode: 'NULLABLE',
					description: 'Auto calculated field.',
				},
				{
					name: 'compatibility_score',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Auto calculated field.',
				},
				{
					name: 'has_synthetic_data',
					type: 'BOOL',
					mode: 'NULLABLE',
					description: 'Determine if we have synthetic data or not. Default false',
				},
				{
					name: 'is_verified',
					type: 'BOOL',
					mode: 'NULLABLE',
					description: 'Determine if synthetic data is verified or not. Default false',
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

module.exports = BigQueryExtensionVersionsSchema;
