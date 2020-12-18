'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryExtensionSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'extension';
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
					name: 'error_count',
					type: 'STRING',
				},
				{
					name: 'compatibility_score',
					type: 'STRING',
				},
				{
					name: 'slug_version',
					type: 'STRING',
				},
				{
					name: 'type',
					type: 'STRING',
				},
				{
					name: 'name',
					type: 'STRING',
				},
				{
					name: 'slug',
					type: 'STRING',
				},
				{
					name: 'version',
					type: 'STRING',
				},
				{
					name: 'theme_preview_url',
					type: 'STRING',
				},
				{
					name: 'theme_screenshot_url',
					type: 'STRING',
				},
				{
					name: 'requires_wp',
					type: 'STRING',
				},
				{
					name: 'tested_wp',
					type: 'STRING',
				},
				{
					name: 'requires_php',
					type: 'STRING',
				},
				{
					name: 'average_rating',
					type: 'STRING',
				},
				{
					name: 'support_threads',
					type: 'STRING',
				},
				{
					name: 'support_threads_resolved',
					type: 'STRING',
				},
				{
					name: 'active_installs',
					type: 'STRING',
				},
				{
					name: 'downloaded',
					type: 'STRING',
				},
				{
					name: 'last_updated',
					type: 'STRING',
				},
				{
					name: 'date_added',
					type: 'STRING',
				},
				{
					name: 'homepage_url',
					type: 'STRING',
				},
				{
					name: 'short_description',
					type: 'STRING',
				},
				{
					name: 'download_url',
					type: 'STRING',
				},
				{
					name: 'tags',
					type: 'STRING',
				},
				{
					name: 'icon_url',
					type: 'STRING',
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

module.exports = BigQueryExtensionSchema;
