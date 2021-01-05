<?php
/**
 * Plugin Name: AMP WP Dummy data generator
 * Description: Plugin for generating test data for WordPress.
 * Version:     1.0.0
 * Author:      rtCamp, Inc
 * License:     Apache License 2.0
 * License URI: https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain: amp-wp-dummy-data-generator
 *
 * @package amp-wp-dummy-data-generator
 */

define( 'AMP_WP_DUMMY_DATA_GENERATOR_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'AMP_WP_DUMMY_DATA_GENERATOR_URL', untrailingslashit( plugin_dir_url( __FILE__ ) ) );

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant
require_once AMP_WP_DUMMY_DATA_GENERATOR_PATH . '/inc/helpers/autoloader.php';
require_once AMP_WP_DUMMY_DATA_GENERATOR_PATH . '/amp-send-data.php';
// phpcs:enable WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant

/**
 * To load plugin manifest class.
 *
 * @return void
 */
function amp_amp_wp_dummy_data_generator_plugin_loader() {

	\AMP_WP_Dummy_Data_Generator\Inc\Plugin::get_instance();
}

amp_amp_wp_dummy_data_generator_plugin_loader();
