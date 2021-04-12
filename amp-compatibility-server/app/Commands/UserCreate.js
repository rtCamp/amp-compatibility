'use strict';

const { Command } = require( '@adonisjs/ace' );
const User = use( 'App/Models/User' );
const Utility = use( 'App/Helpers/Utility' );
const { exit } = require( 'process' );

class UserCreate extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `user:create
		 { --email=@value : Email address of user. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To create user for application';
	}

	/**
	 * To handle functionality of command.
	 * To create user for dashboard.
	 *
	 * @param {Object} args Argument passed in command.
	 * @param {Object} options Options passed in command.
	 *
	 * @return {Promise<void>}
	 */
	async handle( args, options ) {

		const email = options.email;
		const username = email.substring( 0, email.indexOf( '@' ) );

		const userData = {
			username: username,
			email: email,
			password: `${ username }-${ Utility.random( 10000, 10000 ) }`,
		};

		try {
			await User.create( userData );
			this.success( 'User created.' );
		} catch ( error ) {
			this.error( 'Fail to create user.' );
		}

		exit( 1 );

	}
}

module.exports = UserCreate;
