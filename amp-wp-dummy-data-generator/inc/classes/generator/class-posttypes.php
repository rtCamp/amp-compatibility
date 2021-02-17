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


}
