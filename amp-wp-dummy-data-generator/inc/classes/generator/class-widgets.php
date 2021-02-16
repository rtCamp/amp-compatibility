<?php
/**
 * Generator class for widgets.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

/**
 * Class Widgets
 */
class Widgets extends Base {

	/**
	 * Generator function.
	 *
	 * @return array
	 */
	public function generate(): array {

		$post_ids = [];
		$posts    = get_posts(
			[
				'name'      => 'amp-wp-compatibility-widgets',
				'post_type' => 'page',
				'fields'    => 'ids',
			]
		);

		if ( empty( $posts ) ) {
			$page_args = [
				'post_type'  => 'page',
				'post_title' => 'AMP WP Compatibility Widgets',
				'post_name'  => 'amp-wp-compatibility-widgets',
			];

			$post_id = self::create_and_get_post( $page_args );
		} else {
			$post_id = $posts[0];
		}


		if ( ! empty( $post_id ) && ! is_wp_error( $post_id ) && 0 < intval( $post_id ) ) {
			$post_ids[] = $post_id;
		} else {
			\WP_CLI::warning( 'Failed to create widget page: ' );
		}

		return $post_ids;
	}

}
