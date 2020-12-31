'use strict';

const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const UserModel = use( 'App/Models/User' );
const BigQuery = use( 'App/BigQuery' );
const _ = require( 'underscore' );

const { validate, formatters, validateAll } = use( 'Validator' );

class SyntheticDataController {

	/**
	 * API endpoint callback.
	 *
	 * @method GET
	 *
	 * @return object Response data.
	 */
	async index() {

		const versionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionVersionModel.table }` + '`';
		const extensionTable = '`' + `${ BigQuery.config.projectId }.${ BigQuery.config.dataset }.${ ExtensionModel.table }` + '`';
		const query = `SELECT extension_versions.*
			FROM ${ versionTable } AS extension_versions
			INNER JOIN ${ extensionTable } AS extensions ON extension_versions.extension_slug = extensions.extension_slug
			WHERE has_synthetic_data != TRUE OR has_synthetic_data IS NULL
			ORDER BY extensions.active_installs DESC
			LIMIT 1;`;

		const result = await BigQuery.query( query );
		let response = { status: 'fail' };

		if ( ! _.isEmpty( result ) && ! _.isEmpty( result[ 0 ] ) ) {
			response = { status: 'ok', data: result[ 0 ] };
		}

		return response;
	}

	/**
	 * API endpoint callback.
	 *
	 * @method POST
	 *
	 * @return object Response data.
	 */
	async store( { request } ) {

		const validationRules = {
			'status': 'in:ok|required',
			'data.extension_version_slug': 'string|required',
		};

		let requestData = request.post();
		let response = {};
		const validation = await validateAll( requestData, validationRules );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		const item = {
			extension_version_slug: requestData.data.extension_version_slug,
			has_synthetic_data: true,
		};

		try {
			const updateQuery = await ExtensionVersionModel.getUpdateQuery( item );

			await BigQuery.query( updateQuery );

			response = { status: 'ok' };
		} catch ( exception ) {
			response = { status: 'fail' };
		}

		return response;
	}
}

module.exports = SyntheticDataController;
