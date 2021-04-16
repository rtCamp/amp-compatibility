<?php
/**
 * Generator class for different post types.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;
use function WP_CLI\Utils\make_progress_bar;

/**
 * Class PostTypes
 */
class Posts extends Base {

	/**
	 * To get list of post types for that post need to create.
	 *
	 * @return string[] List of post types.
	 */
	protected function get_post_types() {

		$exclude_list = [
			'nav_menu_item',
			'revision',
			'custom_css',
			'customize_changeset',
			'oembed_cache',
			'user_request',
		];

		$post_types = get_post_types( [ 'public' => true ] );
		$post_types = array_diff( $post_types, $exclude_list );

		return array_values( $post_types );
	}

	/**
	 * Generates new posts for the current WordPress context.
	 *
	 * @return void
	 */
	public function generate() {

		$post_types = $this->get_post_types();
		$count      = count( $post_types );

		$progress = make_progress_bar(
			sprintf( 1 === $count ? 'Generating posts for %d post type...' : 'Generating posts for %d post types...', $count ),
			$count
		);

		foreach ( $post_types as $post_type ) {
			$posts[ $post_type ] = $this->generate_posts_for( $post_type );
			$progress->tick();
		}

		$progress->finish();
	}

	/**
	 * Deletes all generated posts.
	 *
	 * @return void
	 */
	public function clear() {

		$post_types = $this->get_post_types();
		$count      = count( $post_types );

		$progress = make_progress_bar(
			sprintf( 1 === $count ? 'Deleting posts for %d post type...' : 'Deleting posts for %d post types...', $count ),
			$count
		);

		foreach ( $post_types as $post_type ) {
			$args = [
				'posts_per_page' => -1,
				'post_type'      => $post_type,
				'post_status'    => 'any',
				// This is synthetic data generation, we can ignore slow_db_query_meta_query.
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'     => [
					[
						'key'   => self::GENERATED_FLAG,
						'value' => 'true',
					],
				],
			];

			$posts = get_posts( $args );

			foreach ( $posts as $post ) {
				wp_delete_post( $post->ID, true );
			}

			$progress->tick();
		}

		$progress->finish();
	}

	/**
	 * To generate posts for given post type.
	 *
	 * @param string $post_type Post types name.
	 *
	 * @return array IDs of post that is created for post.
	 */
	protected function generate_posts_for( $post_type ) {

		if ( empty( $post_type ) || ! post_type_exists( $post_type ) ) {
			return [];
		}

		$theme_object = wp_get_theme();

		$posts            = [];
		$post_type_object = get_post_type_object( $post_type );
		$singular_name    = ( ! empty( $post_type_object->labels->singular_name ) ) ? $post_type_object->labels->singular_name : $post_type;
		$templates        = $theme_object->get_page_templates( null, $post_type );
		$templates        = ( ! empty( $templates ) && is_array( $templates ) ) ? array_keys( $templates ) : [];

		// Adjust the limit according the post types and it's template.
		$limit = 1;
		$limit = $limit + count( $templates );
		$limit = $post_type_object->hierarchical ? $limit * 2 : $limit;

		// Find associated taxonomies.
		$taxonomy_terms = [];
		$taxonomies     = get_taxonomies(
			[
				'object_type' => [ $post_type ],
			]
		);

		foreach ( $taxonomies as $taxonomy ) {
			$taxonomy_terms[ $taxonomy ] = get_terms(
				[
					'taxonomy'   => $taxonomy,
					'hide_empty' => false,
				]
			);
		}

		$taxonomy_terms = array_filter( $taxonomy_terms );

		for ( $index = 1; $index <= $limit; $index ++ ) {

			$post_title = "$index: $singular_name";

			$args = [
				'post_title'  => $post_title,
				'post_type'   => $post_type,
				'post_status' => 'publish',
			];

			if ( $post_type_object->hierarchical && $index > ( $limit / 2 ) ) {

				// Child Pages.
				$parent_index        = $index - ( $limit / 2 );
				$args['post_parent'] = $posts[ $parent_index ];
			} elseif ( 1 !== $index ) {
				// Parent Pages.
				$template = array_pop( $templates );

				// Set page template to post.
				if ( ! empty( $template ) ) {
					$args['post_title'] .= " : $template";

					$args['meta_input']['_wp_page_template'] = $template;
				}
			}

			$existing_posts = get_posts(
				[
					'title'       => $post_title,
					'post_type'   => $post_type,
					'numberposts' => 1,
					'fields'      => 'ids',
				]
			);

			if ( ! empty( $existing_posts[0] ) && 0 < intval( $existing_posts[0] ) ) {
				$post_id = $existing_posts[0];
			} else {

				$args['post_content'] = Strings::get_dummy_content( 1024 );
				$args['post_excerpt'] = Strings::get_dummy_content( 256 );

				// Assign random terms.
				if ( ! empty( $taxonomy_terms ) && 0 < count( $taxonomy_terms ) ) {

					$args['tax_input'] = [];

					foreach ( $taxonomy_terms as $taxonomy => $terms ) {

						if ( ! in_array( $taxonomy, $post_type_object->taxonomies, true ) ) {
							continue;
						}

						$count  = count( $terms );
						$term_1 = wp_rand( 1, $count ) - 1;

						$args['tax_input'][ $taxonomy ] = [
							$terms[ $term_1 ]->term_id,
						];
					}
				}

				$post_id = $this->generate_post( $args );

			}

			$posts[ $index ] = $post_id;

		}

		return $posts;

	}
}
