'use strict';

const { Command } = require( '@adonisjs/ace' );

const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const Helpers = use( 'Helpers' );

const _ = require( 'underscore' );

class ExtensionMappingUpdate extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return 'extension:mapping:update'
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'To update mapping of extension';
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {

		const plugins = {};
		const themes = {};
		let count = 0;

		try {
			let nextQuery = {
				autoPaginate: false,
			};
			let currentPage = 0;

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

			const pluginPath = Helpers.appRoot() + `/data/wporg_mapping/plugins.json`;
			const themePath = Helpers.appRoot() + `/data/wporg_mapping/themes.json`;

			await FileSystem.writeFile( pluginPath, JSON.stringify( plugins ) );
			await FileSystem.writeFile( themePath, JSON.stringify( themes ) );

			this.success( 'Completed' );
		} catch ( exception ) {
			console.log( exception );
		}

	}

	prepareData( row, records ) {

	}

}

module.exports = ExtensionMappingUpdate;
