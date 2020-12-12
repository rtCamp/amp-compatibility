import {BaseCommand} from '@adonisjs/ace'

export default class WporgScrapper extends BaseCommand {

	/**
	 * Command Name is used to run the command
	 */
	public static commandName = 'wporg:scrapper';

	/**
	 * Command Name is displayed in the "help" output
	 */
	public static description = 'List of command to scrap wordpress.org themes and plugins data.';

	/**
	 * Function to perform CLI task.
	 *
	 * @return void
	 */
	public async run() {
		this.logger.info('WordPress.org Scrapper');
	}

}
