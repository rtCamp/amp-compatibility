'use strict';

const Base = use( 'App/Controllers/Queue/Base' );

// Models
const SiteRequestModel = use( 'App/Models/SiteRequest' );
const SiteModel = use( 'App/Models/Site' );
const SiteToExtensionModel = use( 'App/Models/SiteToExtension' );
const ExtensionModel = use( 'App/Models/Extension' );
const ExtensionVersionModel = use( 'App/Models/ExtensionVersion' );
const ErrorModel = use( 'App/Models/Error' );
const ErrorSourceModel = use( 'App/Models/ErrorSource' );
const AmpValidatedUrlModel = use( 'App/Models/AmpValidatedUrl' );
const UrlErrorRelationshipModel = use( 'App/Models/UrlErrorRelationship' );

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
	 * How many times the job should be automatically retried in case of failure.
	 *
	 * @returns {number}
	 */
	static get retries() {
		return 1;
	}

	/**
	 * Database model for queue;
	 *
	 * @return {*}
	 */
	static get databaseModel() {
		return SiteRequestModel;
	}

	static async _createDBRecord( data, jobID ) {

		let response = {};
		const siteUrl = data.site_url || '';
		const summarizedData = await this.summarizeSiteRequest( _.clone( data ) );
		let isSynthetic = data.site_info || {};
		isSynthetic = !! isSynthetic.is_synthetic_data || false;

		let errorLog = data.error_log || {};
		errorLog = errorLog.contents || '';
		errorLog = errorLog.replace( /'/g, '`' );
		errorLog = errorLog.split( "\n" );
		errorLog = JSON.stringify( errorLog );

		const item = {
			uuid: jobID,
			site_url: siteUrl,
			data: JSON.stringify( summarizedData ),
			error_log: errorLog,
			is_synthetic: isSynthetic,
			status: 'waiting',
		};

		response = await this.databaseModel.save( item );

	}

	/**
	 * To summarize site request data to store in raw format
	 *
	 * @param {Object} requestData Request data.
	 *
	 * @return {Promise<{site_url: *, site_info: *}>}
	 */
	static async summarizeSiteRequest( requestData ) {

		const summarizedData = {
			site_url: requestData.site_url,
			site_info: _.clone( requestData.site_info ),
		};

		summarizedData.wp_active_theme = {
			name: requestData.site_info.wp_active_theme.name,
			slug: requestData.site_info.wp_active_theme.slug,
			version: requestData.site_info.wp_active_theme.version,
		};

		delete ( summarizedData.site_info.wp_active_theme );

		/**
		 * Plugin summary.
		 */
		summarizedData.plugins = [];

		for ( const index in requestData.plugins ) {
			const plugin = requestData.plugins[ index ];

			summarizedData.plugins.push( {
				name: plugin.name,
				slug: plugin.slug,
				version: plugin.version,
				is_suppressed: plugin.is_suppressed,
			} );

		}

		/**
		 * Validated URL Summary.
		 */
		summarizedData.errorCount = _.size( requestData.errors ) || 0;
		summarizedData.errorSourceCount = _.size( requestData.error_sources ) || 0;
		summarizedData.urls = _.clone( requestData.urls );

		return summarizedData;
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

	/**
	 * Callback function on success of the job.
	 *
	 * @param {String} jobId Job ID.
	 * @param {Object} result Response from worker.
	 *
	 * @return {Promise<void>}
	 */
	static async onJobSucceeded( jobId, result ) {
		Logger.info( 'Result: Site: %s | Job ID: %s', this.jobName, jobId );
		console.log( Utility.jsonPrettyPrint( result ) );
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

		const data = _.clone( job.data );

		this.siteRequestUUID = job.id;
		this.jobName = data.site_url;
		this.job = _.clone( job );
		this.isSyntheticJob = ( !! data.site_info.is_synthetic_data );

		try {

			await this.databaseModel.save( {
				uuid: job.id,
				status: 'active',
			} );

			response.isSynthetic = this.isSyntheticJob;

			Logger.info( ' Site: %s | Job ID: %s started.', this.jobName, job.id );

			// Save Extensions && it's versions. (before site table have it's foreign key)
			response.extensions = await this.saveExtensions( data );
			job.reportProgress( 15 );

			await Utility.sleep( 1 );

			// Save errors.
			response.errors = await this.saveErrors( data );
			job.reportProgress( 30 );

			await Utility.sleep( 2 );

			// Save error sources.
			response.errorsSources = await this.saveErrorSources( data );
			job.reportProgress( 45 );

			await Utility.sleep( 2 );

			// Save site info.
			response.site = await this.saveSite( data );
			job.reportProgress( 50 );

			// Save site to extension info.
			response.siteToExtensions = await this.saveSiteToExtensions( data );
			job.reportProgress( 70 );

			await Utility.sleep( 1 );

			// Save amp validate URLs and URL error mapping.
			response.validatedURLs = await this.saveValidatedUrls( data );
			job.reportProgress( 100 );

			await Utility.sleep( 5 );

		} catch ( exception ) {

			Logger.crit( "Site: %s | Job ID: %s failed. \n      %s", this.jobName, job.id, exception );

			throw exception;
		}

		return response;
	}

	/**
	 * To save extension information.
	 *
	 * @param {object} requestData Request data.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveExtensions( requestData ) {

		const response = {};
		const themes = requestData.themes || [];
		const plugins = requestData.plugins || [];

		/**
		 * Theme.
		 */
		if ( ! _.isEmpty( themes ) ) {
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

				response[ preparedItem.extension_slug ] = await ExtensionModel.createIfNotExists( preparedItem );

				/**
				 * Insert extension version
				 */
				if ( ! response[ preparedItem.extension_slug ] ) {
					await ExtensionVersionModel.createIfNotExists( {
						extension_slug: preparedItem.extension_slug,
						type: 'theme',
						slug: item.slug,
						version: item.version,
					} );
				}

			}
		}

		/**
		 * Plugins.
		 */
		if ( ! _.isEmpty( plugins ) ) {
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

				response[ preparedItem.extension_slug ] = await ExtensionModel.createIfNotExists( preparedItem );

				if ( ! response[ preparedItem.extension_slug ] ) {
					await ExtensionVersionModel.createIfNotExists( {
						extension_slug: preparedItem.extension_slug,
						type: 'plugin',
						slug: item.slug,
						version: item.version,
					} );
				}

			}
		}

		return response;
	}

	/**
	 * To save site errors.
	 *
	 * @param {object} requestData Request data.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveErrors( requestData ) {

		const response = {};
		const errors = requestData.errors || [];

		if ( _.isEmpty( errors ) ) {
			return response;
		}

		for ( const index in errors ) {

			const error = errors[ index ];
			const errorSlug = error.error_slug || ''; // ErrorModel.getPrimaryValue( error );

			if ( ! errorSlug ) {
				continue;
			}

			response[ errorSlug ] = await ErrorModel.createIfNotExists( error );

		}

		return response;
	}

	/**
	 * To save error source information.
	 *
	 * @param {object} requestData Request data.
	 * @return {Promise<{}>}
	 */
	static async saveErrorSources( requestData ) {

		const errorSources = _.clone( requestData.error_sources ) || [];
		const response = {};
		const allowedTypes = [ 'theme', 'plugin' ];

		if ( _.isEmpty( errorSources ) ) {
			return response;
		}

		for ( const index in errorSources ) {

			const errorSource = _.clone( errorSources[ index ] );
			const errorSourceSlug = errorSource.error_source_slug || '';

			/**
			 * Only include source of plugins and themes.
			 * And don't include wp-core's code for error sources.
			 */
			if ( _.isEmpty( errorSourceSlug ) || 'string' !== typeof errorSource.type || ! allowedTypes.includes( errorSource.type ) ) {
				continue;
			}

			errorSource.extension_version_slug = await ExtensionVersionModel.getPrimaryValue( {
				slug: errorSource.name,
				type: errorSource.type,
				version: errorSource.version,
			} );

			// @TODO: Prevent unwanted field to being inserted in query.
			delete errorSource.version;
			delete errorSource.error_slug;
			delete errorSource.widget_id;
			delete errorSource.post_id;

			// @TODO remove this.
			if ( _.isEmpty( errorSource.extension_version_slug ) ) {
				continue;
			}

			response[ errorSourceSlug ] = await ErrorSourceModel.createIfNotExists( errorSource );

		}

		return response;

	}

	/**
	 * To save site data.
	 *
	 * @param {Object} requestData Request data.
	 *
	 * @returns {Object}
	 */
	static async saveSite( requestData ) {

		const site = _.clone( requestData.site_info ) || {};

		site.wp_active_theme = ExtensionVersionModel.getPrimaryValue( {
			type: 'theme',
			slug: site.wp_active_theme.slug || '',
			version: site.wp_active_theme.version || '',
		} );

		site.amp_supported_post_types = site.amp_supported_post_types || [];
		site.amp_supported_post_types = JSON.stringify( site.amp_supported_post_types );

		site.amp_supported_templates = site.amp_supported_templates || [];
		site.amp_supported_templates = JSON.stringify( site.amp_supported_templates );

		site.is_synthetic_data = site.is_synthetic_data || false;

		return ( await SiteModel.save( site ) );

	}

	/**
	 * To save site to extensions.
	 *
	 * @param {Object} requestData Request data.
	 *
	 * @returns {Object}
	 */
	static async saveSiteToExtensions( requestData ) {

		const response = {};
		const siteURL = requestData.site_url;
		const themes = requestData.themes || [];
		const plugins = requestData.plugins || [];

		/**
		 * Theme.
		 */
		if ( ! _.isEmpty( themes ) ) {
			for ( const index in themes ) {
				const item = themes[ index ];

				let preparedItem = {
					site_url: siteURL,
					amp_suppressed: item.is_suppressed || '',
				};

				preparedItem.extension_version_slug = ExtensionVersionModel.getPrimaryValue( {
					type: 'theme',
					name: item.name,
					slug: item.slug,
					version: item.version,
				} );

				await SiteToExtensionModel.query().where( 'site_url', siteURL ).delete();
				response[ preparedItem.extension_version_slug ] = await SiteToExtensionModel.save( preparedItem );
			}
		}

		/**
		 * Plugins
		 */
		if ( ! _.isEmpty( plugins ) ) {
			for ( const index in plugins ) {
				const item = plugins[ index ];

				let preparedItem = {
					site_url: siteURL,
					amp_suppressed: item.is_suppressed || '',
				};

				preparedItem.extension_version_slug = ExtensionVersionModel.getPrimaryValue( {
					type: 'plugin',
					name: item.name,
					slug: item.slug,
					version: item.version,
				} );

				response[ preparedItem.extension_version_slug ] = await SiteToExtensionModel.save( preparedItem );
			}
		}

		return response;

	}

	/**
	 * To save site's validated URL.
	 *
	 * @param {Object} requestData Request data.
	 *
	 * @returns {Promise<void>}
	 */
	static async saveValidatedUrls( requestData ) {

		const siteURL = requestData.site_url;
		const urls = requestData.urls || [];
		const response = {};
		const restCounter = 2000;
		let saveCounter = 0;

		/**
		 * Urls
		 */
		for ( const pageIndex in urls ) {
			const item = urls[ pageIndex ];
			const errors = urls[ pageIndex ].errors || [];
			const pageURL = sanitizor.toUrl( item.url );
			const pageResponse = {};

			const preparedItem = {
				site_url: siteURL,
				page_url: pageURL,
				object_type: item.object_type,
				object_subtype: item.object_subtype,
				css_size_before: item.css_size_before,
				css_size_after: item.css_size_after,
				css_size_excluded: item.css_size_excluded,
				css_budget_percentage: item.css_budget_percentage,
				site_request_uuid: this.siteRequestUUID,
			};

			/**
			 * Save AMP validate URL record.
			 */
			pageResponse.page = await AmpValidatedUrlModel.save( preparedItem );
			saveCounter++;

			/**
			 * Delete all previous url error relation related to page.
			 */
			pageResponse.relationDelete = await UrlErrorRelationshipModel.query().where( 'page_url', pageURL ).delete();

			pageResponse.relationships = {};

			/**
			 * Insert new url error relation related to page.
			 */
			for ( const errorIndex in errors ) {
				const errorData = errors[ errorIndex ];
				const errorSlug = errorData.error_slug;
				const errorSources = errorData.sources;

				for ( const errorSourceIndex in errorSources ) {

					const relationshipItem = {
						site_url: siteURL,
						page_url: pageURL,
						error_slug: errorSlug,
						error_source_slug: errorSources[ errorSourceIndex ],
					};

					pageResponse.relationships[ pageURL ] = await UrlErrorRelationshipModel.save( relationshipItem );

					saveCounter++;

					if ( 0 === saveCounter % restCounter ) {
						await Utility.sleep( 2 );
					}
				}
			}

			response[ pageURL ] = pageResponse;
		}

		return response;

	}

}

module.exports = RequestController;
