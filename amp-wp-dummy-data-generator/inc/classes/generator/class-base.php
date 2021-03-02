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
abstract class Base {

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
	 * @todo As noted in cleanup.sh, I think we can avoid needing to worry about cleanup by just restoring a DB dump after the run completes.
	 *
	 * @return void
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
			'meta_input'   => [],
		];

		$args = wp_parse_args( $args, $defaults );

		$args['meta_input'] = array_merge(
			$args['meta_input'],
			[
				self::GENERATED_FLAG => 'true',
			]
		);

		$post_id = wp_insert_post( wp_slash( $args ), true );

		return ( ! empty( $post_id ) && ! is_wp_error( $post_id ) && 0 < intval( $post_id ) ) ? intval( $post_id ) : 0;
	}

	/**
	 * Gets the user to specify as author for generated content.
	 *
	 * @return \WP_User User object.
	 */
	protected function get_author_user() {

		$user = wp_get_current_user();
		if ( $user->exists() && user_can( $user->ID, 'edit_posts' ) ) {
			return $user;
		}

		$users = get_users(
			array( // @todo Please update all PHP files to use the square bracket syntax.
				'number' => 1,
				'role'   => 'administrator',
			)
		);

		if ( ! empty( $users ) ) {
			return $users[0];
		}

		// @todo Probably better to throw an exception.
		// Edge-case, probably never.
		\WP_CLI::error(
			'There appears to not be any administrator account on your site.'
		);

		return new \WP_User();
	}
}
