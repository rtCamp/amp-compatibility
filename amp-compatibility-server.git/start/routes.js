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
	Route.get( 'amp-wp', 'RestApiV1Controller.index' );
	Route.post( 'amp-wp', 'RestApiV1Controller.store' );
	Route.get( 'queue', 'BeeQueueController.index' );
	Route.post( 'queue', 'BeeQueueController.store' );
} ).prefix( 'api/v1' );
