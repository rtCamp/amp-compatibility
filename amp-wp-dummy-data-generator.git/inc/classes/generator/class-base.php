<?php
/**
 * Base class for generator.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\Generator;

/**
 * Class Base
 */
class Base {

	/**
	 * Generator function.
	 *
	 * @return void
	 */
	public function generate() {
	}

	/**
	 * Helper function to create single post.
	 *
	 * @param array $post_args Args for create post.
	 *
	 * @return int Post ID on success, otherwise 0.
	 */
	protected static function create_and_get_post( $post_args ) {

		if ( empty( $post_args ) || ! is_array( $post_args ) ) {
			return 0;
		}

		$post_args['meta_input'] = ( ! empty( $post_args['meta_input'] ) && is_array( $post_args['meta_input'] ) ) ? $post_args['meta_input'] : [];
		$post_args['meta_input'] = wp_parse_args(
			$post_args['meta_input'],
			[
				'amp-wp-compatibility-page' => 'yes',
			]
		);

		$post_id = wp_insert_post( $post_args, true );

		return ( ! empty( $post_id ) && ! is_wp_error( $post_id ) && 0 < intval( $post_id ) ) ? intval( $post_id ) : 0;
	}

}
