'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/auth/src/Auth')} Auth */
/** @typedef {import('@adonisjs/Session')} Session */

const { validateAll } = use( 'Validator' );

class AuthController {

	/**
	 * To render login form.
	 *
	 * @param {object} ctx
	 * @param {Auth} ctx.auth
	 * @param {View} ctx.view
	 * @param {Response} ctx.response
	 * @param {Session} ctx.session
	 *
	 * @return {Promise<*>}
	 */
	async renderLogin( { auth, view, response, session } ) {

		try {
			await auth.check();

			const destination = session.get( 'original-destination' ) || '/admin';

			response.redirect( destination, 302 );
			response.redirect( '/admin', 302 );

		} catch ( error ) {
			// Exception handling.
		}

		return view.render( 'login' );

	}

	/**
	 * To login user.
	 *
	 * @param {object} ctx
	 * @param {Auth} ctx.auth
	 * @param {Request} ctx.request
	 * @param {Response} ctx.response
	 * @param {Session} ctx.session
	 * @param {View} ctx.view
	 *
	 * @return {Promise<*>}
	 */
	async login( { auth, request, response, session, view } ) {

		const rules = {
			email: 'required|email',
			password: 'required',
		};

		const messages = {
			'email.required': 'Please provide email to login.',
			'email.email': 'Please provide valid email to login.',
			'password.required': 'Please provide password to login.',
		};

		const validation = await validateAll( request.post(), rules, messages );

		if ( validation.fails() ) {
			session.withErrors( validation.messages() ).flashAll();
			return view.render( 'login' );
		}

		const email = request.input( 'email' );
		const password = request.input( 'password' );
		const rememberUser = ( !! request.input( 'remember_me' ) );

		await auth.attempt( email, password, rememberUser );

		const destination = session.get( 'original-destination' ) || '/admin';

		response.redirect( destination, 302 );

	}

	/**
	 * To logout user.
	 *
	 * @param {object} ctx
	 * @param {Auth} ctx.auth
	 * @param {Response} ctx.response
	 *
	 * @return {Promise<void>}
	 */
	async logout( { auth, response } ) {

		await auth.logout()
		response.redirect( '/login', 302 );
	}

}

module.exports = AuthController
