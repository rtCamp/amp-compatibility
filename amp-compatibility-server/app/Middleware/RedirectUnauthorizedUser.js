'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/Session')} Session */

const Exception = use( 'Exception' );

class RedirectUnauthorizedUser {

	/**
	 * Redirect unauthorized user to login.
	 *
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Response} ctx.response
	 * @param {Function} next
	 *
	 * @return void
	 */
	async handle( { request, response }, next ) {

		Exception.handle( 'InvalidSessionException', this.handleInvalidSessionException );

		await next();
	}

	/**
	 * To redirect unauthorized user to login page in he try to access restricted page.
	 *
	 * @param {object} error
	 * @param {object} ctx
	 * @param {Request} ctx.request
	 * @param {Response} ctx.response
	 * @param {Session} ctx.session
	 *
	 * @return {Promise<*>}
	 */
	async handleInvalidSessionException( error, { request, response, session } ) {

		const destination = request.url();
		session.put( 'original-destination', destination );

		// redirect to login
		return response.redirect( '/login', 302 );
	}
}

module.exports = RedirectUnauthorizedUser;
