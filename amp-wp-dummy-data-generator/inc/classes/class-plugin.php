<?php
/**
 * Plugin manifest class.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

use \AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class Plugin
 */
class Plugin {

	use Singleton;

	/**
	 * Construct method.
	 */
	protected function __construct() {

		// Load plugin classes.
		Widgets::get_instance();
		Shortcodes::get_instance();
		CLI::get_instance();
		Navigations::get_instance();

	}

	/**
	 * Setup action/filters.
	 *
	 * @return void
	 */
	public function setup_hooks() {

		add_filter( 'pre_option_permalink_structure', [ $this, 'update_posts_permastructs' ] );
		Widgets::get_instance()->setup_hooks();
		Shortcodes::get_instance()->setup_hooks();
		Navigations::get_instance()->setup_hooks();
	}

	/**
	 * Update posts perma structure.
	 *
	 * @return string New post permastructs.
	 */
	public function update_posts_permastructs() {

		return '/%postname%/';
	}
}
