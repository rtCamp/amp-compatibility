<?php
/**
 * Base class for generator.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

/**
 * Class Base
 */
class Base {

	const GENERATED_FLAG = '_amp_wp_compatibility_suite_generated';

	const KEY_URL = 'url';

	const KEY_OBJECT_TYPE = 'object_type';

	const KEY_OBJECT_SUBTYPE = 'object_subtype';

	const KEY_ID = 'id';

	/**
	 * Generates new content for the current WordPress context.
	 *
	 * @return array List of generated content results.
	 * @since 1.0.0
	 *
	 */
	public function generate(): array {

		return [];
	}

	/**
	 * Deletes all generated content.
	 *
	 * @since 1.0.0
	 */
	public function clear() {

	}

	/**
	 * Returns the available fields within a result.
	 *
	 * @return array List of field identifiers.
	 * @since 1.0.0
	 *
	 */
	public function get_fields(): array {

		return array(
			static::KEY_URL,
			static::KEY_OBJECT_TYPE,
			static::KEY_OBJECT_SUBTYPE,
			static::KEY_ID,
		);
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
