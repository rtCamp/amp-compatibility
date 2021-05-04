'use strict';

const { Command } = require( '@adonisjs/ace' );

const { getPluginsList, getThemesList } = require( 'wporg-api-client' );

// Models
const AuthorModel = use( 'App/Models/Author' );
const AuthorRelationshipModel = use( 'App/Models/AuthorRelationship' );
const ExtensionModel = use( 'App/Models/Extension' );

// Helpers
const Utility = use( 'App/Helpers/Utility' );
const Stopwatch = use( 'App/Helpers/Stopwatch' );
const Logger = use( 'Logger' );

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
			 { --browse=@value : Predefined query ordering. Possible values are popular,featured,updated and new }
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

		Logger.level = 'debug';

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

			if ( true === flags.onlyThemes ) {
				await this.importThemes();
			}

			if ( true === flags.onlyPlugins ) {
				await this.importPlugins();
			}

			if ( null === flags.onlyPlugins && null === flags.onlyThemes ) {
				await this.importThemes();
				await this.importPlugins();
			}

			this.success( 'wp.org data is imported.' );
		} catch ( exception ) {
			Logger.error( 'Command ended with errors.' );
			Logger.error( exception );
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
			Logger.error( 'Failed to fetch plugins data.' );
			return;
		}

		for ( let page = this.pluginStartFrom; page <= totalPages; page++ ) {

			const stopwatch = new Stopwatch( { name: `Plugin page ${ page }: ` } );

			this.info( `-------------------- Start of Plugin page ${ page } / ${ totalPages } --------------------` );
			stopwatch.start();

			await this.importPluginsByPage( page );

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
			Logger.error( 'Failed to fetch themes.' );
			return;
		}

		for ( let page = this.themeStartFrom; page <= totalPages; page++ ) {

			const stopwatch = new Stopwatch( { name: `Theme page ${ page }: ` } );
			this.info( `-------------------- Start of Theme page ${ page } / ${ totalPages } --------------------` );
			stopwatch.start();

			await this.importThemesByPage( page );

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
	 * @returns void
	 */
	async importPluginsByPage( page ) {

		if ( ! _.isNumber( page ) ) {
			return;
		}

		const filter = _.defaults( {
			page: page,
		}, this.filters );

		const responseData = await this._getPluginsList( filter );
		const responsePlugins = responseData.plugins;

		for ( const index in responsePlugins ) {
			const pluginData = responsePlugins[ index ];

			try {
				await this._savePlugin( pluginData );
			} catch ( exception ) {
				const slug = pluginData.slug || '';
				Logger.error( "Fail to insert/update plugin. '%s' \n%s\n--------------------------", slug, exception );
			}

		}

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
	 * To save individual plugin.
	 *
	 * @private
	 *
	 * @param {Object} pluginData
	 *
	 * @return {Promise<void>}
	 */
	async _savePlugin( pluginData ) {

		if ( ! _.isObject( pluginData ) || ! _.has( pluginData, 'slug' ) ) {
			throw 'Invalid object';
		}

		/**
		 * Save extension info.
		 *
		 * @note Extension model will handle extension version data importing.
		 *
		 * @type {Boolean|Object}
		 */
		const extension = await this.normalizePlugin( pluginData );

		await ExtensionModel.save( extension );

		// Author data.
		let author = {
			profile: pluginData.author_profile,
		};

		if ( ! _.isEmpty( extension ) && ! _.isEmpty( author ) ) {

			/**
			 * Save author.
			 */
			await AuthorModel.save( author );

			/**
			 * Save extension author relationship.
			 */
			const authorRelationships = this.getAuthorRelationship( extension.extension_slug, [ author.profile ] );

			for ( const index in authorRelationships ) {
				await AuthorRelationshipModel.save( authorRelationships[ index ] );
			}

		}

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

		for ( const index in responseThemes ) {
			const themeData = responseThemes[ index ];

			try {
				await this._saveTheme( themeData );
			} catch ( exception ) {
				const slug = themeData.slug || '';
				Logger.error( "Fail to insert/update theme. '%s' \n%s\n--------------------------", slug, exception );
			}

		}

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
	 * To save individual theme.
	 *
	 * @private
	 *
	 * @param {Object} themeData
	 *
	 * @return {Promise<void>}
	 */
	async _saveTheme( themeData ) {

		if ( ! _.isObject( themeData ) || ! _.has( themeData, 'slug' ) ) {
			throw 'Invalid object';
		}

		// Extension data.
		const extension = await this.normalizeTheme( themeData );

		await ExtensionModel.save( extension );

		// Author data.
		let author = await this.normalizeAuthor( themeData.author );

		if ( ! _.isEmpty( extension ) && ! _.isEmpty( author ) ) {

			/**
			 * Save author.
			 */
			await AuthorModel.save( author );

			/**
			 * Save extension author relationship.
			 */
			const authorRelationships = this.getAuthorRelationship( extension.extension_slug, [ author.profile ] );

			for ( const index in authorRelationships ) {
				await AuthorRelationshipModel.save( authorRelationships[ index ] );
			}

		}

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
				profile: authorProfiles[ index ],
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
			profile: data.profile,
			avatar: data.avatar,
			status: data.status || '',
		};

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
				Logger.warning( `Failed to fetch plugin data on "${ attempts }" attempt.` );
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
				Logger.warning( `Failed to fetch theme data on "${ attempts }" attempt.` );
				error = exception;
			}

		}

		throw error;
	}

}

module.exports = WporgScraper;
