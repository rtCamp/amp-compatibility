'use strict';

const { Command } = require( '@adonisjs/ace' );

// Controllers
const AdhocSyntheticDataQueueController = use( 'App/Controllers/Queue/AdhocSyntheticDataController' );

// Helpers
const Logger = use( 'Logger' );
const Utility = use( 'App/Helpers/Utility' );
const { exit } = require( 'process' );

class SyntheticDataAdd extends Command {
	static get signature() {
		return `synthetic-data:add
			 { --domain=@value : Domain name }
			 { --theme=@value : Theme to test synthetic data for/against eg. treville:latest. }
			 { --plugins=@value : Plugin(s) to be used in synthetic data test. Excepts comma seprated values of plugin_name:version. }
			 { --email=@value : Email id to which mail will be sent with updates and data. }`;
	}

	static get description() {
		return 'Generating synthetic data for specified theme and plugin(s)';
	}

	/**
	 * Get synthetic data queue.
	 *
	 * @returns {*}
	 */
	get queue() {
		return AdhocSyntheticDataQueueController.queue;
	}

	parseOptions( options ) {

		this.options = {
			domain: options.domain || '',
			plugins: options.plugins || '',
			theme: options.theme || '',
			email: options.email || '',
		};

		this.options.domain = this.options.domain.toString().toLowerCase().trim();
		this.options.plugins = this.options.plugins.toString().toLowerCase().trim();
		this.options.theme = this.options.theme.toString().toLowerCase().trim();
		this.options.email = this.options.email.toString().toLowerCase().trim();

		if ( !this.options.domain ) {
			this.options.domain = 'adhoc-synthetic-data-' + Utility.getCurrentDateTime().replace( / |:/g, '-' );
		}

	}

	async handle( args, options ) {

		Logger.level = 'debug';

		this.parseOptions( options );

		const job = this.options;

		Logger.info( 'Site: %s.local will be created to process the synthetic data.', job.domain );

		await AdhocSyntheticDataQueueController.createJob( job );

		exit( 1 );
	}
}

module.exports = SyntheticDataAdd;
