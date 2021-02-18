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

	const GENERATED_FLAG = '_amp_wp_dummy_data';

	const KEY_URL = 'url';

	const KEY_OBJECT_TYPE = 'object_type';

	const KEY_OBJECT_SUBTYPE = 'object_subtype';

	const KEY_ID = 'id';

	/**
	 * Generates new content for the current WordPress context.
	 *
	 * @return void
	 */
	public function generate() {
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
	 * Generates a post.
	 *
	 * @param array $args         {
	 *                            Arguments for creating the post.
	 *
	 * @type string $post_type    Post type. Default 'post'.
	 * @type string $post_status  Post status. Default 'publish'.
	 * @type string $post_title   Post title. Default 'AMP Test Post'.
	 * @type string $post_content Post content. Default empty string.
	 * @type int    $post_author  Post author ID. Default is the current
	 *                                user or administrator.
	 * }
	 * @throws \Exception Thrown when creating post failed.
	 * @return int Associative item array. See {@see Object_Generator::get_fields()}
	 *               for available fields.
	 *
	 * @since 1.0.0
	 *
	 */
	protected function generate_post( array $args ) {

		$defaults = [
			'post_type'    => 'post',
			'post_status'  => 'publish',
			'post_title'   => 'AMP Test Post',
			'post_content' => '',
			'post_author'  => $this->get_author_user()->ID,
			'meta_input'   => [
				self::GENERATED_FLAG => 'true',
			],
		];

		$args    = wp_parse_args( $args, $defaults );
		$post_id = wp_insert_post( wp_slash( $args ), true );

		return ( ! empty( $post_id ) && ! is_wp_error( $post_id ) && 0 < intval( $post_id ) ) ? intval( $post_id ) : 0;
	}

	/**
	 * Deletes all generated content.
	 *
	 * @since 1.0.0
	 */
	public function clear() {
	}

	/**
	 * Gets the user to specify as author for generated content.
	 *
	 * @return \WP_User User object.
	 * @since 1.0.0
	 *
	 */
	protected function get_author_user(): \WP_User {

		$user = wp_get_current_user();
		if ( $user->exists() && user_can( $user->ID, 'edit_posts' ) ) {
			return $user;
		}

		$users = get_users(
			array(
				'number' => 1,
				'role'   => 'administrator',
			)
		);
		if ( ! empty( $users ) ) {
			return $users[0];
		}

		// Edge-case, probably never.
		\WP_CLI::error(
			'There appears to not be any administrator account on your site.'
		);

		return new \WP_User();
	}

}
