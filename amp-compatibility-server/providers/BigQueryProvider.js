'use strict';

const { ServiceProvider } = require( '@adonisjs/fold' );

class BigQueryProvider extends ServiceProvider {

	/**
	 * Register namespaces to the IoC container
	 *
	 * @method register
	 *
	 * @return {void}
	 */
	register() {
		this.app.singleton( 'App/BigQuery', () => {
			const Config = this.app.use( 'Adonis/Src/Config' );
			const BigQuery = require( './BigQuery' );
			return new BigQuery( Config.get( 'bigquery' ) );
		} );
	}

}

module.exports = BigQueryProvider;
