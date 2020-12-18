'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQuerySitesSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'sites';
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
				},
				{
					name: 'post_updated_gmt',
					type: 'STRING',
				},
				{
					name: 'site_title',
					type: 'STRING',
				},
				{
					name: 'php_version',
					type: 'STRING',
				},
				{
					name: 'mysql_version',
					type: 'STRING',
				},
				{
					name: 'platform',
					type: 'STRING',
				},
				{
					name: 'amp_mode',
					type: 'STRING',
				},
				{
					name: 'amp_version',
					type: 'STRING',
				},
				{
					name: 'amp_templates',
					type: 'STRING',
				},
				{
					name: 'amp_suppressed_plugins',
					type: 'STRING',
				},
				{
					name: 'amp_analytics',
					type: 'STRING',
				},
				{
					name: 'wp_content_types',
					type: 'STRING',
				},
				{
					name: 'wp_language',
					type: 'STRING',
				},
				{
					name: 'wp_https_status',
					type: 'BOOLEAN',
				},
				{
					name: 'wp_multisite',
					type: 'STRING',
				},
				{
					name: 'wp_active_theme',
					type: 'STRING',
				},
				{
					name: 'wp_version',
					type: 'STRING',
				},
				{
					name: 'is_synthetic_data',
					type: 'BOOLEAN',
				},
				{
					name: 'mobile_redirect',
					type: 'BOOLEAN',
				},
				{
					name: 'reader_theme',
					type: 'STRING',
				},
				{
					name: 'plugin_configured',
					type: 'BOOLEAN',
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

module.exports = BigQuerySitesSchema;
