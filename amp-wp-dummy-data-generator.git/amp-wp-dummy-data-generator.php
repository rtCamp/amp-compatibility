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

// Remainder of file is CLI only
if ( ! class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 * Generate bash script for theme testing.
 *
 * Output & update all themes: `wp amp-test-themes`
 * Output & update one theme:  `wp amp-test-themes --theme=99fy`
 */
\WP_CLI::add_command( 'amp-test-themes', function ( $args = [], $assoc_args = [] ) {

	$theme = filter_var( \WP_CLI\Utils\get_flag_value( $assoc_args, 'theme' ), FILTER_SANITIZE_STRING );

	if ( empty( $theme ) ) {
		$path = dirname( ABSPATH ) . '/data/themes/*';
	}else {
		$path = dirname( ABSPATH ) . '/data/themes/' . $theme;
	}

	foreach ( glob( $path ) as $f ) :
		$theme_slug = basename( $f );
		$theme = json_decode( file_get_contents( $f . '/' . $theme_slug . '.json' ) );
		?>
wp db import ../data/themes.sql <?php
		echo apply_filters( 'amp-test/bash-before-theme-install', '', $theme );
?>
wp theme install --activate <?php echo $theme_slug . PHP_EOL;
		/*
		# Ensure the parent theme is installed (sometimes auto-installed other times not?)
		parent_theme=$( wp get-parent-theme "<?php echo $theme->slug ?>" )
		if [ ! -z "$parent_theme" ]; then
			wp --skip-plugins --skip-themes theme install "$parent_theme" || continue
		fi
		*/

		echo apply_filters( 'amp-test/bash-after-theme-install', '', $theme );
		?>
wp option update --json amp-options '{"theme_support":"standard"}'
wp amp validation reset --yes
wp amp validation run --force --limit=3
wp amp-send-data
git reset --hard

<?php
	endforeach;
} );
\WP_CLI::add_command( 'amp-test-plugins', function ( $args = [], $assoc_args = [] ) {

	$plugin = filter_var( \WP_CLI\Utils\get_flag_value( $assoc_args, 'plugin' ), FILTER_SANITIZE_STRING );

	if ( empty( $plugin ) ) {
		$path = dirname( ABSPATH ) . '/data/plugins/*';
	}else {
		$path = dirname( ABSPATH ) . '/data/plugins/' . $plugin;
	}

	foreach ( glob( $path ) as $f ) :
		$plugin_slug = basename( $f );
		// Returns false for non-wp.org plugins
		$plugin = (array) @ json_decode( file_get_contents( $f . '/' . $plugin_slug . '.json' ) );
		// For non-wp.org plugins
		$plugin = array_merge( [ 'slug' => $plugin_slug ], $plugin );
		?>
wp db import ../data/plugins.sql
<?php
		echo apply_filters( 'amp-test/bash-before-plugin-install', '', $plugin );
?>
wp plugin install --activate <?php echo $plugin_slug . PHP_EOL;
		echo apply_filters( 'amp-test/bash-after-plugin-install', '', $plugin );
?>
wp option update --json amp-options '{"theme_support":"standard"}'
wp amp validation reset --yes
wp amp validation run --force --limit=3
wp amp-send-data
git reset --hard

<?php
	endforeach;
} );

/**
 * Check for mentions of plugins to install.
 * 
 * @param  string Bash commands.
 * @param  array  Plugin info.
 * @return string Bash commands.
 */
add_filter( 'amp-test/bash-before-plugin-install', function( $bash_commands, $plugin ){
	$info = strtolower( serialize( $plugin ) );

	if ( 
		false !== strpos( $info, 'woocommerce' ) 
		&& 'woocommerce' !== $plugin[ 'slug' ]
	) {
		$bash_commands .= 'wp plugin install --activate woocommerce' . PHP_EOL;
		$bash_commands .= apply_filters( 'amp-test/bash-load-plugin-sql', 'woocommerce' );
	}

	if ( 
		( false !== strpos( $info, 'contact-form-7' ) 
		|| false !== strpos( $info, 'contact form 7' ) )
		&& 'contact-form-7' !== $plugin[ 'slug' ] 
	) {
		$bash_commands .= 'wp plugin install --activate contact-form-7' . PHP_EOL;
		$bash_commands .= apply_filters( 'amp-test/bash-load-plugin-sql', 'contact-form-7' );
	}

	if ( 
		( false !== strpos( $info, 'gravity forms' ) 
		|| false !== strpos( $info, 'gravity-forms' )
		|| false !== strpos( $info, 'gravityforms' ) )
		&& 'gravityforms' !== $plugin[ 'slug' ] 
	) {
		// Non wp.org plugins are in the plugins directory, but inactive.
		$bash_commands .= 'wp plugin --activate gravityforms' . PHP_EOL;
		$bash_commands .= apply_filters( 'amp-test/bash-load-plugin-sql', 'gravityforms' );
	}

	return $bash_commands;
}, 10, 2 );

/**
 * Add `amp-test/bash-load-plugin-sql` filter 
 * to `amp-test/bash-before-plugin-install` hook.
 * 
 * @param  string Bash commands.
 * @param  array  Plugin info.
 * @return string Bash commands.
 */
add_filter( 'amp-test/bash-before-plugin-install', function( $bash_commands, $plugin ){
	$bash_commands .= apply_filters( 'amp-test/bash-load-plugin-sql', $plugin[ 'slug' ] );
	return $bash_commands;
}, 20, 2 );

/**
 * Import SQL if it exists in plugin data directory.
 *
 * @param  string Plugin slug.
 * @return string Bash commands.
 */
add_filter( 'amp-test/bash-load-plugin-sql', function( $plugin_slug ){
	$bash_commands = '';
	$path = dirname( ABSPATH ) . '/data/plugins/' . $plugin_slug . '/*.sql';
	foreach( glob( $path ) as $f ) {
		$bash_commands .= 'wp db import "' . $f . '"' . PHP_EOL;
	}
	return $bash_commands;
});