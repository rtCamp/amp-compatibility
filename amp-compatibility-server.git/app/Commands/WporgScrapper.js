'use strict';

const { Command } = require( '@adonisjs/ace' );

class WporgScrapper extends Command {

	/**
	 * Command Name is used to run the command
	 */
	static get signature() {
		return 'wporg:scrapper';
	}

	/**
	 * Command Name is displayed in the "help" output
	 */
	static get description() {
		return 'List of command to scrap wordpress.org themes and plugins data.';
	}

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	async handle( args, options ) {
		this.info( 'WordPress.org Scrapper' );
	}
}

module.exports = WporgScrapper;
