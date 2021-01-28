const { ServiceProvider } = require( '@adonisjs/fold' );

class QueueProvider extends ServiceProvider {
	/**
	 * Register namespaces to the IoC container
	 *
	 * @method register
	 *
	 * @return {void}
	 */
	register() {
		this.app.singleton( 'Bee/Queue', () => {
			const Config = this.app.use( 'Adonis/Src/Config' );
			return new ( require( '.' ) )( Config.get( 'queue' ) );
		} );
	}
}

module.exports = QueueProvider;
