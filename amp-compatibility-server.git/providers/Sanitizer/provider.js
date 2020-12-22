'use strict';

const { ServiceProvider } = require( '@adonisjs/fold' );

class SanitizerProvider extends ServiceProvider {

	/**
	 * Register namespaces to the IoC container
	 *
	 * @method register
	 *
	 * @return {void}
	 */
	register() {
		const Sanitizer = require( '.' );
		new Sanitizer();
	}

}

module.exports = SanitizerProvider;
