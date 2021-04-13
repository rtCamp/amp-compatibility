'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const SiteRequestModel = use( 'App/Models/BigQuerySiteRequest' );

class BigQuerySiteHealthSchema extends Schema {
	async up () {

		const columns = [
			{
				name: 'site_health_info',
				type: 'STRING',
				mode: 'NULLABLE',
				description: 'Holds JSON string with all the site health info.',
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

	async down () {

	}
}

module.exports = BigQuerySiteHealthSchema
