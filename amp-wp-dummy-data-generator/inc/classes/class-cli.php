<?php
/**
 * To register WP-CLI commands.
 *
 * @package wp-dam
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

use AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class CLI
 */
class CLI {

	use Singleton;

	/**
	 * Construct method.
	 */
	protected function __construct() {

		if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
			return;
		}

		\WP_CLI::add_command( 'amp-wp-dummy-data-generator', \AMP_WP_Dummy_Data_Generator\Inc\CLI\Commands::class );

	}
}
