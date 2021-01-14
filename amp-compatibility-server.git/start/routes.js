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

Route.get( 'login', 'AuthController.renderLogin' );
Route.post( 'login', 'AuthController.login' );
Route.get( 'logout', 'AuthController.logout' );

/**
 * Admin Dashboard.
 */
Route.group( () => {

	Route.get( '/', 'DashboardController.index' );
	Route.get( '/request-queue', 'DashboardController.requestQueue' );
	Route.get( '/synthetic-queue', 'DashboardController.syntheticQueue' );
	Route.get( '/adhoc-synthetic-queue', 'DashboardController.adhocSyntheticQueue' );
	Route.get( '/adhoc-synthetic-queue/add', 'DashboardController.addAdhocSyntheticQueue' );

} ).prefix( 'admin' ).middleware( 'auth' );

/**
 * API endpoint.
 */
Route.group( () => {

	/**
	 * Rest APIs for AMP WP Plugins.
	 */
	Route.get( 'amp-wp', 'RestController.index' );
	Route.post( 'amp-wp', 'RestController.store' );

} ).prefix( 'api/v1' );
