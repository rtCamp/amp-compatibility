<?php
/**
 * Base class for generator.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

use AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class Base
 */
class Base {

	use Singleton;

	const GENERATED_FLAG = '_amp_wp_dummy_data';

	/**
	 * Generates new content for the current WordPress context.
	 *
	 * @return void
	 */
	public function generate() {
	}

	/**
	 * Deletes all generated content.
	 *
	 * @since 1.0.0
	 */
	public function clear() {
	}

	/**
	 * Generates a post.
	 *
	 * @param array $args
	 *
	 * @return int
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
