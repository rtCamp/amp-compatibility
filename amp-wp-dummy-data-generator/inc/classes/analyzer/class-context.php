<?php
/**
 * Context of any object.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Analyzer;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;

class Context {

	public $type = '';
	public $sub_type = '';
	public $value_type = '';

	protected $limit = 10;

	protected function __construct( $options ) {

		$this->type       = ( ! empty( $options['type'] ) ) ? $options['type'] : '';
		$this->sub_type   = ( ! empty( $options['sub_type'] ) ) ? $options['sub_type'] : '';
		$this->value_type = ( ! empty( $options['value_type'] ) ) ? $options['value_type'] : '';

	}


	public function get_values() {

		if ( empty( $this->type ) || empty( $this->sub_type ) ) {
			return [];
		}

		$values = [];

		switch ( $this->type ) {
			case 'post_type':

				$query = new \WP_Query( [
					'post_type'   => $this->sub_type,
					'post_status' => 'publish',
					'numberposts' => $this->limit,
				] );

				$posts = $query->get_posts();

				if ( ! empty( $posts ) && is_array( $posts ) ) {
					switch ( $this->value_type ) {
						case 'id':
							$values = wp_list_pluck( $posts, 'ID' );
							break;
						case 'slug':
							$values = wp_list_pluck( $posts, 'post_name' );
							break;
						default:
							$values = $posts;
					}
				}

				break;
			case 'taxonomy':
				$query  = new \WP_Term_Query(
					[
						'taxonomy'   => $this->sub_type,
						'hide_empty' => true,
					]
				);
				$terms = $query->get_terms();

				if ( ! empty( $terms ) && is_array( $terms ) ) {
					switch ( $this->value_type ) {
						case 'id':
							$values = wp_list_pluck( $terms, 'term_id' );
							break;
						case 'slug':
							$values = wp_list_pluck( $terms, 'slug' );
							break;
						default:
							$values = $terms;
					}
				}
				break;
			case 'user':
				break;

		}

		return $values;
	}


	public static function get_context_from( $value ) {

		$context = [
			'type'       => '',
			'sub_type'   => '',
			'value_type' => '',
		];

		$snack_case_name = Strings::convert_to_snack_case( $value );
		$snack_case_name = str_replace( '-', '_', $snack_case_name );

		/**
		 * Post types.
		 */
		$post_types = get_post_types();

		foreach ( $post_types as $post_type ) {
			$snack_case_post_type = str_replace( '-', '_', $post_type );
			if ( false !== strpos( $snack_case_name, $snack_case_post_type ) ) {
				$context['type']     = 'post_type';
				$context['sub_type'] = $post_type;
			}
		}

		/**
		 * Media
		 */

		/**
		 * Taxonomies.
		 */
		$taxonomies = get_taxonomies();

		foreach ( $taxonomies as $taxonomy ) {
			$snack_case_taxonomy = str_replace( '-', '_', $taxonomy );
			if ( false !== strpos( $snack_case_name, $snack_case_taxonomy ) ) {
				$context['type']     = 'taxonomy';
				$context['sub_type'] = $taxonomy;
			}
		}

		/**
		 * Users.
		 */
		foreach ( [ 'author', 'user' ] as $item ) {
			if ( false !== strpos( $snack_case_name, $item ) ) {
				$context['type']     = 'user';
				$context['sub_type'] = 'user';
			}
		}

		/**
		 * Check for value type.
		 */
		if ( false !== strpos( $snack_case_name, 'id' ) ) {
			$context['value_type'] = 'id';
		} elseif ( false !== strpos( $snack_case_name, 'slug' ) ) {
			$context['value_type'] = 'slug';
		}

		return ( new self( $context ) );
	}

}