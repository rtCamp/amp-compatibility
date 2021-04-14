'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

// Models
const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );

class BigQuerySiteHealthSchema extends Schema {

	/**
	 * To create table.
	 *
	 * @return void
	 */
	async up() {

		const columns = [
			{
				name: 'raw_data',
				type: 'STRING',
				mode: 'NULLABLE',
				description: 'To store summarized request info in JSON format.',
			},
			{
				name: 'error_log',
				type: 'STRING',
				mode: 'NULLABLE',
				description: 'To store error log data.',
			},
		];

		const table = SiteRequestModel.getBigQueryTable;
		const [ metadata ] = await table.getMetadata();
		const newSchema = metadata.schema;

		for ( const index in columns ) {
			newSchema.fields.push( columns[ index ] );
		}

		metadata.schema = newSchema;

		const [ result ] = await table.setMetadata( metadata );

	}

	/**
	 * To drop table.
	 *
	 * @return void.
	 */
	async down() {

	}
}

module.exports = BigQuerySiteHealthSchema
