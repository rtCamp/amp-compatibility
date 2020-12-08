<?php
/**
 * To register WP-CLI commands.
 *
 * @package wp-dam
 */

namespace WP_CLI_Test_Data\Inc;

use WP_CLI_Test_Data\Inc\Traits\Singleton;

/**
 * Class WP_CLI
 */
class WP_CLI {

	use Singleton;

	/**
	 * Construct method.
	 */
	protected function __construct() {

		if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
			return;
		}

		\WP_CLI::add_command( 'amp-wp-compatibility', '\WP_CLI_Test_Data\Inc\WP_CLI\Commands' );

	}

}
