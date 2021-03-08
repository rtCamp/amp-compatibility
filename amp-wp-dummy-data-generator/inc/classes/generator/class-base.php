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
	 * @param array $args  {
	 *     An array of elements that make up a post to update or insert.
	 *
	 *     @type int    $ID                    The post ID. If equal to something other than 0,
	 *                                         the post with that ID will be updated. Default 0.
	 *     @type int    $post_author           The ID of the user who added the post. Default is
	 *                                         the current user ID.
	 *     @type string $post_date             The date of the post. Default is the current time.
	 *     @type string $post_date_gmt         The date of the post in the GMT timezone. Default is
	 *                                         the value of `$post_date`.
	 *     @type mixed  $post_content          The post content. Default empty.
	 *     @type string $post_content_filtered The filtered post content. Default empty.
	 *     @type string $post_title            The post title. Default empty.
	 *     @type string $post_excerpt          The post excerpt. Default empty.
	 *     @type string $post_status           The post status. Default 'draft'.
	 *     @type string $post_type             The post type. Default 'post'.
	 *     @type string $comment_status        Whether the post can accept comments. Accepts 'open' or 'closed'.
	 *                                         Default is the value of 'default_comment_status' option.
	 *     @type string $ping_status           Whether the post can accept pings. Accepts 'open' or 'closed'.
	 *                                         Default is the value of 'default_ping_status' option.
	 *     @type string $post_password         The password to access the post. Default empty.
	 *     @type string $post_name             The post name. Default is the sanitized post title
	 *                                         when creating a new post.
	 *     @type string $to_ping               Space or carriage return-separated list of URLs to ping.
	 *                                         Default empty.
	 *     @type string $pinged                Space or carriage return-separated list of URLs that have
	 *                                         been pinged. Default empty.
	 *     @type string $post_modified         The date when the post was last modified. Default is
	 *                                         the current time.
	 *     @type string $post_modified_gmt     The date when the post was last modified in the GMT
	 *                                         timezone. Default is the current time.
	 *     @type int    $post_parent           Set this for the post it belongs to, if any. Default 0.
	 *     @type int    $menu_order            The order the post should be displayed in. Default 0.
	 *     @type string $post_mime_type        The mime type of the post. Default empty.
	 *     @type string $guid                  Global Unique ID for referencing the post. Default empty.
	 *     @type array  $post_category         Array of category IDs.
	 *                                         Defaults to value of the 'default_category' option.
	 *     @type array  $tags_input            Array of tag names, slugs, or IDs. Default empty.
	 *     @type array  $tax_input             Array of taxonomy terms keyed by their taxonomy name. Default empty.
	 *     @type array  $meta_input            Array of post meta values keyed by their post meta key. Default empty.
	 * }
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
			[
				'number' => 1,
				'role'   => 'administrator',
			]
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
