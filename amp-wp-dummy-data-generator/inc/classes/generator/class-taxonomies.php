<?php
/**
 * Generator class taxonomies.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;
use function WP_CLI\Utils\make_progress_bar;

/**
 * Class Taxonomies
 */
class Taxonomies extends Base {

	/**
	 * Get list of taxonomies for that terms need to generate.
	 *
	 * @return array List of taxonomy.
	 */
	protected function get_taxonomies() {

		// TODO: This seems slightly problematic, it would be better to find a solution which
		// doesn't require manual exclusions, as doing that would be impossible for all the
		// different plugins and configurations out there.
		//
		// Maybe we could do something along the lines of also checking for each public taxonomy
		// whether it also has at least one public post type assigned? I'd argue that a post type
		// really shouldn't be public if it shouldn't appear in the frontend.
		// If a taxonomy is public but doesn't have any post types associated, it shouldn't appear
		// in the frontend anyways.
		$taxonomies = get_taxonomies( [ 'public' => true ] );
		$exclude    = [
			'amp_validation_error',
			'coblocks_pattern_type',
			'coblocks_pattern_category',
			'post_format',
		];

		return array_diff( $taxonomies, $exclude );
	}

	/**
	 * To create terms for each taxonomies.
	 *
	 * @return void
	 */
	public function generate() {

		$taxonomies = $this->get_taxonomies();
		$count      = count( $taxonomies );
		$terms      = [];

		$progress = make_progress_bar(
			sprintf( $count === 1 ? 'Generating terms for %d taxonomy...' : 'Generating terms for %d taxonomies...', $count ),
			$count
		);

		foreach ( $taxonomies as $taxonomy ) {
			$terms[ $taxonomy ] = $this->generate_terms_for( $taxonomy );
			$progress->tick();
		}

		$progress->finish();
	}

	/**
	 * To delete generated terms.
	 *
	 * @return void
	 */
	public function clear() {

		$taxonomies = $this->get_taxonomies();
		$count      = count( $taxonomies );

		$progress = make_progress_bar(
			sprintf( $count === 1 ? 'Deleting terms for %d taxonomy...' : 'Deleting terms for %d taxonomies...', $count ),
			$count
		);

		foreach ( $taxonomies as $taxonomy ) {
			$args  = [
				'fields'     => 'ids',
				'taxonomy'   => $taxonomy,
				'meta_key'   => self::GENERATED_FLAG,
				'meta_value' => 'true',
				'hide_empty' => false,
			];
			$terms = get_terms( $args );

			if ( empty( $terms ) && ! is_wp_error( $terms ) && is_array( $terms ) ) {
				foreach ( $terms as $term ) {
					wp_delete_term( $term, $taxonomy );
				}
			}

			$progress->tick();
		}

		$progress->finish();
	}

	/**
	 * To generate terms for given taxonomy.
	 *
	 * @param string $taxonomy Taxonomy name.
	 *
	 * @return array
	 */
	protected function generate_terms_for( $taxonomy ) {

		if ( empty( $taxonomy ) || ! taxonomy_exists( $taxonomy ) ) {
			return [];
		}

		$taxonomy_object = get_taxonomy( $taxonomy );
		$limit           = $taxonomy_object->hierarchical ? AMP_WP_DUMMY_DATA_GENERATOR_LIMIT * 2 : AMP_WP_DUMMY_DATA_GENERATOR_LIMIT;
		$labels          = get_taxonomy_labels( $taxonomy_object );
		$singular_name   = ( ! empty( $labels->singular_name ) ) ? $labels->singular_name : $taxonomy;
		$terms           = [];


		for ( $index = 1; $index <= $limit; $index ++ ) {

			$term = "$index: $singular_name";
			$args = [
				'description' => Strings::get_dummy_content( 128 ),
			];

			if ( $taxonomy_object->hierarchical && $index > ( $limit / 2 ) ) {
				$parent_index   = $index - ( $limit / 2 );
				$args['parent'] = $terms[ $parent_index ];
			}

			$term_object = get_term_by( 'name', $term, $taxonomy );

			if ( ! empty( $term_object ) && is_a( $term_object, 'WP_Term' ) ) {
				$term_id = $term_object->term_id;
			} else {
				$term_id = $this->generate_term( $term, $taxonomy, $args );
			}

			$terms[ $index ] = $term_id;

		}

		return $terms;
	}

	/**
	 * Wrapper function for wp_insert_term() to create term.
	 *
	 * @param string $term     The term name to add.
	 * @param string $taxonomy The taxonomy to which to add the term.
	 * @param array  $args     Optional. Array or query string of arguments for inserting a term.
	 *
	 * @return int Term ID.
	 */
	protected function generate_term( $term, $taxonomy, array $args = [] ) {
		$response = wp_insert_term( $term, $taxonomy, $args );

		$term_id = ( ! empty( $response ) && ! is_wp_error( $response ) && 0 < intval( $response['term_id'] ) ) ? intval( $response['term_id'] ) : 0;

		if ( $term_id ) {
			update_term_meta( $term_id, self::GENERATED_FLAG, 'true' );
		}

		return $term_id;
	}
}
