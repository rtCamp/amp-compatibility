'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const View = use( 'View' );
const Templates = use( 'App/Controllers/Templates' );

class GlobalViewData {

	/**
	 * To set global view variable.
	 *
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Object} ctx.params
	 * @param {Function} next
	 *
	 * @return void
	 */
	async handle( { request, params }, next ) {

		const dashboardMenuItems = this.getDashboardMenuItems( request );
		let dashboardActivePage = dashboardMenuItems.dashboard;

		for ( const itemIndex in dashboardMenuItems ) {

			if ( dashboardMenuItems[ itemIndex ].childs ) {
				for ( const index in dashboardMenuItems[ itemIndex ].childs ) {
					if ( dashboardMenuItems[ itemIndex ].childs[ index ].isActive ) {
						dashboardActivePage = dashboardMenuItems[ itemIndex ].childs[ index ];
					}
				}
			} else if ( dashboardMenuItems[ itemIndex ].isActive ) {
				dashboardActivePage = dashboardMenuItems[ itemIndex ];
			}

		}

		const queryParams = new URLSearchParams( ( request.get() || {} ) );
		const queryString = queryParams.toString() ? '?' + queryParams.toString() : '';

		View.global( 'dashboardMenuItems', dashboardMenuItems );
		View.global( 'dashboardActivePage', dashboardActivePage );
		View.global( 'params', params );
		View.global( 'queryParams', request.get() );
		View.global( 'queryString',queryString );
		View.global( 'parseInt', parseInt );
		View.global( 'snackCaseToString', ( string ) => {
			return string.replace( /_+/g, ' ' );
		} );


		/**
		 * Templates.
		 */
		View.global( 'renderPagination', Templates.renderPagination );

		await next();
	}

	/**
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Function} next
	 */
	async wsHandle( { request }, next ) {
		// call next to advance the request
		await next();
	}

	getDashboardMenuItems( request ) {

		let currentRequest = request.url();
		currentRequest = currentRequest.toString().toLowerCase();

		return {
			dashboard: {
				title: 'Dashboard',
				icon: 'home',
				url: '/admin',
				isActive: ( '/admin' === currentRequest ),
			},
			requestQueue: {
				title: 'Request Queue',
				icon: '',
				url: '/admin/request-queue',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/request-queue' ) ),
			},
			syntheticQueue: {
				title: 'Synthetic Data Queue',
				url: '/admin/synthetic-queue',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/synthetic-queue' ) ),
			},
			adhocSyntheticQueue: {
				title: 'Adhoc Synthetic Data Queue',
				icon: '',
				url: '/admin/adhoc-synthetic-queue',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/adhoc-synthetic-queue' ) && -1 === currentRequest.indexOf( '/admin/adhoc-synthetic-queue/add' ) ),
				childs: {
					list: {
						title: 'All Adhoc Requests',
						icon: '',
						url: '/admin/adhoc-synthetic-queue',
						isActive: ( -1 !== currentRequest.indexOf( '/admin/adhoc-synthetic-queue' ) && -1 === currentRequest.indexOf( '/admin/adhoc-synthetic-queue/add' ) ),
					},
					add: {
						title: 'Add Adhoc Requests',
						icon: '',
						url: '/admin/adhoc-synthetic-queue/add',
						isActive: ( -1 !== currentRequest.indexOf( '/admin/adhoc-synthetic-queue/add' ) ),
					},
				},
			},
			verifyExtensions: {
				title: 'Verify Extensions',
				icon: '',
				url: '/admin/verify-extensions',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/verify-extensions' ) ),
			}
		};
	}
}

module.exports = GlobalViewData;
