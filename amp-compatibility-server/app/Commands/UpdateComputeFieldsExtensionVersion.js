'use strict';

const { Command } = require( '@adonisjs/ace' );
const Database = use( 'Database' );

const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const ExtensionModel = use( 'App/Models/Extension' );
const ErrorSourceModel = use( 'App/Models/ErrorSource' );

const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class UpdateComputeFieldsExtensionVersion extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return 'update_compute_fields:extension_version';
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To update computed fields of extension version table.';
	}

	/**
	 * To handle functionality of command.
	 * To create user for dashboard.
	 *
	 * @param {Object} args Argument passed in command.
	 * @param {Object} options Options passed in command.
	 *
	 * @return {Promise<void>}
	 */
	async handle( args, options ) {

		let totalPage = 1;
		const params = {
			paged: 0,
			perPage: 50,
		};

		do {

			params.paged = params.paged + 1;

			const {
				data: items,
				lastPage,
			} = await Database
				.from( ErrorSourceModel.table )
				.select( [ `${ ExtensionModel.table }.active_installs` ] )
				.distinct( `${ ErrorSourceModel.table }.extension_version_slug` )
				.innerJoin( ExtensionVersionModel.table, `${ ExtensionVersionModel.table }.extension_version_slug`, `${ ErrorSourceModel.table }.extension_version_slug` )
				.leftJoin( ExtensionModel.table, `${ ExtensionModel.table }.extension_slug`, `${ ExtensionVersionModel.table }.extension_slug` )
				.orderBy( `${ ExtensionModel.table }.active_installs`, 'DESC' )
				.orderBy( `${ ErrorSourceModel.table }.extension_version_slug`, 'ASC' )
				.paginate( params.paged, params.perPage );

			totalPage = lastPage;

			if ( _.isEmpty( items ) ) {
				break;
			}

			this.info( `\n${ this.icon( 'info' ) } Processing ${ params.paged } / ${ lastPage }` );

			for ( const index in items ) {
				const item = items[ index ];
				const extensionVersionSlug = item.extension_version_slug;
				const errorCount = await ExtensionVersionModel.getErrorCount( extensionVersionSlug );

				const response = await ExtensionVersionModel.save( {
					extension_version_slug: extensionVersionSlug,
					error_count: errorCount,
				} );

				if ( response ) {
					Logger.info( `${ extensionVersionSlug.padEnd( 80 ) } : ${ errorCount }` );
				} else {
					Logger.warning( `Fail to update : ${ extensionVersionSlug.pad.padEnd( 80 ) } : ${ item.error_count }` );
				}
			}

			await Utility.sleep( 5 );

		} while ( params.paged <= totalPage );

		process.exit( 1 );

	}

}

module.exports = UpdateComputeFieldsExtensionVersion
