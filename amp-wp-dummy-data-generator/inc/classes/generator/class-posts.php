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

	protected function get_post_types() {

		$exclude_list = [
			'nav_menu_item',
			'revision',
			'custom_css',
			'customize_changeset',
			'oembed_cache',
			'user_request',
		];

		$post_types = get_post_types();
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
			sprintf( $count === 1 ? 'Generating posts for %d post type...' : 'Generating posts for %d post types...', $count ),
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
	 * @since 1.0.0
	 */
	public function clear() {

		$post_types = $this->get_post_types();
		$count      = count( $post_types );

		$progress = make_progress_bar(
			sprintf( $count === 1 ? 'Deleting posts for %d post type...' : 'Deleting posts for %d post types...', $count ),
			$count
		);

		foreach ( $post_types as $post_type ) {
			$args = [
				'posts_per_page' => -1,
				'post_type'      => $post_type,
				'post_status'    => 'any',
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

	protected function generate_posts_for( $post_type ) {

		if ( empty( $post_type ) || ! post_type_exists( $post_type ) ) {
			return [];
		}

		$posts            = [];
		$post_type_object = get_post_type_object( $post_type );
		$limit            = $post_type_object->hierarchical ? AMP_WP_DUMMY_DATA_GENERATOR_LIMIT * 2 : AMP_WP_DUMMY_DATA_GENERATOR_LIMIT;
		$singular_name    = ( ! empty( $post_type_object->labels->singular_name ) ) ? $post_type_object->labels->singular_name : $post_type;

		// Find associated taxonomies.
		$taxonomy_terms = [];
		$taxonomies     = get_taxonomies( [
			'object_type' => [ $post_type ],
		] );

		foreach ( $taxonomies as $taxonomy ) {
			$taxonomy_terms[ $taxonomy ] = get_terms( [
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
			] );
		}

		$taxonomy_terms = array_filter( $taxonomy_terms );

		for ( $index = 1; $index <= $limit; $index ++ ) {

			$post_id    = false;
			$post_title = "$index: $singular_name";

			$args = [
				'post_title'  => $post_title,
				'post_type'   => $post_type,
				'post_status' => 'publish',
			];

			if ( $post_type_object->hierarchical && $index > ( $limit / 2 ) ) {
				$parent_index        = $index - ( $limit / 2 );
				$args['post_parent'] = $posts[ $parent_index ];
			}

			$existing_posts = get_posts( [
				'title'       => $post_title,
				'post_type'   => $post_type,
				'numberposts' => 1,
				'fields'      => 'ids',
			] );

			if ( ! empty( $existing_posts[0] ) && 0 < intval( $existing_posts[0] ) ) {
				$post_id = $existing_posts[0];
			} else {

				$args['post_content'] = Strings::get_dummy_content( 1024 );
				$args['post_excerpt'] = Strings::get_dummy_content( 256 );

				if ( ! empty( $taxonomy_terms ) && 0 < count( $taxonomy_terms ) ) {

					$args['tax_input'] = [];

					foreach ( $taxonomy_terms as $taxonomy => $terms ) {

						if ( ! in_array( $taxonomy, $post_type_object->taxonomies, true ) ) {
							continue;
						}

						$count  = count( $terms );
						$term_1 = rand( 1, $count ) - 1;

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
