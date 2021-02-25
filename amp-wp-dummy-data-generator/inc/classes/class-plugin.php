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

		// TODO: While the plugin doesn't currently appear to have test coverage, adding hooks
		// in a constructor is generally discouraged as it causes side effects beyond instantiating
		// the class.
		// I suggest to generally decouple adding hooks from the constructor (same in the other
		// class instantiations), e.g. by making `setup_hooks()` public and calling it after
		// creating the new instance.
		$this->setup_hooks();

		// Load plugin classes.
		Widgets::get_instance();
		Shortcodes::get_instance();
		WP_CLI::get_instance(); // @todo It's confusing that there is a WP_CLI global in addition to a namespaced WP_CLI.
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
