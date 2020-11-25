<?php
/**
 * Plugin Name: AMP WP Compatibility Suite -- Prototype
 * Description: Plugin for testing AMP compatibility of WordPress plugins and themes.
 * Version:     1.0.0
 * Author:      rtCamp, Inc
 * License:     Apache License 2.0
 * License URI: https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain: amp-wp-compatibility-suite-prototype
 */

define( 'AMP_WP_COMP_SUIT_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'AMP_WP_COMP_SUIT_URL', untrailingslashit( plugin_dir_url( __FILE__ ) ) );

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant
require_once AMP_WP_COMP_SUIT_PATH . '/inc/helpers/autoloader.php';
require_once AMP_WP_COMP_SUIT_PATH . '/amp-send-data.php';
// phpcs:enable WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant

/**
 * To load plugin manifest class.
 *
 * @return void
 */
function amp_wp_comp_suit_plugin_loader() {

	\AMP_WP_Compatibility_Suite\Inc\Plugin::get_instance();
}

amp_wp_comp_suit_plugin_loader();
