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
		View.global( 'queryString', queryString );
		View.global( 'parseInt', parseInt );
		View.global( 'snackCaseToString', ( string ) => {
			return string.replace( /_+/g, ' ' );
		} );
		View.global( 'toHyphenated', ( string ) => {
			return string.toLowerCase().replace( / +/g, '-' );
		} );

		/**
		 * Templates.
		 */
		View.global( 'renderPagination', Templates.renderPagination );
		View.global( 'renderTable', Templates.renderTable );
		View.global( 'renderComponent', Templates.renderComponent );

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
				url: '/admin/request-queue/active',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/request-queue' ) ),
				childs: this.getDashboardMenuChildren( currentRequest, {
					title: 'Request Queue',
					url: '/admin/request-queue',
				} ),
			},
			syntheticQueue: {
				title: 'Synthetic Queue',
				url: '/admin/synthetic-queue/active',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/synthetic-queue' ) ),
				childs: this.getDashboardMenuChildren( currentRequest, {
					title: 'Synthetic Queue',
					url: '/admin/synthetic-queue',
				} ),
			},
			adhocSyntheticQueue: {
				title: 'Adhoc Queue',
				icon: '',
				url: '/admin/adhoc-synthetic-queue/active',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/adhoc-synthetic-queue' ) && -1 === currentRequest.indexOf( '/admin/adhoc-synthetic-queue/add' ) ),
				childs: this.getDashboardMenuChildren( currentRequest, {
					title: 'Adhoc Queue',
					url: '/admin/adhoc-synthetic-queue',
				} ),
			},
			extensions: {
				title: 'Extensions',
				icon: '',
				url: '/admin/extensions',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/extension' ) ),
			},
			uuidReport: {
				title: 'Report by UUID',
				icon: '',
				url: '/admin/report/uuid',
				isActive: ( -1 !== currentRequest.indexOf( '/admin/report/uuid' ) ),
			},
		};
	}

	getDashboardMenuChildren( currentRequest, parentMenu ) {
		const childMenus = [ 'Active', 'Waiting', 'Succeeded', 'Failed', 'Delayed' ];

		return childMenus.map( ( menuItem ) => {
			const menuItemUrl = `${parentMenu.url}/${menuItem.toLowerCase()}`;
			return {
				title: menuItem,
				icon: '',
				parent: parentMenu.title,
				url: menuItemUrl,
				isActive: ( -1 !== currentRequest.indexOf( menuItemUrl ) ),
			};
		} );
	}
}

module.exports = GlobalViewData;
