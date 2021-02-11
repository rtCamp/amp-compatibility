'use strict';

const { ServiceProvider } = require( '@adonisjs/fold' );

class Provider extends ServiceProvider {
	/**
	 * Register namespaces to the IoC container
	 *
	 * @method register
	 *
	 * @return {void}
	 */
	register() {
		this.app.singleton( 'Storage', () => {
			return new ( require( '.' ) )();
		} );
	}

}

module.exports = Provider;
