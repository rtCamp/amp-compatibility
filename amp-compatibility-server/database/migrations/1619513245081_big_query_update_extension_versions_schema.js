'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

// Models
const ExtensionVersionModel = use( 'App/Models/BigQuery/ExtensionVersion' );

class BigQueryUpdateExtensionVersionsSchema extends Schema {

	/**
	 * To Update table schema.
	 *
	 * @return void
	 */
	async up() {
		const columns = [
			{
				name: 'verified_by',
				type: 'STRING',
				mode: 'NULLABLE',
				description: 'Email address of author who have update verification status.',
			},
		];

		const table = ExtensionVersionModel.getBigQueryTable;
		const [ metadata ] = await table.getMetadata();
		const newSchema = metadata.schema;

		for ( const index in columns ) {
			newSchema.fields.push( columns[ index ] );
		}

		metadata.schema = newSchema;

		const [ result ] = await table.setMetadata( metadata );
	}

	down() {
	}

}

module.exports = BigQueryUpdateExtensionVersionsSchema
