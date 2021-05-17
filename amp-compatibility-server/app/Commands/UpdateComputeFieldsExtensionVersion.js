'use strict';

const { Command } = require( '@adonisjs/ace' );

const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );

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
			paged: 1,
			perPage: 200,
		};

		do {

			const {
				rows: items,
				pages,
			} = await ExtensionVersionModel.query().paginate( params.paged, params.perPage );


			totalPage = pages.lastPage;

			if ( _.isEmpty( items ) ) {
				break;
			}

			for ( const index in items ) {
				const item = items[index];
				const response = await item.updateErrorCount();

				if ( response ) {
					Logger.info( `${ item.slug } ( ${ item.version } ) : ${ item.error_count }` );
				} else {
					Logger.warning( `Fail to update : ${ item.slug } ( ${ item.version } ) : ${ item.error_count }` );
				}
			}

			params.paged = params.paged + 1;

			await Utility.sleep( 2 );

		} while ( params.paged <= totalPage );

		process.exit(1);

	}

}

module.exports = UpdateComputeFieldsExtensionVersion
