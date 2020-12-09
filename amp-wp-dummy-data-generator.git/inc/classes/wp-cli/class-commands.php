<?php
/**
 * Generate content.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\WP_CLI;

use WP_CLI_Test_Data\Inc\Generator\Blocks;
use WP_CLI_Test_Data\Inc\Generator\PostTypes;
use WP_CLI_Test_Data\Inc\Generator\ShortCodes;
use WP_CLI_Test_Data\Inc\Generator\Taxonomies;
use WP_CLI_Test_Data\Inc\Generator\Templates;
use WP_CLI_Test_Data\Inc\Generator\Widgets;

/**
 * CLI commands for AMP WP Compatibility Suite.
 */
class Commands extends Base {

	/**
	 * List of generator classes.
	 *
	 * @var array
	 */
	protected $generators = [];

	/**
	 * List of config class for active plugins.
	 *
	 * @var array
	 */
	protected $plugin_configs = [];

	/**
	 * Construct method.
	 */
	public function __construct() {

		$this->generators = [
			// Navigation, Will be imported from default WP data.
			new Widgets(),
			new ShortCodes(),
			new Taxonomies(),
			new PostTypes(),
			new Templates(),
			// Metaboxes.
			new Blocks(),
		];

		$active_plugins = self::get_active_plugins();
		$active_plugins = array_keys( $active_plugins );

		foreach ( $active_plugins as $active_plugin ) {
			$class_name = str_replace( [ '_', '-' ], ' ', $active_plugin );
			$class_name = ucfirst( $class_name );
			$class_name = str_replace( ' ', '_', $class_name );

			$full_class_name = '\WP_CLI_Test_Data\Inc\Plugin_Configs\\' . $class_name;

			if ( class_exists( $full_class_name ) ) {
				$this->plugin_configs[] = new $full_class_name();
			}

		}

	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp wp-cli-test-data generate
	 *
	 * @subcommand generate
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function generate( $args, $assoc_args ) {

		$this->extract_args( $assoc_args );

		foreach ( $this->generators as $generator ) {
			$generator->generate();
		}

	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp wp-cli-test-data get_import_files
	 *
	 * @subcommand get_import_files
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function get_import_files( $args, $assoc_args ) {

		$this->extract_args( $assoc_args );

		$import_files = [
			/**
			 * WordPress default sample data.
			 */
			'themeunittestdata.wordpress.xml' => 'https://raw.githubusercontent.com/WPTRT/theme-unit-test/master/themeunittestdata.wordpress.xml',
		];

		if ( self::is_gutenberg_active() ) {
			$import_files['gutenberg-test-data.xml'] = 'https://raw.githubusercontent.com/Automattic/theme-tools/master/gutenberg-test-data/gutenberg-test-data.xml';
		}

		foreach ( $this->plugin_configs as $plugin_config ) {

			$plugin_files = $plugin_config->get_import_files();

			if ( ! empty( $plugin_files ) && is_array( $plugin_files ) ) {
				$import_files = array_merge( $import_files, $plugin_files );
			}

		}

		$import_files = array_keys( $import_files );
		$import_files = array_unique( $import_files );

		if ( ! empty( $import_files ) ) {
			$this->write_log( implode( '|', $import_files ) );
		}

	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp wp-cli-test-data get_plugin_commands
	 *
	 * @subcommand get_plugin_commands
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function get_plugin_commands( $args, $assoc_args ) {

		$this->extract_args( $assoc_args );

		$commands = [];

		foreach ( $this->plugin_configs as $plugin_config ) {

			$plugin_commands = $plugin_config->get_cli_commands();
			if ( ! empty( $plugin_commands ) && is_array( $plugin_commands ) ) {
				$commands = array_merge( $commands, $plugin_commands );
			}
		}

		$commands = array_unique( $commands );

		if ( ! empty( $commands ) ) {
			$this->write_log( implode( '|', $commands ) );
		}

	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp wp-cli-test-data plugin_after_setup
	 *
	 * @subcommand plugin_after_setup
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function plugin_after_setup( $args, $assoc_args ) {

		foreach ( $this->plugin_configs as $plugin_config ) {

			$plugin_config->after_setup();

		}

	}

	/**
	 * To get list of active plugins in current WordPress installation.
	 * Key of array contains plugin slug and value contain manifest file plugin.
	 *
	 * @return array List of active plugins.
	 */
	public static function get_active_plugins() {

		$plugins = get_plugins();

		$plugin_files   = array_keys( $plugins );
		$active_plugins = [];

		foreach ( $plugin_files as $plugin_file ) {
			$slug = explode( '/', $plugin_file );
			$slug = strtolower( $slug[0] );
			$slug = str_replace( '.php', '', $slug );
			$slug = trim( $slug );

			if ( is_plugin_active( $plugin_file ) ) {
				$active_plugins[ $slug ] = $plugin_file;
			}

		}

		return $active_plugins;
	}

	/**
	 * Check if Gutenberg is active.
	 * Must be used not earlier than plugins_loaded action fired.
	 *
	 * @return bool True if gutenberg is active, Otherwise False.
	 */
	private static function is_gutenberg_active() {

		$gutenberg    = false;
		$block_editor = false;

		if ( has_filter( 'replace_editor', 'gutenberg_init' ) ) {
			// Gutenberg is installed and activated.
			$gutenberg = true;
		}

		if ( version_compare( $GLOBALS['wp_version'], '5.0-beta', '>' ) ) {
			// Block editor.
			$block_editor = true;
		}

		if ( ! $gutenberg && ! $block_editor ) {
			return false;
		}

		include_once ABSPATH . 'wp-admin/includes/plugin.php';

		if ( ! is_plugin_active( 'classic-editor/classic-editor.php' ) ) {
			return true;
		}

		$use_block_editor = ( 'no-replace' === get_option( 'classic-editor-replace' ) );

		return $use_block_editor;
	}

}
