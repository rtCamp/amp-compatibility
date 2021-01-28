'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryAuthorRelationshipsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'author_relationships';
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
					description: 'Encrypted hash of `${extension_slug}-${author_profile}`',
				},
				{
					name: 'extension_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Slug of extension. `${type}-${extension_slug}` e.g. plugin-woocommerce',
				},
				{
					name: 'author_profile',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author\'s profile URL. without protocol without trailing slash in lowercase with querystring.  e.g. https://profiles.wordpress.org/themepalace/',
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

module.exports = BigQueryAuthorRelationshipsSchema;
