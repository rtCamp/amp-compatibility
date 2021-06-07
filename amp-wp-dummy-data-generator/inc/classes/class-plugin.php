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

		add_filter( 'the_content', [ $this, 'update_post_content' ] );
	}

	/**
	 * Update posts perma structure.
	 *
	 * @return string New post permastructs.
	 */
	public function update_posts_permastructs() {

		return '/%postname%/';
	}


	/**
	 * - Remove empty img tag. ( Which is render by "core/media-text" block )
	 * - Make all URLs "https://"
	 *
	 * @param string $content Post content
	 *
	 * @return string Post content.
	 */
	public function update_post_content( $content = '' ) {

		// Reference: https://regex101.com/r/pb19AF/1/
		$regex   = '/<(?:amp-)?img\/>/mUi';
		$content = preg_replace( $regex, '', $content );

		// Reference: https://regex101.com/r/sal6Bb/1/
		$regex = '/http:\/\//mUi';
		$content = preg_replace( $regex, 'https://', $content );

		return $content;
	}

}
