'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

// Models
const ExtensionModel = use( 'App/Models/BigQuery/Extension' );

class BigQueryUpdateExtensionsSchema extends Schema {

	/**
	 * To Update table schema.
	 *
	 * @return void
	 */
	async up() {
		const columns = [
			{
				name: 'is_partner',
				type: 'BOOL',
				mode: 'NULLABLE',
				description: 'Flag of if extension is from partner author or not. Default False.',
			},
		];

		const table = ExtensionModel.getBigQueryTable;
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

module.exports = BigQueryUpdateExtensionsSchema;
