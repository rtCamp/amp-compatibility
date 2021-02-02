'use strict';

const { Command } = require( '@adonisjs/ace' );

// Controllers
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

// Helpers
const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );

// Utilities
const { exit } = require( 'process' );

class AdhocSyntheticDataAdd extends Command {

	/**
	 * Command signature.
	 */
	static get signature() {
		return `adhoc-synthetic-data:add
			 { --theme=@value : Theme to test synthetic data for/against eg. treville:latest. }
			 { --plugins=@value : Plugin(s) to be used in synthetic data test. Excepts comma seprated values of plugin_name:version. }
			 { --email=@value : Email id to which mail will be sent with updates and data. }`;
	}

	/**
	 * Description of the command.
	 *
	 * @return {string} command description.
	 */
	static get description() {
		return 'To add request of generating synthetic data for specified theme and plugin(s).';
	}

	/**
	 * Get synthetic data queue.
	 *
	 * @returns {*}
	 */
	get queue() {
		return AdhocSyntheticDataQueueController.queue;
	}

	/**
	 * To prepare options passed to the command.
	 *
	 * @param {Object} options Options passed to the command.
	 *
	 * @return void
	 */
	parseOptions( options ) {

		this.options = {
			plugins: options.plugins || '',
			theme: options.theme || '',
			email: options.email || '',
		};

		this.options.plugins = this.options.plugins.toString().toLowerCase().trim();
		this.options.theme = this.options.theme.toString().toLowerCase().trim();
		this.options.email = this.options.email.toString().toLowerCase().trim();
		this.options.domain = 'adhoc-synthetic-data-' + Utility.getCurrentDateTime().replace( / |:/g, '-' );

	}

	/**
	 * To handle functionality of command.
	 * To add request in adhoc-synthetic queue.
	 *
	 * @param {Object} args Argument passed in command.
	 * @param {Object} options Options passed in command.
	 *
	 * @return {Promise<void>}
	 */
	async handle( args, options ) {

		this.parseOptions( options );

		const job = this.options;

		Logger.info( 'Site: %s.local will be created to process the synthetic data.', job.domain );

		await AdhocSyntheticDataQueueController.createJob( job );

		exit( 1 );
	}
}

module.exports = AdhocSyntheticDataAdd;
