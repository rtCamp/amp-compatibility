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


/**
 * Generate bash script for theme testing.
 *
 * Output & update all themes: `wp amp-test-themes`
 * Output & update one theme:  `wp amp-test-themes --theme=99fy`
 */
if ( class_exists( 'WP_CLI' ) ) :
\WP_CLI::add_command( 'amp-test-themes', function ( $args = [], $assoc_args = [] ) {

	$theme = filter_var( \WP_CLI\Utils\get_flag_value( $assoc_args, 'theme' ), FILTER_SANITIZE_STRING );

	if ( empty( $theme ) ) {
		$path = dirname( ABSPATH ) . '/data/wordpress.org/themes/*';
	}else {
		$path = dirname( ABSPATH ) . '/data/wordpress.org/themes/' . $theme;
	}

	foreach ( glob( $path ) as $f ) :
		$theme_slug = basename( $f );
		$theme = json_decode( file_get_contents( $f ) );
		?>
wp db import ../data/wordpress.org/themes.sql
wp theme install --activate <?php echo $theme_slug . PHP_EOL
		/*
		# Ensure the parent theme is installed (sometimes auto-installed other times not?)
		parent_theme=$( wp get-parent-theme "<?php echo $theme->slug ?>" )
		if [ ! -z "$parent_theme" ]; then
			wp --skip-plugins --skip-themes theme install "$parent_theme" || continue
		fi
		*/
		?>
wp amp validation reset --yes
wp amp validation run --force --limit=3
wp amp-send-data
git reset --hard

<?php
	endforeach;




} );
endif;