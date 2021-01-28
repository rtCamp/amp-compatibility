<?php
/**
 * Helper functions.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Helpers;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;

/**
 * Get context for text.
 *
 * @param string $value Find context from.
 *
 * @return string[]
 */
function get_context_from( $value ) {

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

	return $context;
}