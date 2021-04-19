'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

// Models
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

class BigQueryExtensionVersionsSchema extends Schema {

	/**
	 * To create table.
	 *
	 * @return void
	 */
	async up() {

		const columns = [
			{
				name: 'verification_status',
				type: 'STRING',
				mode: 'NULLABLE',
				description: 'Extension version\'s status.',
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

	/**
	 * To drop table.
	 *
	 * @return void.
	 */
	down() {

	}
}

module.exports = BigQueryExtensionVersionsSchema
