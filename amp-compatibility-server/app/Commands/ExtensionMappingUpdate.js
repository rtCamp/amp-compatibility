'use strict';

const { Command } = require( '@adonisjs/ace' );

const ExtensionVersionModel = use( 'App/Models/BigQuery/ExtensionVersion' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const Helpers = use( 'Helpers' );

const _ = require( 'underscore' );

class ExtensionMappingUpdate extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return 'extension:mapping:update';
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To update mapping of extension';
	}

	/**
	 * To handle functionality of command.
	 * To update local redis cache with bigquery.
	 *
	 * @return {Promise<void>}
	 */
	async handle() {

		const plugins = {};
		const themes = {};

		try {
			let currentPage = 0;
			let nextQuery = {
				autoPaginate: false,
			};

			do {
				let rows = [];
				let apiResponse = {};
				currentPage++;

				[ rows, nextQuery, apiResponse ] = await ExtensionVersionModel.getBigQueryTable.getRows( nextQuery );

				for ( const index in rows ) {
					const row = rows[ index ];
					const type = row.type.toString() || '';
					const slug = row.slug.toString() || '';

					if ( _.isEmpty( slug ) ) {
						continue;
					}

					if ( 'plugin' === type ) {

						if ( 'object' === typeof plugins[ slug ] ) {
							plugins[ slug ].versions.push( row.version );
						} else {
							plugins[ slug ] = {
								name: slug,
								slug: slug,
								versions: [
									row.version,
								],
							};
						}

						plugins[ slug ].versions = _.uniq( plugins[ slug ].versions );

					} else if ( 'theme' === type ) {

						if ( 'object' === typeof themes[ slug ] ) {
							themes[ slug ].versions.push( row.version );
						} else {
							themes[ slug ] = {
								name: slug,
								slug: slug,
								versions: [
									row.version,
								],
							};
						}

						themes[ slug ].versions = _.uniq( themes[ slug ].versions );
					}
				}

			} while ( _.isObject( nextQuery ) );

			const pluginPath = Helpers.publicPath( '/data/wporg_mapping/plugins.json' );
			const themePath = Helpers.publicPath( '/data/wporg_mapping/themes.json' );

			await FileSystem.writeFile( pluginPath, JSON.stringify( plugins ) );
			await FileSystem.writeFile( themePath, JSON.stringify( themes ) );

			this.success( 'Completed' );
		} catch ( exception ) {
			console.log( exception );
		}

	}

}

module.exports = ExtensionMappingUpdate;
