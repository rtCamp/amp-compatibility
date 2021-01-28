<?php
/**
 * Generator class taxonomies.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;

/**
 * Class Taxonomies
 */
class Taxonomies extends Base {

	/**
	 * Generator function.
	 *
	 * @return void
	 */
	public function generate() {

		$taxonomies = get_taxonomies();
		$terms      = [];

		foreach ( $taxonomies as $taxonomy ) {
			$terms[ $taxonomy ] = $this->generate_terms_for( $taxonomy );

			printf( PHP_EOL . 'Taxonomy: %s' . PHP_EOL, $taxonomy );

			foreach ( $terms[ $taxonomy ] as $term_id ) {
				if ( ! empty( $term_id ) && 0 < intval( $term_id ) ) {
					$term = get_term( $term_id, $taxonomy );
					printf( 'Term: "%s" => %s' . PHP_EOL, $term->name, get_term_link( $term_id ) );
				}
			}
		}

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

		$limit           = AMP_WP_DUMMY_DATA_GENERATOR_LIMIT;
		$taxonomy_object = get_taxonomy( $taxonomy );
		$labels          = get_taxonomy_labels( $taxonomy_object );
		$singular_name   = ( ! empty( $labels->singular_name ) ) ? $labels->singular_name : $taxonomy;

		$terms = [];

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
				$response = wp_insert_term( $term, $taxonomy, $args );
				$term_id  = ( ! empty( $response ) && ! is_wp_error( $response ) ) ? $response['term_id'] : false;
			}

			$terms[ $index ] = $term_id;

		}


		return $terms;
	}

}
