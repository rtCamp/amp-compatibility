'use strict';

const { Command } = require( '@adonisjs/ace' );
const User = use( 'App/Models/User' );
const { exit } = require( 'process' );

class UserRemove extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `user:remove
		 { --email=@value : Email address of user. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To remove user for application';
	}

	/**
	 * To handle functionality of command.
	 * To remove user for dashboard.
	 *
	 * @param {Object} args Argument passed in command.
	 * @param {Object} options Options passed in command.
	 *
	 * @return {Promise<void>}
	 */
	async handle( args, options ) {

		try {
			const user = await User.findBy( 'email', options.email );
			await user.delete();
			this.success( 'User removed' );
		} catch ( error ) {
			this.error( 'Fail to remove user.' );
		}

		exit( 1 );

	}
}

module.exports = UserRemove;
