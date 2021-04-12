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

Route.get( 'logout', 'AuthController.logout' );

Route.get( 'authenticate/google', 'AuthController.authenticateGoogle' );
Route.get( 'authenticated/google', 'AuthController.authenticatedGoogle' );

/**
 * Admin Dashboard.
 */
Route.group( () => {

	/**
	 * Dashboard.
	 */
	Route.get( '/', 'DashboardController.index' );

	/**
	 * Queue pages.
	 */
	Route.get( '/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)', 'QueueController.index' );
	Route.get(
		'/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)/:status(waiting|active|succeeded|failed|delayed|newestJob)',
		'QueueController.index'
	);
	Route.get(
		'/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)/:status(waiting|active|succeeded|failed|delayed|newestJob)/page/:paged',
		'QueueController.index'
	);
	Route.post(
		'/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)/:status(waiting|active|succeeded|failed|delayed|newestJob)',
		'QueueController.update'
	);
	Route.get( '/adhoc-synthetic-queue/add', 'QueueController.addAdhocSyntheticQueue' );
	Route.post( '/adhoc-synthetic-queue/add', 'QueueController.addAdhocSyntheticQueueFetch' );

	/**
	 * Extension verification page.
	 */
	Route.get( '/verify-extensions/', 'VerifyExtensionsController.index' );
	Route.get( '/verify-extensions/page/:paged', 'VerifyExtensionsController.index' );
	Route.post( '/verify-extensions/', 'VerifyExtensionsController.update' );

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
