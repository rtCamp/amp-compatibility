'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

// Models
const AmpValidatedUrlModel = use( 'App/Models/BigQueryAmpValidatedUrl' );

const Utility = use( 'App/Helpers/Utility' );

class BigQueryUpdateAmpValidatedUrlsSchema extends Schema {

	/**
	 * To create table.
	 *
	 * @return void
	 */
	async up() {

		const columns = [
			{
				name: 'site_request_id',
				type: 'STRING',
				mode: 'NULLABLE',
				description: '',
			},
		];


		const table = AmpValidatedUrlModel.getBigQueryTable;
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

module.exports = BigQueryUpdateAmpValidatedUrlsSchema;
