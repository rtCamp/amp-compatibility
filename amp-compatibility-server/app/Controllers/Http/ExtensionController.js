'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const ExtensionModel = use( 'App/Models/BigQueryExtension' );
const ErrorModel = use( 'App/Models/BigQueryError' );
const ErrorSourceModel = use( 'App/Models/BigQueryErrorSource' );
const ExtensionVersionModel = use( 'App/Models/BigQueryExtensionVersion' );

const View = use( 'View' );
const Templates = use( 'App/Controllers/Templates' );
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );
const humanFormat = require( 'human-format' );

class ExtensionController {

	/**
	 * To List All UUIDs.
	 *
	 * @param {object} ctx
	 * @param {View} view ctx.view
	 * @param {Request} request ctx.request
	 * @param {Response} response ctx.response
	 * @param {object} params ctx.params
	 *
	 * @return {Promise<Route|String|*>}
	 */
	async index( { request, response, view, params } ) {
		params = _.defaults( params, {
			paged: 1,
			perPage: 50,
			s: request.input( 's' ) || '',
			searchFields: [
				'name',
				'slug',
				'extension_slug',
			],
			orderby: {
				active_installs: 'DESC',
			},
		} );

		const extensionsTableArgs = await this._prepareExtensionsTableArgs( params );
		const total = await ExtensionModel.getCount( params, true );

		const data = {
			tableArgs: extensionsTableArgs,
			pagination: {
				baseUrl: `/admin/extensions`,
				total: total,
				perPage: params.perPage,
				currentPage: params.paged,
			},
			searchString: params.s || '',
		};

		return view.render( 'dashboard/extension', data );
	}

	async _prepareExtensionsTableArgs( params ) {
		const items = await ExtensionModel.getRows( params, true );
		const preparedItems = [];

		for ( const index in items ) {
			const item = items[ index ];

			preparedItems.push( {
				name: item.name,
				slug: {
					slug: item.slug,
					is_wporg: item.wporg,
				},
				type: item.type,
				latest_version: item.latest_version,
				active_installs: humanFormat( item.active_installs ),
				is_partner: {
					extension_slug: item.extension_slug,
					name: item.name,
					is_partner: item.is_partner ? item.is_partner : false,
				},
				last_updated: item.last_updated,
			} );
		}

		const tableArgs = {
			id: 'extensions',
			items: _.toArray( preparedItems ),
			headings: {},
			valueCallback: ( key, value ) => {

				switch ( key ) {
					case 'slug':
						if ( value.is_wporg ) {
							value = `<a href="https://wordpress.org/plugins/${ value.slug }" target="_blank" title="${ value.slug }">${ value.slug }</a>`;
						} else {
							value = value.slug;
						}

						break;
					case 'updated_at':
					case 'created_at':
					case 'last_updated':
						value = ( _.isObject( value ) ) ? value.value : value;
						const dateObject = new Date( value );
						const date = ( '0' + dateObject.getDate() ).slice( -2 );
						const month = ( '0' + ( dateObject.getMonth() + 1 ) ).slice( -2 );
						const year = dateObject.getFullYear();

						value = `<time datetime="${ value }" title="${ value.replace( 'T', ' ' ) }">${ year }-${ month }-${ date }</time>`;
						break;
					case 'is_partner':
						const checked = !! value.is_partner;

						value = `<div class="text-center"><input type="checkbox" data-extension-version="${ value.extension_slug }" data-name="${ value.name }" ${ checked ? 'checked' : '' } ></div>`;

						break;
				}

				return value;
			},
		};

		return tableArgs;
	}
}

module.exports = ExtensionController;
