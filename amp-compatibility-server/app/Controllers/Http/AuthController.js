'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/auth/src/Auth')} Auth */
/** @typedef {import('@adonisjs/Session')} Session */

const { validateAll } = use( 'Validator' );
const User = use( 'App/Models/User' );

class AuthController {

	/**
	 * To redirect to Google login.
	 *
	 * @param {object} ctx
	 * @param {Object} ctx.ally
	 * @param {Auth} ctx.auth
	 * @param {Session} ctx.session
	 * @param {Response} ctx.response
	 *
	 * @return {Promise<void>}
	 */
	async authenticateGoogle( { auth, session, response, ally } ) {

		try {

			await auth.check();

			const destination = session.get( 'original-destination' ) || '/admin';

			response.redirect( destination, false, 302 );

		} catch ( error ) {

			await ally.driver( 'google' ).redirect();
		}

	}

	/**
	 * Callback function when user is authorized from google.
	 *
	 * @param {object} ctx
	 * @param {View} ctx.view
	 * @param {Object} ctx.ally
	 * @param {Auth} ctx.auth
	 * @param {Session} ctx.session
	 * @param {Response} ctx.response
	 *
	 * @return {Promise<void>}
	 */
	async authenticatedGoogle( { view, ally, auth, session, response } ) {

		/**
		 * If User is already login then redirect to admin dahboard.
		 */
		if ( null !== auth.user ) {

			const destination = session.get( 'original-destination' ) || '/admin';

			response.redirect( destination, false, 302 );

			return;
		}

		try {

			let googleUser = await ally.driver( 'google' ).getUser();

			const user = await User.findBy( 'email', googleUser.getEmail() );

			await auth.login( user );

			const destination = session.get( 'original-destination' ) || '/admin';

			response.redirect( destination, false, 302 );
		} catch ( error ) {

			return response.redirect( '/', false, 302 );
		}

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

		await auth.logout();
		response.redirect( '/', false, 302 );
	}

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

			response.redirect( destination, false, 302 );

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

		response.redirect( destination, false, 302 );

	}

}

module.exports = AuthController;
