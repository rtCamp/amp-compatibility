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
					mode: 'REQUIRED',
					description: 'Site url without protocol without trailing slash in lowercase with query string. e.g. www.example.com',
				},
				{
					name: 'site_title',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Title of the site. e.g. "Example site".',
				},
				{
					name: 'php_version',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'PHP version on site is running. e.g. 7.2.34-8+ubuntu18.04.1+deb.sury.org+1',
				},
				{
					name: 'mysql_version',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'MySQL version that site is using. e.g. 5.5.3',
				},
				{
					name: 'wp_version',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Installed WordPress version. e.g. 5.5.3',
				},
				{
					name: 'wp_language',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Site local. e.g. en_US',
				},
				{
					name: 'wp_https_status',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'true',
				},
				{
					name: 'wp_multisite',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'subdomain|subdirectory|single',
				},
				{
					name: 'wp_active_theme',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Active theme on site.',
				},
				{
					name: 'object_cache_status',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'Object cache enabled.',
				},
				{
					name: 'libxml_version',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'libxml version',
				},
				{
					name: 'is_defined_curl_multi',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'Whether the curl_multi functions are defined.',
				},
				{
					name: 'stylesheet_transient_caching',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'Whether stylesheet transient caching is disabled  ',
				},
				{
					name: 'loopback_requests',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'whether loopback requests are working.',
				},
				{
					name: 'amp_mode',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'AMP plugin mode. Possible values standard,reader,transitional,off',
				},
				{
					name: 'amp_version',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'AMP Plugin version',
				},
				{
					name: 'amp_plugin_configured',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'true|false',
				},
				{
					name: 'amp_all_templates_supported',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'AMP plugin settings',
				},
				{
					name: 'amp_supported_post_types',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Theme templates with enable/disable status',
				},
				{
					name: 'amp_supported_templates',
					type: 'STRING',
					mode: 'REQUIRED',
				},
				{
					name: 'amp_mobile_redirect',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'true|false',
				},
				{
					name: 'amp_reader_theme',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'e.g. legacy',
				},
				{
					name: 'is_synthetic_data',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'Is data for this site is auto generated or not. Default False',
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

module.exports = BigQuerySitesSchema;
