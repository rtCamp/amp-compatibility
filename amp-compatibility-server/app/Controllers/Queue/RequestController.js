'use strict';

const Base = use( 'App/Controllers/Queue/Base' );

// Models
const AmpValidatedUrlModel = use( 'App/Models/BigQueryAmpValidatedUrl' );
const AuthorModel = use( 'App/Models/BigQueryAuthor' );
const AuthorRelationshipModel = use( 'App/Models/BigQueryAuthorRelationship' );
const ErrorModel = use( 'App/Models/BigQueryError' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );
const SiteModel = use( 'App/Models/BigQuerySite' );
const SiteToExtensionModel = use( 'App/Models/BigQuerySiteToExtension' );
const UrlErrorRelationshipModel = use( 'App/Models/BigQueryUrlErrorRelationship' );

const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );
const { sanitizor } = require( 'indicative' );

/**
 * Helper to manage request queue.
 */
class RequestController extends Base {

	/**
	 * Default theme that use while generating synthetic data.
	 *
	 * @return {string[]}
	 */
	static get syntheticThemes() {
		return [
			'treville',
		];
	}

	/**
	 * List of common plugin used to generate synthetic data.
	 *
	 * @return {string[]}
	 */
	static get syntheticPlugins() {
		return [
			'amp',
			'amp-wp-dummy-data-generator',
			'wordpress-importer',
			'block-unit-test',
			'coblocks',
		];
	}

	/**
	 * Queue name.
	 *
	 * @returns {string} Queue name
	 */
	static get queueName() {
		return 'request_queue';
	}

	/**
	 * Action before starting worker.
	 *
	 * @param {Object} options Options pass in startWorker.
	 *
	 * @returns {Promise<void>}
	 */
	static async beforeStartWorker( options ) {

		Logger.level = 'debug';

		this.onJobSucceeded = this.onJobSucceeded.bind( this );
		this.onJobRetrying = this.onJobRetrying.bind( this );

		// Terminate the worker if all jobs are completed
		this.queue.on( 'job succeeded', this.onJobSucceeded );
		this.queue.on( 'job retrying', this.onJobRetrying );

		this.queue.on( 'job progress', ( jobId, progress ) => {
			Logger.debug( `Site: ${ this.jobName } reported progress: ${ progress }%` );
		} );

	}

	static onJobSucceeded( jobId, result ) {
		Logger.info( 'Result: Site: %s | Job ID: %s', this.jobName, jobId );
		const preparedLog = this.prepareLog( result );
		console.log( preparedLog );
	}

	static onJobRetrying( jobId, error ) {
		Logger.info( 'Retrying: Site: %s | Job ID: %s', this.jobName, jobId );
		Logger.debug( 'Site: %s | Job ID: %s was failed with below error but is being retried!', this.jobName, jobId );
		console.log( error );
	}

	/**
	 * Handler to process the job.
	 *
	 * @param {Object} job Job to process.
	 *
	 * @returns {*}
	 */
	static async processJob( job ) {

		// @Todo: To use stream method. We need to make sure that same site don't request more then one time within 2 hours.
		let response = {};

		try {

			const data = _.clone( job.data );
			const siteUrl = data.site_url;

			this.jobName = siteUrl;
			this.job = job;
			this.isSyntheticJob = ( !! data.site_info.is_synthetic_data );

			response.isSynthetic = this.isSyntheticJob;

			Logger.info( ' Site: %s | Job ID: %s started.', this.jobName, job.id );

			// Prepare site_info.
			response.site = await this.saveSite( data.site_info );

			job.reportProgress( 10 );

			// Prepare extensions ( themes/plugins )
			const themes = data.themes || [];

			response.themes = await this.saveThemes( themes );
			job.reportProgress( 20 );

			response.plugins = await this.savePlugins( data.plugins );
			job.reportProgress( 30 );

			// Site to extension.
			const siteToExtensionItems = [];
			const siteToExtensionExcluded = [];

			// Prepare site to extension data for themes.
			const insertedThemes = [
				...response.themes.extensionVersions.inserted.itemIds,
				...response.themes.extensionVersions.updated.itemIds,
				...response.themes.extensionVersions.ignored.itemIds,
			];

			for ( const index in themes ) {
				const item = themes[ index ];

				if ( '1' !== item.is_active ) {
					continue;
				}

				const extensionVersionSlug = ExtensionVersionModel.getPrimaryValue( {
					type: 'theme',
					slug: item.slug,
					version: item.version.toString(),
				} );

				if ( ! insertedThemes.includes( extensionVersionSlug ) ) {
					siteToExtensionExcluded.push( extensionVersionSlug );
					continue;
				}

				/**
				 * Then do not include common themes that is used to generate synthetic data
				 * while we process synthetic site.
				 */
				if ( this.isSyntheticJob && this.syntheticThemes.includes( item.slug ) ) {
					siteToExtensionExcluded.push( extensionVersionSlug );
					continue;
				}

				siteToExtensionItems.push( {
					site_url: siteUrl,
					extension_version_slug: extensionVersionSlug,
					amp_suppressed: '',
				} );

			}

			// Prepare site to extension data for plugins.
			const insertedPlugins = [
				...response.plugins.extensionVersions.inserted.itemIds,
				...response.plugins.extensionVersions.updated.itemIds,
				...response.plugins.extensionVersions.ignored.itemIds,
			];

			for ( const index in data.plugins ) {
				const item = data.plugins[ index ];

				if ( '1' !== item.is_active ) {
					continue;
				}

				const extensionVersionSlug = ExtensionVersionModel.getPrimaryValue( {
					type: 'plugin',
					slug: item.slug,
					version: item.version.toString(),
				} );

				if ( ! insertedPlugins.includes( extensionVersionSlug ) ) {
					siteToExtensionExcluded.push( extensionVersionSlug );
					continue;
				}

				/**
				 * Then do not include common plugins that is used to generate synthetic data
				 * while we process synthetic site.
				 */
				if ( this.isSyntheticJob && this.syntheticPlugins.includes( item.slug ) ) {
					siteToExtensionExcluded.push( extensionVersionSlug );
					continue;
				}

				siteToExtensionItems.push( {
					site_url: siteUrl,
					extension_version_slug: extensionVersionSlug,
					amp_suppressed: item.is_suppressed,
				} );

			}

			response.siteToExtension = await this.saveSiteToExtension( siteUrl, siteToExtensionItems );
			response.siteToExtension.excluded = siteToExtensionExcluded || [];
			job.reportProgress( 40 );

			response.errors = await this.saveErrors( data.errors );
			job.reportProgress( 50 );

			response.errorSources = await this.saveErrorSources( data.error_sources );
			job.reportProgress( 60 );

			response.urls = await this.saveValidatedUrls( siteUrl, data.urls );
			job.reportProgress( 100 );

			Logger.info( ' Site: %s | Job ID: %s completed.', this.jobName, job.id );

		} catch ( exception ) {

			Logger.error( 'Site: %s | Job ID: %s failed.', this.jobName, job.id );
			console.error( exception );

			throw exception;
		}

		return response;
	}

	/**
	 * To save site data.
	 *
	 * @param {Object} site Site data.
	 *
	 * @returns {Object} Response of
	 */
	static async saveSite( site ) {

		const data = _.clone( site );

		data.wp_active_theme = ExtensionVersionModel.getPrimaryValue( {
			type: 'theme',
			slug: data.wp_active_theme.slug,
			version: data.wp_active_theme.version,
		} );

		data.amp_supported_post_types = data.amp_supported_post_types || [];
		data.amp_supported_post_types = JSON.stringify( data.amp_supported_post_types );

		data.amp_supported_templates = data.amp_supported_templates || [];
		data.amp_supported_templates = JSON.stringify( data.amp_supported_templates );

		data.is_synthetic_data = data.is_synthetic_data || false;

		return await SiteModel.saveMany( [ data ] );

	}

	/**
	 * To save themes data.
	 *
	 * @param {Array} themes List of theme data.
	 *
	 * @returns {Object}
	 */
	static async saveThemes( themes ) {

		const preparedItems = [];
		const preparedItemVersions = [];
		let response = {};
		const saveOptions = {
			allowUpdate: false,
			useStream: true,
		};

		for ( const index in themes ) {
			const item = themes[ index ];
			let preparedItem = {
				type: 'theme',
				name: item.name,
				slug: item.slug,
				latest_version: item.version,
				requires_wp: item.requires_wp,
				requires_php: item.requires_php,
				tags: JSON.stringify( item.tags ),
			};

			preparedItem.extension_slug = ExtensionModel.getPrimaryValue( preparedItem );

			if ( preparedItem ) {
				preparedItems.push( preparedItem );
				preparedItemVersions.push( ExtensionVersionModel.getItemFromExtension( preparedItem ) );
			}

		}

		/**
		 * We won't be updating exiting records.
		 * Because we can't fully trust website data.
		 * And we already have verify data of wp.org theme.
		 */
		try {

			// @Todo: Save author detail.

			response = {
				extensions: ( await ExtensionModel.saveMany( preparedItems, saveOptions ) ),
				extensionVersions: ( await ExtensionVersionModel.saveMany( preparedItemVersions, saveOptions ) ),
			};
		} catch ( exception ) {
			response = exception;
		}

		return response;

	}

	/**
	 * To save plugins data.
	 *
	 * @param {Array} plugins List of plugin data.
	 *
	 * @returns {Object}
	 */
	static async savePlugins( plugins ) {

		const preparedItems = [];
		const preparedItemVersions = [];
		let response = {};
		const saveOptions = {
			allowUpdate: false,
			useStream: true,
		};

		for ( const index in plugins ) {
			const item = plugins[ index ];
			let preparedItem = {
				type: 'plugin',
				name: item.name,
				slug: item.slug,
				latest_version: item.version,
				requires_wp: item.requires_wp,
				requires_php: item.requires_php,
			};

			preparedItem.extension_slug = ExtensionModel.getPrimaryValue( preparedItem );

			if ( preparedItem ) {
				preparedItems.push( preparedItem );
				preparedItemVersions.push( ExtensionVersionModel.getItemFromExtension( preparedItem ) );
			}

		}

		/**
		 * We won't be updating exiting records.
		 * Because we can't fully trust website data.
		 * And we already have verify data of wp.org theme.
		 */
		try {

			// @Todo: Save author detail.

			response = {
				extensions: ( await ExtensionModel.saveMany( preparedItems, saveOptions ) ),
				extensionVersions: ( await ExtensionVersionModel.saveMany( preparedItemVersions, saveOptions ) ),
			};
		} catch ( exception ) {
			response = exception;
		}

		return response;
	}

	/**
	 * Add site to extensions (plugin) relationship.
	 *
	 * @param {String} siteUrl Site URL
	 * @param {Array} itemsToInsert Prepared list to insert in site to extension table.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveSiteToExtension( siteUrl, itemsToInsert ) {

		let response = {};
		const saveOptions = {
			allowUpdate: false,
			useStream: true,
		};

		/**
		 * We won't be updating exiting records.
		 * Because we can't fully trust website data.
		 * And we already have verify data of wp.org theme.
		 */
		try {

			response.delete = ( await SiteToExtensionModel.deleteRows( { site_url: siteUrl } ) );
			response.insert = ( await SiteToExtensionModel.saveMany( itemsToInsert, saveOptions ) );

		} catch ( exception ) {
			response.delete = exception;
		}

		return response;

	}

	/**
	 * To save site errors.
	 *
	 * @param {Array} errors List of error.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveErrors( errors ) {

		let response = {};
		const saveOptions = {
			allowUpdate: false,
			useStream: true,
		};

		try {
			response = await ErrorModel.saveMany( errors, saveOptions );
		} catch ( exception ) {
			response = exception;
		}

		return response;
	}

	/**
	 * To save error sources.
	 *
	 * @param {Array} errorSources List of error sources.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveErrorSources( errorSources ) {

		let response = {};
		const itemsToInsert = [];
		const allowedTypes = [ 'theme', 'plugin' ];

		try {

			for ( const index in errorSources ) {

				const errorSource = errorSources[ index ];

				/**
				 * Only include source of plugins and themes.
				 * And don't include wp-core's code for error sources.
				 */
				if ( 'string' !== typeof errorSource.type || ! allowedTypes.includes( errorSource.type ) ) {
					continue;
				}

				errorSource.extension_version_slug = ExtensionVersionModel.getPrimaryValue( {
					slug: errorSource.name,
					type: errorSource.type,
					version: errorSource.version,
				} );

				delete errorSource.version;
				delete errorSource.error_slug;

				itemsToInsert.push( errorSource );

			}

			response = await ErrorSourceModel.saveMany( itemsToInsert, {
				allowUpdate: false,
				useStream: true,
			} );
		} catch ( exception ) {
			response = exception;
		}

		return response;

	}

	/**
	 * To save site's validated URL.
	 *
	 * @param {String} siteUrl Site url
	 * @param {Array} urls Validated URls.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveValidatedUrls( siteUrl, urls ) {

		let response = {
			ampValidatedUrl: {},
			urlErrorRelationship: {
				excluded: [],
			},
		};
		const itemsToInsert = [];
		const relationshipItemsToInsert = [];
		let insertedAmpValidatedUrl = [];

		const saveOptions = {
			allowUpdate: false,
			useStream: true,
		};

		/**
		 * Urls
		 */
		for ( const pageIndex in urls ) {
			const item = urls[ pageIndex ];
			const preparedItem = {
				site_url: siteUrl,
				page_url: item.url,
				object_type: item.object_type,
				object_subtype: item.object_subtype,
				css_size_before: item.css_size_before,
				css_size_after: item.css_size_after,
				css_size_excluded: item.css_size_excluded,
				css_budget_percentage: item.css_budget_percentage,
			};

			itemsToInsert.push( preparedItem );

		}

		try {

			response.ampValidatedUrl.delete = await AmpValidatedUrlModel.deleteRows( { site_url: siteUrl } );
			response.ampValidatedUrl.insert = await AmpValidatedUrlModel.saveMany( itemsToInsert, saveOptions );

			insertedAmpValidatedUrl = [
				...response.ampValidatedUrl.insert.inserted.itemIds,
				...response.ampValidatedUrl.insert.updated.itemIds,
				...response.ampValidatedUrl.insert.ignored.itemIds,
			];

		} catch ( exception ) {

			response.ampValidatedUrl.delete = exception;

		}

		this.job.reportProgress( 70 );

		/**
		 * Url error relationships
		 */
		for ( const pageIndex in urls ) {
			const urlData = urls[ pageIndex ];
			const pageUrl = urlData.url;
			const sanitizedPageUrl = sanitizor.toUrl( pageUrl );
			const pageErrors = urlData.errors;

			for ( const errorIndex in pageErrors ) {
				const errorData = pageErrors[ errorIndex ];
				const errorSlug = errorData.error_slug;
				const errorSources = errorData.sources;

				for ( const errorSourceIndex in errorSources ) {

					const relationshipItem = {
						site_url: siteUrl,
						page_url: pageUrl,
						error_slug: errorSlug,
						error_source_slug: errorSources[ errorSourceIndex ],
					};

					/**
					 * Do not insert relationship of page
					 */
					if ( ! insertedAmpValidatedUrl.includes( sanitizedPageUrl ) ) {
						response.urlErrorRelationship.excluded.push( relationshipItem );
						continue;
					}

					relationshipItemsToInsert.push( relationshipItem );

				}

			}

		}

		try {

			response.urlErrorRelationship.delete = await UrlErrorRelationshipModel.deleteRows( { site_url: siteUrl } );
			this.job.reportProgress( 80 );

			response.urlErrorRelationship.insert = await UrlErrorRelationshipModel.saveMany( relationshipItemsToInsert, saveOptions );

		} catch ( exception ) {
			response.urlErrorRelationship.delete = exception;
		}

		return response;

	}

	static prepareLog( result ) {

		const response = {};
		const prepareLog = ( log ) => {

			let preparedLog = {};

			if ( _.has( log, 'code' ) || _.has( log, 'message' ) ) {
				preparedLog = {
					code: log.code || '',
					message: log.message || '',
				};
			} else if ( _.has( log, 'requestedCount' ) ) {

				preparedLog = {
					requestedCount: parseInt( log.requestedCount ) || 0,
					inserted: parseInt( log.inserted.count ) || 0,
					updated: parseInt( log.updated.count ) || 0,
					invalid: parseInt( log.invalid.count ) || 0,
					ignored: parseInt( log.ignored.count ) || 0,
				};
				preparedLog.total = ( preparedLog.inserted + preparedLog.updated + preparedLog.invalid + preparedLog.ignored );
			}

			return preparedLog;
		};

		for ( const key in result ) {

			if ( 'isSynthetic' === key ) {
				response[ key ] = result[ key ];
			} else if ( [ 'themes', 'plugins' ].includes( key ) ) {

				response[ `${ key }_extensions` ] = prepareLog( result[ key ].extensions );
				response[ `${ key }_extensionVersions` ] = prepareLog( result[ key ].extensionVersions );

			} else if ( [ 'siteToExtension' ].includes( key ) ) {

				response[ `${ key }_delete` ] = prepareLog( result[ key ].delete || {} );
				response[ `${ key }_insert` ] = prepareLog( result[ key ].insert || {} );
				response[ `${ key }_excluded` ] = result[ key ].excluded.length; // Foreign key check fail.

			} else if ( [ 'urls' ].includes( key ) ) {

				response[ `${ key }_ampValidatedUrl_delete` ] = prepareLog( result[ key ].ampValidatedUrl.delete || {} );
				response[ `${ key }_ampValidatedUrl_insert` ] = prepareLog( result[ key ].ampValidatedUrl.insert || {} );

				response[ `${ key }_urlErrorRelationship_delete` ] = prepareLog( result[ key ].urlErrorRelationship.delete || {} );
				response[ `${ key }_urlErrorRelationship_insert` ] = prepareLog( result[ key ].urlErrorRelationship.insert || {} );
				response[ `${ key }_urlErrorRelationship_excluded` ] = result[ key ].urlErrorRelationship.excluded.length; // Foreign key check fail.

			} else {

				response[ key ] = prepareLog( result[ key ] );

			}
		}

		return response;
	}

}

module.exports = RequestController;
