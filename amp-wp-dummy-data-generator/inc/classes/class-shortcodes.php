<?php
/**
 *
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

use \AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class Shortcodes.
 */
class Shortcodes {

	use Singleton;

	/**
	 * Construct method.
	 */
	protected function __construct() {

		$this->setup_hooks();
	}

	/**
	 * To setup action and filters.
	 *
	 * @return void
	 */
	protected function setup_hooks() {

		/**
		 * Filters
		 */
		add_filter( 'the_content', [ $this, 'render_shortcode_page' ], 1 );

	}

	/**
	 * To render shortcode content on the page..
	 *
	 * @param string $content Page content.
	 *
	 * @return string Page content.
	 */
	public function render_shortcode_page( $content ) {

		global $post, $shortcode_tags;

		if ( empty( $post ) || ! is_a( $post, 'WP_Post' ) || 'amp-wp-dummy-data-generator-shortcodes' !== $post->post_name ) {
			return $content;
		}

		foreach ( $shortcode_tags as $shortcode_tag => $callback ) {
			$shortcode_content = "<div><h3>$shortcode_tag</h3> [$shortcode_tag] </div>";

			$content .= '<br/>' . $shortcode_content;
		}

		return $content;
	}

}