'use strict';

const { Command } = require( '@adonisjs/ace' );
const User = use( 'App/Models/User' );
const { exit } = require( 'process' );

class UserCreate extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return `user:create
		 { --username=@value : Username of user. }
		 { --email=@value : Email address of user. }
		 { --password=@value : Password for user. }`
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'To create user for application'
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @param {Object} args Arguments
	 * @param {Object} flags Flags
	 *
	 * @returns {Promise<void>}
	 */
	async handle( args, flags ) {

		const userData = {
			username: flags.username,
			email: flags.email,
			password: flags.password,
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
