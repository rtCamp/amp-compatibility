'use strict';

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use( 'Route' );

Route.on( '/' ).render( 'welcome' );

Route.group( () => {

	/**
	 * Rest APIs for AMP WP Plugins.
	 */
	Route.get( 'amp-wp', 'RestController.index' );
	Route.post( 'amp-wp', 'RestController.store' );

	/**
	 * Rest APIs for synthetic data generator server.
	 */
	Route.get( 'synthetic-data', 'SyntheticDataController.index' ).middleware( 'auth:basic' );
	Route.post( 'synthetic-data', 'SyntheticDataController.store' ).middleware( 'auth:basic' );

} ).prefix( 'api/v1' );
