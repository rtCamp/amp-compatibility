'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQuerySiteToExtensionsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'site_to_extensions';
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
					description: 'Encrypted hash of `${site_url}-${extension_version_slug}`',
				},
				{
					name: 'site_url',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Site url without protocol without trailing slash in lowercase with query string. e.g. www.example.com',
				},
				{
					name: 'extension_version_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of extension version. `${type}-${extension_slug}-${version}` e.g. plugin-woocommerce-4.1',
				},
				{
					name: 'amp_suppressed',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Plugin version when it was suppressed.',
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

module.exports = BigQuerySiteToExtensionsSchema;
