'use strict';

const _ = require( 'underscore' );
const RequestQueueController = use( 'App/Controllers/Queue/RequestController' );
const AmpRequestValidator = use( 'App/Validators/AmpRequest' );
const Logger = use( 'Logger' );
const Helpers = use( 'Helpers' );
const fs = require( 'fs' );
const path = require( 'path' );

class RestController {

	/**
	 * API endpoint callback.
	 *
	 * @method GET
	 *
	 * @return object Response data.
	 */
	index() {
		return { status: 'ok' };
	}

	/**
	 * API endpoint callback.
	 *
	 * @method POST
	 *
	 * @return object Response data.
	 */
	async store( { request } ) {

		const requestData = request.post();

		if ( _.isEmpty( requestData ) ) {
			return { status: 'fail' };
		}

		const validation = await AmpRequestValidator.validateAll( requestData );

		if ( validation.fails() ) {
			return {
				status: 'fail',
				data: validation.messages(),
			};
		}

		// @Todo: To use stream method. We need to make sure that same site don't request more then one time within 2 hours.
		const siteUrl = requestData.site_url || '';
		Logger.info( 'Site: %s', siteUrl );

		await RequestQueueController.createJob( requestData );

		return { status: 'ok' };
	}

	/**
	 * Depends on local data.
	 * @see `node ace wporg:scraper --only-store-in-local`
	 * @param string term Filters data by term.
	 */
	listPlugins( r ) {
		var query = r.request.input('term');

		let pluginSlugs = fs.readdirSync(
			Helpers.appRoot() + `/data/plugin/`
		);

		pluginSlugs = pluginSlugs.filter( function( el ) {
			return el.toLowerCase().indexOf( query.toLowerCase() ) !== -1
		});

		return JSON.stringify( pluginSlugs );
	}

	/**
	 * Depends on local data.
	 * @see `node ace wporg:scraper --only-store-in-local`
	 * @param string term Filters data by term.
	 */
	listThemes( r ) {
		var query = r.request.input('term');

		let themeSlugs = fs.readdirSync(
			Helpers.appRoot() + `/data/theme/`
		);

		themeSlugs = themeSlugs.filter( function( el ) {
			return el.toLowerCase().indexOf( query.toLowerCase() ) !== -1
		});

		return JSON.stringify( themeSlugs );
	}
}

module.exports = RestController;
