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

Route.get( 'authenticate/google', 'AuthController.authenticateGoogle' ).middleware( 'throttle:10' );
Route.get( 'authenticated/google', 'AuthController.authenticatedGoogle' ).middleware( 'throttle:10' );

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
	Route.get( '/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)', 'QueueController.indexMySQL' );
	Route.get(
		'/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)/:status(waiting|active|succeeded|failed|delayed|newestJob)',
		'QueueController.indexMySQL'
	);
	Route.get(
		'/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)/:status(waiting|active|succeeded|failed|delayed|newestJob)/page/:paged',
		'QueueController.indexMySQL'
	);
	Route.post(
		'/:queue(request-queue|synthetic-queue|adhoc-synthetic-queue)/:status(waiting|active|succeeded|failed|delayed|newestJob)',
		'QueueController.update'
	);
	Route.get( '/adhoc-synthetic-queue/add', 'QueueController.addAdhocSyntheticQueue' );
	Route.post( '/adhoc-synthetic-queue/add', 'QueueController.addAdhocSyntheticQueueFetch' );

	/**
	 * Extensions
	 */
	Route.get( '/extensions/', 'ExtensionController.index' );
	Route.get( '/extensions/search', 'ExtensionController.search' );
	Route.get( '/extension/:extension_slug', 'ExtensionController.show' );
	Route.get( '/extensions/page/:paged', 'ExtensionController.index' );
	Route.post( '/extensions/', 'ExtensionController.update' );
	Route.post( '/extensions/version', 'ExtensionController.extensionVersionUpdate' );

	/**
	 * Report.
	 */
	Route.get( '/report/', 'ReportUuidController.index' );
	Route.get( '/report/page/:paged', 'ReportUuidController.index' );

	Route.get( '/report/uuid/:uuid', 'ReportUuidController.show' );
	Route.get( '/report/site/:site', 'ReportSiteController.show' );

} ).prefix( 'admin' ).middleware( 'auth' ).middleware( 'throttle:30' );

/**
 * API endpoint.
 */
Route.group( () => {

	/**
	 * Rest APIs for AMP WP Plugins.
	 */
	Route.get( 'amp-wp', 'RestController.index' );
	Route.post( 'amp-wp', 'RestController.store' );

} ).prefix( 'api/v1' ).middleware( 'throttle:30' );
