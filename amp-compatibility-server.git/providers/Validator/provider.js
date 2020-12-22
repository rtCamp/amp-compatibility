'use strict';

const { ServiceProvider } = require( '@adonisjs/fold' );

class ValidatorProvider extends ServiceProvider {

	/**
	 * Register namespaces to the IoC container
	 *
	 * @method register
	 *
	 * @return {void}
	 */
	register() {
		const ValidatorExtended = require( '.' );
		new ValidatorExtended();
	}

}

module.exports = ValidatorProvider;
