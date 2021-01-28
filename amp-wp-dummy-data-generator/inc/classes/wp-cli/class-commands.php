<?php
/**
 * Generate content.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\WP_CLI;

use AMP_WP_Dummy_Data_Generator\Inc\Generator\Blocks;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\PostTypes;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\ShortCodes;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\Taxonomies;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\Templates;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\Widgets;

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
	 * List of config class for active themes.
	 *
	 * @var array
	 */
	protected $theme_configs = [];

	/**
	 * Construct method.
	 */
	public function __construct() {

		$this->generators = [
			new Widgets(),
			new ShortCodes(),
			new Taxonomies(),
			new PostTypes(),
			new Templates(),
			new Blocks(),
		];

		$this->setup();

	}

	/**
	 * To setup class variables.
	 *
	 */
	private function setup() {

		/**
		 * Plugins
		 */
		$active_plugins = self::get_active_plugins();
		$active_plugins = array_keys( $active_plugins );

		foreach ( $active_plugins as $active_plugin ) {

			$full_class_name = '\AMP_WP_Dummy_Data_Generator\Inc\Plugin_Configs\\' . $this->get_class_name( $active_plugin );

			if ( class_exists( $full_class_name ) ) {
				$this->plugin_configs[] = new $full_class_name();
			}

		}

		/**
		 * Themes
		 */
		$active_theme_object = wp_get_theme();

		$theme_classes   = [];
		$theme_classes[] = '\AMP_WP_Dummy_Data_Generator\Inc\Theme_Configs\\' . $this->get_class_name( $active_theme_object->get_stylesheet() );

		if ( ! empty( $active_theme_object->parent() ) && ! is_a( $active_theme_object->parent(), 'WP_Theme' ) ) {
			$parent_theme    = $active_theme_object->parent();
			$theme_classes[] = '\AMP_WP_Dummy_Data_Generator\Inc\Theme_Configs\\' . $this->get_class_name( $parent_theme->get_stylesheet() );
		}

		foreach ( $theme_classes as $theme_class ) {

			if ( class_exists( $theme_class ) ) {
				$this->theme_configs[] = new $theme_class();
			}

		}
	}

	/**
	 * To convert theme/plugin slug into class name.
	 *
	 * @param string $slug Slug of theme/plugin.
	 *
	 * @return string Class name based on theme/plugin.
	 */
	private function get_class_name( $slug ) {

		$class_name = '';

		if ( ! empty( $slug ) ) {
			$class_name = str_replace( [ '_', '-' ], ' ', $slug );
			$class_name = ucfirst( $class_name );
			$class_name = str_replace( ' ', '_', $class_name );
		}

		return $class_name;
	}

	/**
	 * To get list of command that need to execute before or after setup.
	 *
	 * ## OPTIONS
	 * [--exclude-default]
	 * : Whether or not we need to import default test content or not.
	 * ---
	 * default: false
	 * options:
	 *  - true
	 *  - false
	 *
	 * [--type=<type>]
	 * : Which command need to get. Is it commands for before importing or after importing.
	 * ---
	 * default: before
	 * options:
	 *  - before
	 *  - after
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-dummy-data-generator get_commands
	 *
	 * @subcommand get_commands
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function get_commands( $args, $assoc_args ) {

		$this->extract_args( $assoc_args );

		$type = ( ! empty( $assoc_args['type'] ) ) ? strtolower( trim( $assoc_args['type'] ) ) : 'before';

		$commands = [];

		foreach ( $this->theme_configs as $theme_config ) {

			if ( 'before' === $type ) {
				$theme_commands = $theme_config->get_before_cli_commands();
			} else {
				$theme_commands = $theme_config->get_after_cli_commands();
			}

			if ( ! empty( $theme_commands ) && is_array( $theme_commands ) ) {
				$commands = array_merge( $commands, $theme_commands );
			}

		}

		foreach ( $this->plugin_configs as $plugin_config ) {

			if ( 'before' === $type ) {
				$plugin_commands = $plugin_config->get_before_cli_commands();
			} else {
				$plugin_commands = $plugin_config->get_after_cli_commands();
			}

			if ( ! empty( $plugin_commands ) && is_array( $plugin_commands ) ) {
				$commands = array_merge( $commands, $plugin_commands );
			}

		}

		$commands = array_unique( $commands );
		$commands = array_filter( $commands );

		if ( ! empty( $commands ) ) {
			$this->write_log( implode( '|', $commands ) );
		}

	}

	/**
	 * To run custom code before or after importing data.
	 *
	 * ## OPTIONS
	 * [--exclude-default]
	 * : Whether or not we need to import default test content or not.
	 * ---
	 * default: false
	 * options:
	 *  - true
	 *  - false
	 *
	 * [--type=<type>]
	 * : Which command need to get. Is it commands for before importing or after importing.
	 * ---
	 * default: before
	 * options:
	 *  - before
	 *  - after
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-dummy-data-generator run_custom
	 *
	 * @subcommand run_custom
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function run_custom( $args, $assoc_args ) {

		$this->extract_args( $assoc_args );

		$type = ( ! empty( $assoc_args['type'] ) ) ? strtolower( trim( $assoc_args['type'] ) ) : 'before';

		foreach ( $this->theme_configs as $theme_config ) {
			if ( 'before' === $type ) {
				$theme_config->before_importing();
			} else {
				$theme_config->after_importing();
			}
		}

		foreach ( $this->plugin_configs as $plugin_config ) {
			if ( 'before' === $type ) {
				$plugin_config->before_importing();
			} else {
				$plugin_config->after_importing();
			}
		}

	}

	/**
	 * To generate template pages.
	 *
	 * ## OPTIONS
	 * [--exclude-default]
	 * : Whether or not we need to import default test content or not.
	 * ---
	 * default: false
	 * options:
	 *  - true
	 *  - false
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-dummy-data-generator get_import_files
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

		$import_files = [];

		if ( empty( $this->exclude_default ) ) {
			/**
			 * WordPress default sample data.
			 */
			$import_files['themeunittestdata.wordpress.xml'] = 'https://raw.githubusercontent.com/WPTRT/theme-unit-test/master/themeunittestdata.wordpress.xml';

			if ( self::is_gutenberg_active() ) {
				$import_files['gutenberg-test-data.xml'] = 'https://raw.githubusercontent.com/Automattic/theme-tools/master/gutenberg-test-data/gutenberg-test-data.xml';
			}
		}

		foreach ( $this->theme_configs as $theme_config ) {

			$files = $theme_config->get_import_files();

			if ( empty( $theme_config->name ) || empty( $files ) || ! is_array( $files ) ) {
				continue;
			}

			$prefix = "themes/$theme_config->name";

			foreach ( $files as $filename => $fileUrl ) {
				$import_files["$prefix/$filename"] = $fileUrl;
			}

		}

		foreach ( $this->plugin_configs as $plugin_config ) {

			$files = $plugin_config->get_import_files();

			if ( empty( $plugin_config->name ) || empty( $files ) || ! is_array( $files ) ) {
				continue;
			}

			$prefix = "plugins/$plugin_config->name";

			foreach ( $files as $filename => $fileUrl ) {
				$import_files["$prefix/$filename"] = $fileUrl;
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
	 * ## OPTIONS
	 * [--exclude-default]
	 * : Whether or not we need to import default test content or not.
	 * ---
	 * default: false
	 * options:
	 *  - true
	 *  - false
	 *
	 * ## EXAMPLES
	 *
	 *      wp amp-wp-dummy-data-generator generate
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
