'use strict';

const { Command } = require( '@adonisjs/ace' );

const ExtensionController = use( 'App/Controllers/Http/ExtensionController' );
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );

const _ = require( 'underscore' );
const compareVersions = require( 'compare-versions' );

class ExtensionVersionVerify extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return 'extension_version:verify';
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'Update extension version status based on previous status';
	}

	/**
	 * To handle functionality of command.
	 * To update local redis cache with bigquery.
	 *
	 * @return {Promise<void>}
	 */
	async handle() {

		let extensions = [];
		let extensionVersions = [];

		const params = {
			perPage: 10000,
			paged: 1,
			orderby: {
				active_installs: 'DESC',
				slug: 'ASC',
			},
		};

		const extensionController = new ExtensionController();

		do {

			const data = await extensionController.getExtensionData( params );

			extensions = data.extensions;
			extensionVersions = data.extensionVersions;

			const groupedExtensionVersions = {};

			/**
			 * Group the extension version by extension.
			 */
			for ( const index in extensionVersions ) {
				const item = extensionVersions[ index ];
				groupedExtensionVersions[ item.extension_slug ] = groupedExtensionVersions[ item.extension_slug ] || {};
				groupedExtensionVersions[ item.extension_slug ][ item.version ] = item;
			}

			for ( const extensionSlug in groupedExtensionVersions ) {

				const extensionVersionData = groupedExtensionVersions[ extensionSlug ];

				/**
				 * If we have only one version than bail out.
				 */
				if ( 1 >= _.size( extensionVersionData ) ) {
					continue;
				}

				let versions = _.keys( extensionVersionData );
				const sortedVersions = versions.sort( compareVersions ).reverse();

				for ( const index in sortedVersions ) {

					const status = this.checkExtensionVersionCanBePassed( extensionVersionData, index );

					if ( status ) {
						const version = sortedVersions[ index ];
						const extensionVersion = extensionVersionData[ version ];

						const item = {
							extension_version_slug: extensionVersion.extension_version_slug,
							verification_status: 'auto_pass',
							verified_by: 'auto',
						};

						try {
							const result = await ExtensionVersionModel.save( item );

							if ( ! result ) {
								throw `Fail to update ${ extensionVersion.extension_version_slug }`;
							}

							this.info( `${ extensionVersion.extension_version_slug } marked as "Auto Pass"` );
						} catch ( exception ) {
							console.log( exception );
						}

					}

				}

			}

			params.paged++;
		} while ( ! _.isEmpty( extensions ) );

		process.exit( 1 );
	}

	/**
	 * To check if from extension versions data given index can mark as "Auto Pass" or not.
	 *
	 * @note : Recursive function.
	 *
	 * @param {array} extensionVersionData List extension version data for one extension.
	 * @param {int} currentIndex Current index. default "0"
	 *
	 * @return {boolean|*} True if index extension version can be mark as "Auto Pass".
	 */
	checkExtensionVersionCanBePassed( extensionVersionData, currentIndex = 0 ) {

		if ( 1 >= _.size( extensionVersionData ) ) {
			return false;
		}

		currentIndex = parseInt( currentIndex );
		let versions = _.keys( extensionVersionData );
		const sortedVersions = versions.sort( compareVersions ).reverse();

		const currentVersion = sortedVersions[ currentIndex ];
		const currentVersionData = extensionVersionData[ currentVersion ];

		// If current version has error then we don't need to update.
		if ( 0 < parseInt( currentVersionData.error_count ) || 'unknown' !== currentVersionData.verification_status ) {
			return false;
		}

		// If current version doesn't have error check for previous version data.
		const nextIndex = currentIndex + 1;

		if ( nextIndex > sortedVersions.length ) {
			return false;
		}

		const previousVersion = sortedVersions[ nextIndex ] || '';

		// if we don't have previous version then bail out.
		if ( ! previousVersion ) {
			return false;
		}

		const previousVersionData = extensionVersionData[ previousVersion ];

		if ( 0 < parseInt( previousVersionData.error_count ) || 'fail' === previousVersionData.verification_status ) {
			return false;
		}

		if (
			0 === parseInt( previousVersionData.error_count ) &&
			[ 'pass', 'auto_pass' ].includes( previousVersionData.verification_status )
		) {
			return true;
		}

		return this.checkExtensionVersionCanBePassed( extensionVersionData, nextIndex );
	}

}

module.exports = ExtensionVersionVerify;
