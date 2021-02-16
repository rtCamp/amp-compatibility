<?php
/**
 * Generator class for different post types.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

/**
 * Class PostTypes
 */
class PostTypes extends Base {

	const BLOCK_PAGE_SLUG = 'amp-test-page-for-blocks';

	/**
	 * Generates new posts for the current WordPress context.
	 *
	 * @return array List of generated content results. See {@see Object_Generator::get_fields()}
	 *               for available fields.
	 * @since 1.0.0
	 *
	 */
	public function generate(): array {

		$post_types = get_post_types( array( 'public' => true ), 'objects' );

		$existing_posts = get_posts(
			array(
				'posts_per_page' => -1,
				'post_type'      => array_keys( $post_types ),
				// 'inherit' is needed for attachments.
				'post_status'    => array( 'publish', 'inherit' ),
			)
		);

		$posts_by_type = array_reduce(
			$existing_posts,
			function ( array $acc, \WP_Post $post ) {

				if ( ! isset( $acc[ $post->post_type ] ) ) {
					$acc[ $post->post_type ] = array();
				}
				$acc[ $post->post_type ][] = $post;

				return $acc;
			},
			array()
		);

		// Only generate posts for post types that don't have any.
		$post_types_to_generate_content = array_filter(
			$post_types,
			function ( \WP_Post_Type $post_type ) use ( $posts_by_type ) {

				return empty( $posts_by_type[ $post_type->name ] );
			}
		);

		// +1 for Gutenberg block tests page (see below).
		$count = count( $post_types_to_generate_content ) + 1;

		$progress = \WP_CLI\Utils\make_progress_bar(
			sprintf( $count === 1 ? 'Generating %d post...' : 'Generating %d posts...', $count ),
			$count
		);

		// Generate one post for every post type that does not have any.
		$items = array();
		foreach ( $post_types_to_generate_content as $post_type ) {
			try {
				$items[] = $this->generate_post(
					array(
						'post_type'    => $post_type->name,
						'post_title'   => sprintf( 'AMP Test %s', $post_type->labels->singular_name ),
						'post_content' => 'This is the content.',
					)
				);
			} catch ( \Exception $e ) {
				\WP_CLI::error(
					sprintf(
						'Could not create post of post type "%1$s". Error: %2$s',
						$post_type->name,
						$e->getMessage()
					)
				);
			}
			$progress->tick();
		}

		// Generate a page that will be populated with Gutenberg blocks to test.
		try {
			$items[] = $this->generate_post(
				array(
					'post_type'    => 'page',
					'post_title'   => 'AMP Test Page for Blocks',
					'post_name'    => static::BLOCK_PAGE_SLUG,
					'post_content' => '',
				)
			);
		} catch ( \Exception $e ) {
			\WP_CLI::error(
				sprintf(
					'Could not create post of post type "page" for blocks tests. Error: %s',
					$e->getMessage()
				)
			);
		}
		$progress->tick();

		$progress->finish();

		return $items;
	}

	/**
	 * Deletes all generated posts.
	 *
	 * @since 1.0.0
	 */
	public function clear() {

		$posts = get_posts(
			array(
				'posts_per_page' => - 1,
				'post_type'      => get_post_types( array( 'public' => true ), 'names' ),
				// 'inherit' is needed for attachments.
				'post_status'    => array( 'publish', 'inherit' ),
				'meta_query'     => array(
					array(
						'key'   => self::GENERATED_FLAG,
						'value' => 'true',
					),
				),
			)
		);

		$count = count( $posts );

		$progress = \WP_CLI\Utils\make_progress_bar(
			sprintf( $count === 1 ? 'Deleting %d post...' : 'Deleting %d posts...', $count ),
			$count
		);

		foreach ( $posts as $post ) {
			wp_delete_post( $post->ID, true );
			$progress->tick();
		}

		$progress->finish();
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
	 * @return array Associative item array. See {@see Object_Generator::get_fields()}
	 *               for available fields.
	 *
	 * @since 1.0.0
	 *
	 */
	private function generate_post( array $args ): array {

		$args = array_merge(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_title'   => 'AMP Test Post',
				'post_content' => '',
				'post_author'  => $this->get_author_user()->ID,
				'meta_input'   => array(
					self::GENERATED_FLAG => 'true',
				),
			),
			$args
		);

		$post_id = wp_insert_post( wp_slash( $args ), true );
		if ( is_wp_error( $post_id ) ) {
			throw new \Exception( $post_id->get_error_message() );
		}

		$post = get_post( $post_id );

		return array(
			static::KEY_URL            => get_permalink( $post ),
			static::KEY_OBJECT_TYPE    => 'post',
			static::KEY_OBJECT_SUBTYPE => $post->post_type,
			static::KEY_ID             => $post->ID,
		);
	}

	/**
	 * Gets the user to specify as author for generated content.
	 *
	 * @return \WP_User User object.
	 * @since 1.0.0
	 *
	 */
	private function get_author_user(): \WP_User {

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
