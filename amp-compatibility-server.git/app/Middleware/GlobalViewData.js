'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const View = use( 'View' );

class GlobalViewData {

	/**
	 * To set global view variable.
	 *
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Function} next
	 *
	 * @return void
	 */
	async handle( { request }, next ) {

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

		View.global( 'dashboardMenuItems', dashboardMenuItems );
		View.global( 'dashboardActivePage', dashboardActivePage );

		await next()
	}

	/**
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Function} next
	 */
	async wsHandle( { request }, next ) {
		// call next to advance the request
		await next()
	}

	getDashboardMenuItems( request ) {

		let currentRequest = request.url()
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
				isActive: ( '/admin/request-queue' === currentRequest ),
			},
			syntheticQueue: {
				title: 'Synthetic Data Queue',
				url: '/admin/synthetic-queue',
				isActive: ( '/admin/synthetic-queue' === currentRequest ),
			},
			adhocSyntheticQueue: {
				title: 'Adhoc Synthetic Data Queue',
				icon: '',
				url: '/admin/adhoc-synthetic-queue',
				isActive: ( '/admin/adhoc-synthetic-queue' === currentRequest ),
				childs: {
					list: {
						title: 'All Adhoc Requests',
						icon: '',
						url: '/admin/adhoc-synthetic-queue',
						isActive: ( '/admin/adhoc-synthetic-queue' === currentRequest ),
					},
					add: {
						title: 'Add Adhoc Requests',
						icon: '',
						url: '/admin/adhoc-synthetic-queue/add',
						isActive: ( '/admin/adhoc-synthetic-queue/add' === currentRequest ),
					},
				},
			},
		};
	}
}

module.exports = GlobalViewData
