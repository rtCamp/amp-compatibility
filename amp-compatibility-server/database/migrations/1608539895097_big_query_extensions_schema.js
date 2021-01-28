'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryExtensionsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'extensions';
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
					name: 'extension_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of extension. `${type}-${extension_slug}` e.g. plugin-woocommerce',
				},
				{
					name: 'wporg',
					type: 'BOOL',
					mode: 'REQUIRED',
					description: 'True if it is wp.org plugin/theme. Default false.',
				},
				{
					name: 'type',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Type of extension. Possible values plugin|theme.',
				},
				{
					name: 'name',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'e.g. Redirection',
				},
				{
					name: 'slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'e.g. redirection',
				},
				{
					name: 'latest_version',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Latest version of plugin/theme e.g. 4.9.2',
				},
				{
					name: 'requires_wp',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Requires WordPress version e.g. 5.0',
				},
				{
					name: 'tested_wp',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Plugin/Theme is tested up to version e.g. 5.5.3',
				},
				{
					name: 'requires_php',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Require PHP version e.g. 5.6',
				},
				{
					name: 'average_rating',
					type: 'FLOAT',
					mode: 'NULLABLE',
					description: 'wp.org data Average raging of plugin/theme',
				},
				{
					name: 'support_threads',
					type: 'INTEGER',
					mode: 'NULLABLE',
					description: 'wp.org data e.g. 117',
				},
				{
					name: 'support_threads_resolved',
					type: 'INTEGER',
					mode: 'NULLABLE',
					description: 'wp.org data e.g. 117',
				},
				{
					name: 'active_installs',
					type: 'INTEGER',
					mode: 'NULLABLE',
					description: 'Active install count from wp.org',
				},
				{
					name: 'downloaded',
					type: 'INTEGER',
					mode: 'NULLABLE',
					description: 'Download count from wp.org',
				},
				{
					name: 'last_updated',
					type: 'DATETIME',
					mode: 'NULLABLE',
					description: 'Last update date of theme/plugin in wp.org.',
				},
				{
					name: 'date_added',
					type: 'DATETIME',
					mode: 'NULLABLE',
					description: 'Date for when theme/plugin in wp.org.',
				},
				{
					name: 'homepage_url',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Home page url of plugin/theme.',
				},
				{
					name: 'short_description',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Short description of plugin/theme.',
				},
				{
					name: 'download_url',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Download url of plugin/theme.',
				},
				{
					name: 'author_url',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'extension_url',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Url for theme/plugin.',
				},
				{
					name: 'preview_url',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Preview URL of theme/plugin e.g. https://wp-wporg.com/prime-spa',
				},
				{
					name: 'screenshot_url',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Screenshot of plugin/theme e.g. //ts.w.org/wp-content/themes/prime-spa/screenshot.png?ver=1.0.0',
				},
				{
					name: 'tags',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Tags of theme/plugin in JSON format. ',
				},
				{
					name: 'icon_url',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Icon url ',
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

module.exports = BigQueryExtensionsSchema;
