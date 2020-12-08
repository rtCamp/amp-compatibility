<?php
/**
 * Generate content.
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

	protected $generators = [];
	protected $plugin_configs = [];

	public function __construct() {

		$this->generators = [
			// Navigation, Will be imported from default WP data.
			new Widgets(),
			new ShortCodes(),
			new Taxonomies(),
			new PostTypes(),
			new Templates(),
			// Metaboxes,
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
				$this->plugin_configs[] = new $full_class_name;
			}

		}

	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-compatibility generate
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
	 *      wp amp-wp-compatibility get_import_files
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

		$response = [
			/**
			 * WP Sample data
			 * https://raw.githubusercontent.com/WPTRT/theme-unit-test/master/themeunittestdata.wordpress.xml
			 */
			'themeunittestdata.wordpress.xml',
		];

		foreach ( $this->plugin_configs as $plugin_config ) {

			if ( ! empty( $plugin_config->get_import_filename() ) ) {
				$response[] = $plugin_config->get_import_filename();
			}

		}

		$this->write_log( implode( '|', $response ) );

	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-compatibility get_plugin_commands
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

		$this->write_log( implode( '|', $commands ) );
	}

	/**
	 * To generate template pages.
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-compatibility plugin_after_setup
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

}