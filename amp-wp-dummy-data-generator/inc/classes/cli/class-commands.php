<?php
/**
 * Generate content.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\CLI;

use AMP_WP_Dummy_Data_Generator\Inc\Generator\Blocks;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\Posts;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\ShortCodes;
use AMP_WP_Dummy_Data_Generator\Inc\Generator\Taxonomies;
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
	 * Construct method.
	 */
	public function __construct() {

		$this->generators = [
			Taxonomies::get_instance(),
			Posts::get_instance(),
			Widgets::get_instance(),
			ShortCodes::get_instance(),
			Blocks::get_instance(),
		];

	}

	/**
	 * To get the data directory/directories of a theme/plugin.
	 *
	 * @param string $slug Slug of theme/plugin.
	 *
	 * @return string[] Data directory paths.
	 */
	private function get_data_dirs( $slug ) {

		$return_locations = [];
		$search_locations =
			[
				'/data/wporg/plugins/',
				'/data/wporg/themes/',
				'/data/commercial/plugins/',
				'/data/commercial/themes/',
			];
		foreach ( $search_locations as $search_location ) {
			$maybe_data_dir = AMP_WP_DUMMY_DATA_GENERATOR_PATH . $search_location . $slug;

			if ( is_dir( $maybe_data_dir ) ) {
				$return_locations[] = $maybe_data_dir;
			}
		}

		return $return_locations;
	}

	/**
	 * To get the data directory/directories of WordPress Core.
	 * Adding this function in case we might want to include some other directories later.
	 *
	 * @return string[] Data directory paths.
	 */
	private function get_data_dir_core() {

		$return_locations[] = AMP_WP_DUMMY_DATA_GENERATOR_PATH . '/data/wporg/core';

		return $return_locations;
	}

	/**
	 * Returns array of import files for a given plugin or theme.
	 *
	 * @param string   $slug         Name of plugin or theme.
	 *
	 * @param string[] $import_files Array of files already listed to be imported.
	 *
	 * @return string[] Import files list.
	 */
	private function get_import_files_single( $slug, $import_files = [] ) {

		$return_import_files = [];

		if ( 'core' === $slug ) {
			$data_dirs = $this->get_data_dir_core();
		} else {
			$data_dirs = $this->get_data_dirs( $slug );
		}

		if ( ! empty( $data_dirs ) ) {
			foreach ( $data_dirs as $data_dir ) {
				$import_files_glob = glob( "{$data_dir}/*.{xml,XML,wxr,WXR}", GLOB_BRACE );
				if ( false !== $import_files ) {
					$return_import_files = array_merge( $return_import_files, $import_files_glob );
				}
			}
		}

		$return_import_files = array_merge( $import_files, $return_import_files );

		return $return_import_files;
	}

	/**
	 * Returns path for pre or post import scripts for a given plugin or theme.
	 *
	 * @param string $slug         Name of plugin or theme.
	 *
	 * @param array  $script_files Array of scripts already listed to be executed.
	 *
	 * @param string $pre_post     Whether the scripts we need are pre or post DB import.
	 *
	 * @return array Array of script files list.
	 */
	private function get_pre_post_script( $slug, $script_files = [], $pre_post = 'pre' ) {
		// @todo This last arg is not documented and it seems misnamed. The method is "get_pre_post_script but then the argument is called "$pre_post" which seems it can be either "pre" or "post", but being a string it could be anything else too? Given the usage, it seems $before_after would be more appropriate. If it shouldn't be anything else, should it not rather be a bool? It can be like wp_add_inline_script() in this way.

		$return_path = [];
		$data_dirs   = $this->get_data_dirs( $slug );

		if ( ! empty( $data_dirs ) ) {
			foreach ( $data_dirs as $data_dir ) {
				$pre_post_glob = glob( "{$data_dir}/{$pre_post}.sh" );
				if ( ! empty( $pre_post_glob ) ) {
					$return_path = $pre_post_glob; // @todo If $data_dirs has more than one item in it, then some scripts will get lost. Only the last one will be returned. Shouldn't this rather be doing `$return_path = array_merge( $return_path, $pre_post_glob )`? I suppose it would be unusually for there to be multiple matches. If that is the case, then it should `break` here.
				}
			}
		}
		$return_path = array_merge( $script_files, $return_path ); // @todo I think it makes more sense to not do the merging inside here. It can be done in the caller.

		return $return_path;
	}

	/**
	 * To get list of scripts that need to execute before or after setup.
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
	 *      wp amp-wp-dummy-data-generator get_scripts
	 *
	 * @subcommand get_scripts
	 *
	 * @param array $args       Store all the positional arguments.
	 * @param array $assoc_args Store all the associative arguments.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	public function get_scripts( $args, $assoc_args ) {

		$this->extract_args( $assoc_args );

		$type = ( ! empty( $assoc_args['type'] ) ) ? strtolower( trim( $assoc_args['type'] ) ) : 'before';

		$filename = 'before' === $type ? 'pre' : 'post';

		$script_files = [];

		/**
		 * Themes
		 */
		$active_theme_object = wp_get_theme();
		$active_theme        = $active_theme_object->get_stylesheet();
		$script_files        = $this->get_pre_post_script( $active_theme, $script_files, $filename );

		if ( ! empty( $active_theme_object->parent() ) && ! is_a( $active_theme_object->parent(), 'WP_Theme' ) ) {
			$parent_theme = $active_theme_object->parent()->get_stylesheet();
			$script_files = $this->get_pre_post_script( $parent_theme, $script_files, $filename ); // @todo Shouldn't this be merged with the child theme $script_files above? Or actually I see the merge is being done _inside_ the function. I think it would be better to just return the array and do the array_merge at this level.
		}

		/**
		 * Plugins
		 */
		$active_plugins = self::get_active_plugins();
		$active_plugins = array_keys( $active_plugins );

		foreach ( $active_plugins as $active_plugin ) {
			$script_files = $this->get_pre_post_script( $active_plugin, $script_files, $filename ); // @todo See note above for how I think the array_merge() should be done here rather than passing $script_files into the method.
		}

		if ( ! empty( $script_files ) ) {
			$this->write_log( implode( '|', $script_files ) ); // @todo Why not rather implode with "\n"?
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
			$import_files = $this->get_import_files_single( 'core', $import_files ); // @todo For each call to get_import_files_single in this method I think its better to do the array_merge() in the caller function.

			if ( self::is_gutenberg_active() ) {
				$import_files = $this->get_import_files_single( 'gutenberg', $import_files );
			}
		}

		/**
		 * Themes
		 */
		$active_theme_object = wp_get_theme();
		$active_theme        = $active_theme_object->get_stylesheet();
		$import_files        = $this->get_import_files_single( $active_theme, $import_files );

		if ( ! empty( $active_theme_object->parent() ) && ! is_a( $active_theme_object->parent(), 'WP_Theme' ) ) {
			$parent_theme = $active_theme_object->parent()->get_stylesheet();
			$import_files = $this->get_import_files_single( $parent_theme, $import_files );
		}

		/**
		 * Plugins
		 */
		$active_plugins = self::get_active_plugins();
		$active_plugins = array_keys( $active_plugins );

		foreach ( $active_plugins as $active_plugin ) {
			$import_files = $this->get_import_files_single( $active_plugin, $import_files );
		}

		if ( ! empty( $import_files ) ) {
			$this->write_log( implode( '|', $import_files ) ); // @todo See note above about concatenating with newline.
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
			$generator->clear();
		}

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
