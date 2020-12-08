<?php
/**
 * Plugin Name: WP CLI Test Data
 * Description: Plugin for generating test data for WordPress.
 * Version:     1.0.0
 * Author:      rtCamp, Inc
 * License:     Apache License 2.0
 * License URI: https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain: wp-cli-test-data
 */

define( 'WP_CLI_TEST_DATA_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'WP_CLI_TEST_DATA_URL', untrailingslashit( plugin_dir_url( __FILE__ ) ) );

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant
require_once WP_CLI_TEST_DATA_PATH . '/inc/helpers/autoloader.php';
require_once WP_CLI_TEST_DATA_PATH . '/amp-send-data.php';
// phpcs:enable WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant

/**
 * To load plugin manifest class.
 *
 * @return void
 */
function amp_wp_comp_suit_plugin_loader() {

	\WP_CLI_Test_Data\Inc\Plugin::get_instance();
}

amp_wp_comp_suit_plugin_loader();
