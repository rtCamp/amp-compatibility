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

define( 'AMP_WP_DUMMY_DATA_GENERATOR_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) ); // @todo Why not just __DIR__?
define( 'AMP_WP_DUMMY_DATA_GENERATOR_URL', untrailingslashit( plugin_dir_url( __FILE__ ) ) );

// TODO: Would be great to document what this does. I'm curious, why is it actually needed?
// Wouldn't one piece of dummy content per different template be sufficient?
if ( ! defined( 'AMP_WP_DUMMY_DATA_GENERATOR_LIMIT' ) ) {
	define( 'AMP_WP_DUMMY_DATA_GENERATOR_LIMIT', 1 );
}

require_once __DIR__ . '/inc/helpers/autoloader.php';
require_once __DIR__ . '/amp-send-data.php';

/**
 * To load plugin manifest class.
 *
 * @return void
 */
function amp_amp_wp_dummy_data_generator_plugin_loader() {

	\AMP_WP_Dummy_Data_Generator\Inc\Plugin::get_instance();
}

amp_amp_wp_dummy_data_generator_plugin_loader();
