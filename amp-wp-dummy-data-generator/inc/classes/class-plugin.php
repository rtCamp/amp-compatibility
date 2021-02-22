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

		$this->setup_hooks();

		// Load plugin classes.
		Widgets::get_instance();
		Shortcodes::get_instance();
		WP_CLI::get_instance();
		Page::get_instance();
		Navigations::get_instance();

	}

	/**
	 * Setup action/filters.
	 *
	 * @return void
	 */
	protected function setup_hooks() {

		add_filter( 'pre_option_permalink_structure', [ $this, 'update_posts_permastructs' ] );
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
