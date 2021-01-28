<?php
/**
 * Generator class for different post types.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;

/**
 * Class PostTypes
 */
class PostTypes extends Base {

	/**
	 * Generator function.
	 *
	 * @return void
	 */
	public function generate() {

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
		$posts      = [];

		print_r( PHP_EOL );
		foreach ( $post_types as $post_type ) {
			$posts[ $post_type ] = $this->generate_posts_for( $post_type );

			printf( PHP_EOL . 'Post type: %s' . PHP_EOL, $post_type );

			foreach ( $posts[ $post_type ] as $post_id ) {
				if ( ! empty( $post_id ) && 0 < intval( $post_id ) ) {
					$post = get_post( $post_id );
					printf( 'Term: "%s" => %s' . PHP_EOL, $post->post_title, get_permalink( $post_id ) );
				}
			}
		}


	}

	protected function generate_posts_for( $post_type ) {

		if ( empty( $post_type ) || ! post_type_exists( $post_type ) ) {
			return [];
		}

		$posts            = [];
		$limit            = AMP_WP_DUMMY_DATA_GENERATOR_LIMIT;
		$post_type_object = get_post_type_object( $post_type );
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

						$count  = count( $terms );
						$term_1 = rand( 1, $count ) - 1;
						$term_2 = rand( 1, $count ) - 1;

						print_r( $terms );
						$args['tax_input'][ $taxonomy ] = [
							$terms[ $term_1 ]->term_id,
							$terms[ $term_2 ]->term_id,
						];

					}

				}

				$response = wp_insert_post( $args, true );

				if ( ! empty( $response ) && ! is_wp_error( $response ) ) {
					$post_id = $response;
				}

			}

			$posts[ $index ] = $post_id;

		}


		return $posts;
	}

}
