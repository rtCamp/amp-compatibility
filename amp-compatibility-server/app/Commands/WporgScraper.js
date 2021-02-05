'use strict';

const { Command } = require( '@adonisjs/ace' );

const { getPluginsList, getThemesList } = require( 'wporg-api-client' );

// Models
const AuthorModel = use( 'App/Models/BigQueryAuthor' );
const AuthorRelationshipModel = use( 'App/Models/BigQueryAuthorRelationship' );
const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

// Helpers
const Utility = use( 'App/Helpers/Utility' );
const FileSystem = use( 'App/Helpers/FileSystem' );
const Stopwatch = use( 'App/Helpers/Stopwatch' );
const Logger = use( 'Logger' );
const Helpers = use( 'Helpers' );

// Utilities
const { exit } = require( 'process' );
const _ = require( 'underscore' );

class WporgScraper extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {

		// Note: Keep the space as it is.
		return `wporg:scraper
			 { --only-themes : To fetch and only themes data from wordpress.org. }
			 { --only-plugins : To fetch and only plugins data from wordpress.org. }
			 { --only-store-in-local : It will only store data in local directory, And won't import in BigQuery. }
			 { --browse=@value : Predefined query ordering. Possible values are popular,featured,updated and new }
			 { --use-stream : Use stream method to if possible. Fast but with certain limitation. Reference - //cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations }
			 { --per-page=@value : Number of theme/plugin need to fetch per API call ( Min=2, Max=100, Default=100 ).. }
			 { --theme-start-from=@value : From which page we need to start importing themes. Default 1 }
			 { --plugin-start-from=@value : From which page we need to start importing plugins. Default 1 }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'List of command to scrap wordpress.org themes and plugins data.';
	}

	/**
	 * Number of records need to fetch per page.
	 *
	 * @returns {number}
	 */
	get perPage() {
		return this.options.perPage || 100;
	}

	/**
	 * Options to how to save record.
	 *
	 * @returns {number}
	 */
	get saveOptions() {
		return {
			useStream: this.options.useStream,
		};
	}

	/**
	 * From which page theme importing should started.
	 *
	 * @returns {number}
	 */
	get themeStartFrom() {
		return this.options.themeStartFrom || 1;
	}

	/**
	 * From which page plugin importing should started.
	 *
	 * @returns {number}
	 */
	get pluginStartFrom() {
		return this.options.pluginStartFrom || 1;
	}

	/**
	 * Number of retry that need to make for wp.org API in case of fails.
	 *
	 * @returns {number}
	 */
	get maxAttempts() {
		return 5;
	}

	/**
	 * Filter for wp.org API.
	 *
	 * @returns {Object}
	 */
	get filters() {
		return {
			per_page: this.perPage,
			browse: this.options.browse || 'popular',
			fields: {
				description: true,
				rating: true,
				ratings: true,
				downloaded: true,
				download_link: true,
				last_updated: true,
				homepage: true,
				tags: true,
				template: true,
				parent: true,
				versions: true,
				screenshot_url: true,
				active_installs: true,
			},
		};
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, flags ) {

		const perPage = parseInt( flags.perPage ) || 100;
		const allowedBrowse = [ 'popular', 'featured', 'updated', 'new' ];

		this.options = {
			perPage: ( perPage >= 2 && perPage <= 100 ) ? perPage : 100,
			themeStartFrom: parseInt( flags.themeStartFrom ) || 1,
			pluginStartFrom: parseInt( flags.pluginStartFrom ) || 1,
			useStream: ( true === flags.useStream ),
			browse: ( ! _.isEmpty( flags.browse ) && allowedBrowse.includes( flags.browse ) ) ? flags.browse : 'popular',
			onlyStoreInLocal: ( true === flags.onlyStoreInLocal ),
		};

		try {

			this.warn( 'Before start importing data make sure redis cache is up to date.' );
			this.warn( 'Use command to update redis cache. "node ace cache"' + "\n" );

			if ( this.options.useStream ) {
				this.warn( 'We are using "Stream" method to insert records.' );
				this.warn( 'It is fast but have certain limitation. Please check below document.' );
				this.warn( '- https://cloud.google.com/bigquery/docs/reference/standard-sql/data-manipulation-language#limitations' + "\n" );
			}

			if ( true === flags.onlyThemes ) {
				await this.importThemes();
			}

			if ( true === flags.onlyPlugins ) {
				await this.importPlugins();
			}

			if ( null === flags.onlyPlugins && null === flags.onlyThemes ) {
				await this.importPlugins();
				await this.importThemes();
			}

			this.success( 'wp.org data is imported.' );
		} catch ( e ) {
			console.log( e );
			this.error( 'Command ended with errors.' );
		}

		exit( 1 );
	}

	/**
	 * To import all plugins from wp.org into BigQuery.
	 *
	 * @returns {Promise<void>}
	 */
	async importPlugins() {

		this.info( 'Plugin import start' );

		const filter = _.defaults( {
			page: 1,
		}, this.filters );

		const responseData = await this._getPluginsList( filter );
		const totalPages = parseInt( responseData.info.pages ) || 0;

		if ( ! _.isNumber( totalPages ) ) {
			this.error( 'Failed to fetch plugins data.' );
			return;
		}

		for ( let page = this.pluginStartFrom; page <= totalPages; page++ ) {

			const stopwatch = new Stopwatch( { name: `Plugin page ${ page }: ` } );

			this.info( `-------------------- Start of Plugin page ${ page } / ${ totalPages } --------------------` );
			stopwatch.start();

			const results = await this.importPluginsByPage( page );

			if ( ! this.options.onlyStoreInLocal ) {
				Logger.info( Utility.jsonPrettyPrint( results ) );
			}

			stopwatch.stop();
			this.info( `-------------------- End of Plugin page ${ page } / ${ totalPages } ----------------------` + "\n" );

			if ( 0 === ( page % 10 ) ) {
				await Utility.sleep( 1 );
			}

		}

	}

	/**
	 * To import all themes from wp.org into BigQuery.
	 *
	 * @returns {Promise<void>}
	 */
	async importThemes() {

		this.info( 'Theme import start' );

		const filter = _.defaults( {
			page: 1,
		}, this.filters );

		const responseData = await this._getThemesList( filter );
		const totalPages = parseInt( responseData.info.pages ) || 0;

		if ( ! _.isNumber( totalPages ) ) {
			this.error( 'Failed to fetch themes.' );
			return;
		}

		for ( let page = this.themeStartFrom; page <= totalPages; page++ ) {

			const stopwatch = new Stopwatch( { name: `Theme page ${ page }: ` } );
			this.info( `-------------------- Start of Theme page ${ page } / ${ totalPages } --------------------` );
			stopwatch.start();

			const results = await this.importThemesByPage( page );

			if ( ! this.options.onlyStoreInLocal ) {
				Logger.info( Utility.jsonPrettyPrint( results ) );
			}

			stopwatch.stop();
			this.info( `-------------------- End of Theme page ${ page } / ${ totalPages } ----------------------` + "\n" );

			if ( 0 === ( page % 10 ) ) {
				await Utility.sleep( 1 );
			}
		}

	}

	/**
	 * To import plugins data in BigQuery from wp.org API.
	 *
	 * @param {Integer} page Page number that need import.
	 *
	 * @returns {Promise<boolean|Object>} Object of response of BigQuery on success, Otherwise false.
	 */
	async importPluginsByPage( page ) {

		if ( ! _.isNumber( page ) ) {
			return false;
		}

		const filter = _.defaults( {
			page: page,
		}, this.filters );

		const responseData = await this._getPluginsList( filter );
		const responsePlugins = responseData.plugins;
		let extensions = [];
		let authors = [];
		let authorRelationship = [];
		let extensionVersions = [];

		for ( const index in responsePlugins ) {
			const pluginData = responsePlugins[ index ];

			if ( ! _.isObject( pluginData ) || ! _.has( pluginData, 'slug' ) ) {
				continue;
			}

			// Store in local directory.
			await this.saveJSON( 'plugin', pluginData );

			if ( this.options.onlyStoreInLocal ) {
				continue;
			}

			// Author data.
			let author = {
				author_profile: pluginData.author_profile,
			};

			// Extension data.
			const extension = await this.normalizePlugin( pluginData );

			if ( _.isObject( extension ) ) {
				extensions.push( extension );

				// Extension versions data.
				extensionVersions.push( ExtensionVersionModel.getItemFromExtension( extension ) );
			}

			if ( ! _.isEmpty( extension ) && ! _.isEmpty( author ) ) {

				// Author relationship data.
				authorRelationship = authorRelationship.concat(
					this.getAuthorRelationship( extension.extension_slug, [ author.author_profile ] ),
				);
			}

		}

		const response = {
			extensions: await ExtensionModel.saveMany( extensions, this.saveOptions ),
			authors: await AuthorModel.saveMany( authors, this.saveOptions ),
			authorRelationships: await AuthorRelationshipModel.saveMany( authorRelationship, this.saveOptions ),
			extensionVersions: await ExtensionVersionModel.saveMany( extensionVersions, this.saveOptions ),
		};

		return response;

	}

	/**
	 * To import themes data in BigQuery from wp.org API.
	 *
	 * @param {Integer} page Page number that need import.
	 *
	 * @returns {Promise<boolean|Object>} Object of response of BigQuery on success, Otherwise false.
	 */
	async importThemesByPage( page ) {

		if ( ! _.isNumber( page ) ) {
			return false;
		}

		const filter = _.defaults( {
			page: page,
		}, this.filters );

		const responseData = await this._getThemesList( filter );
		const responseThemes = responseData.themes;
		let extensions = [];
		let authors = [];
		let authorRelationship = [];
		let extensionVersions = [];

		for ( const index in responseThemes ) {
			const themeData = responseThemes[ index ];

			if ( ! _.isObject( themeData ) || ! _.has( themeData, 'slug' ) ) {
				continue;
			}

			// Store in local directory.
			await this.saveJSON( 'theme', themeData );

			if ( this.options.onlyStoreInLocal ) {
				continue;
			}

			// Author data.
			let author = await this.normalizeAuthor( themeData.author );

			if ( _.isObject( author ) ) {
				authors.push( author );
			}

			// Extension data.
			const extension = await this.normalizeTheme( themeData );

			if ( _.isObject( extension ) ) {
				extensions.push( extension );

				// Extension versions data.
				extensionVersions.push( ExtensionVersionModel.getItemFromExtension( extension ) );
			}

			if ( ! _.isEmpty( extension ) && ! _.isEmpty( author ) ) {

				// Author relationship data.
				authorRelationship = authorRelationship.concat(
					this.getAuthorRelationship( extension.extension_slug, [ author.author_profile ] ),
				);
			}

		}

		const response = {
			extensions: await ExtensionModel.saveMany( extensions, this.saveOptions ),
			authors: await AuthorModel.saveMany( authors, this.saveOptions ),
			authorRelationships: await AuthorRelationshipModel.saveMany( authorRelationship, this.saveOptions ),
			extensionVersions: await ExtensionVersionModel.saveMany( extensionVersions, this.saveOptions ),
		};

		return response;
	}

	/**
	 * To generate author relationship records.
	 *
	 * @param {String} extensionSlug Extension slug.
	 * @param {Array} authorProfiles List of author profiles.
	 *
	 * @returns {Array} List of entry for author relationship table.
	 */
	getAuthorRelationship( extensionSlug, authorProfiles = [] ) {

		if ( _.isEmpty( authorProfiles ) || ! _.isArray( authorProfiles ) ) {
			return [];
		}

		let authorRelationships = [];

		for ( let index in authorProfiles ) {

			const authorRelationship = {
				extension_slug: extensionSlug,
				author_profile: authorProfiles[ index ],
			};

			authorRelationship[ AuthorRelationshipModel.primaryKey ] = AuthorRelationshipModel.getPrimaryValue( authorRelationship );

			authorRelationships.push( authorRelationship );
		}

		return authorRelationships;

	}

	/**
	 * To normalize author data.
	 *
	 * @param {Object} data Author details.
	 *
	 * @returns {Promise<Boolean|Object>} Normalize author details.
	 */
	async normalizeAuthor( data ) {

		if ( ! data || 'object' !== typeof data ) {
			return false;
		}

		return {
			user_nicename: data.user_nicename,
			display_name: data.display_name,
			author_profile: data.profile,
			avatar: data.avatar,
			status: data.status || '',
		};

	}

	/**
	 * To normalize theme data from wp.org api response.
	 *
	 * @param {Object} data Response from wp.org data.
	 *
	 * @returns {Promise<Boolean|Object>} Object on valid data otherwise false.
	 */
	async normalizeTheme( data ) {

		if ( ! data || 'object' !== typeof data ) {
			return false;
		}

		const type = 'theme';
		const averageRating = Utility.getAverageRating( data.ratings );

		let validatedData = {
			wporg: true,
			type: type,
			name: data.name,
			slug: data.slug,
			latest_version: data.version.toString(),
			requires_wp: data.requires,
			tested_wp: '',
			requires_php: data.requires_php,
			average_rating: averageRating,
			support_threads: '',
			support_threads_resolved: '',
			active_installs: data.active_installs || 0,
			downloaded: data.downloaded || 0,
			last_updated: data.last_updated || null,
			date_added: null,
			homepage_url: data.homepage,
			short_description: data.description.replace( /\n/g, ' ' ), // @TODO: This should be handled during escaping.
			download_url: data.versions[ data.version.toString() ],
			author_url: '',
			extension_url: data.preview_url,
			preview_url: data.preview_url,
			screenshot_url: data.screenshot_url,
			tags: ( ! _.isEmpty( data.tags ) ) ? JSON.stringify( data.tags ) : '',
			icon_url: '',
		};

		validatedData.extension_slug = ExtensionModel.getPrimaryValue( validatedData );

		return validatedData;
	}

	/**
	 * To normalize plugin data from wp.org api response.
	 *
	 * @param {Object} data Response from wp.org data.
	 *
	 * @returns {Promise<Boolean|Object>} Object on valid data otherwise false.
	 */
	async normalizePlugin( data ) {

		if ( ! data || 'object' !== typeof data ) {
			return false;
		}

		const type = 'plugin';
		const averageRating = Utility.getAverageRating( data.ratings );

		const validatedData = {
			extension_slug: `${ type }-${ data.slug }`,
			wporg: true,
			type: type,
			name: data.name,
			slug: data.slug,
			latest_version: data.version.toString(),
			requires_wp: data.requires,
			tested_wp: data.tested || '',
			requires_php: data.requires_php,
			average_rating: averageRating,
			support_threads: data.support_threads || 0,
			support_threads_resolved: data.support_threads_resolved || 0,
			active_installs: data.active_installs || 0,
			downloaded: data.downloaded || 0,
			last_updated: Utility.convertWpOrgDatetime( data.last_updated ) || null,
			date_added: data.added || null,
			homepage_url: data.homepage,
			short_description: data.short_description.replace( /\n/g, ' ' ), // @TODO: This should be handled during escaping.
			download_url: data.download_link,
			author_url: '',
			extension_url: data.preview_url,
			preview_url: data.preview_url,
			screenshot_url: data.screenshot_url,
			tags: _.isArray( data.tags ) ? JSON.stringify( data.tags ) : '',
			icon_url: data.icons[ '2x' ] || '',
		};

		validatedData.extension_slug = ExtensionModel.getPrimaryValue( validatedData );

		return validatedData;
	}

	/**
	 * Wrapper function to get plugin list.
	 * On fail it will try upto maxAttempt to get data.
	 *
	 * @private
	 *
	 * @param filter
	 * @returns {Promise<boolean|*>}
	 */
	async _getPluginsList( filter ) {

		let error = false;

		for ( let attempts = 0; attempts < this.maxAttempts; attempts++ ) {

			try {
				const responseData = await getPluginsList( filter );
				return responseData.data;
			} catch ( exception ) {
				this.warn( `Failed to fetch plugin data on "${ attempts }" attempt.` );
				error = exception;
			}

		}

		throw error;
	}

	/**
	 * Wrapper function to get theme list.
	 * On fail it will try upto maxAttempt to get data.
	 *
	 * @private
	 *
	 * @param filter
	 * @returns {Promise<boolean|*>}
	 */
	async _getThemesList( filter ) {

		let error = false;

		for ( let attempts = 0; attempts < this.maxAttempts; attempts++ ) {

			try {
				const responseData = await getThemesList( filter );
				return responseData.data;
			} catch ( exception ) {
				this.warn( `Failed to fetch theme data on "${ attempts }" attempt.` );
				error = exception;
			}

		}

		throw error;
	}

	/**
	 * To save content of wp.org in respected JSON file.
	 *
	 * @param {String} type Either "plugin"
	 * @param {Object} data Data that need to save.
	 *
	 * @return {Promise<boolean>} True on success otherwise False.
	 */
	async saveJSON( type, data ) {

		if ( _.isEmpty( type ) || _.isEmpty( data ) ) {
			return false;
		}

		let slug = data.slug || '';

		type = type.toString().toLowerCase();
		slug = slug.toString().toLowerCase();

		const fileToSave = Helpers.appRoot() + `/data/${ type }/${ slug }/info.json`;

		return ( await FileSystem.writeFile( fileToSave, Utility.jsonPrettyPrint( data ) ) );
	}
}

module.exports = WporgScraper;
