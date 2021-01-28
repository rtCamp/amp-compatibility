'use strict';
/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryAuthorsSchema extends Schema {

	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'authors';
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
					name: 'user_nicename',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author\'s nice name e.g. themepalace',
				},
				{
					name: 'display_name',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author\'s display name `Theme palace`',
				},
				{
					name: 'author_profile',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author\'s profile URL. without protocol without trailing slash in lowercase with querystring.  e.g. https://profiles.wordpress.org/themepalace/',
				},
				{
					name: 'avatar',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Author\'s avatar URL. e.g. https://secure.gravatar.com/avatar/0c5bb2d366c231814fdd29647f813ff1?s=96&d=monsterid&r=g',
				},
				{
					name: 'status',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Communication status with AMP team.',
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

module.exports = BigQueryAuthorsSchema;
