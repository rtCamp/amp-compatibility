<?php
/**
 * Helper functions to register pages.
 */

namespace AMP_WP_Compatibility_Suite\Inc;

use \AMP_WP_Compatibility_Suite\Inc\Traits\Singleton;

/**
 * Class Plugin
 */
class Page {

	use Singleton;

	/**
	 * Construct method.
	 */
	protected function __construct() {

		/**
		 * Action
		 */
		add_action( 'template_redirect', [ $this, 'maybe_render_page' ] );

		/**
		 * Filters
		 */
		add_filter( 'query_vars', [ $this, 'add_query_vars' ] );
	}

	/**
	 * Add query vars.
	 *
	 * @param array $query_vars Array of query vars.
	 *
	 * @return array Array of query vars including new ones.
	 */
	public function add_query_vars( $query_vars ) {

		$query_vars = ( ! empty( $query_vars ) && is_array( $query_vars ) ) ? $query_vars : [];

		$query_vars[] = 'amp_wp_comp_page';
		$query_vars[] = 'amp_wp_comp_page_type';
		$query_vars[] = 'amp_wp_comp_page_subtype';

		return $query_vars;

	}

	public static function register_page( $slug, $function, $type, $subtype = '' ) {

		if ( empty( $slug ) || empty( $type ) || ! is_callable( $function ) ) {
			return false;
		}

		add_action( "amp_wp_comp_render_page", $function );

		$rewrite = "index.php?amp_wp_comp_page=$slug&amp_wp_comp_page_type=$type";

		if ( ! empty( $subtype ) ) {
			$rewrite .= "&amp_wp_comp_page_subtype=$subtype";
		}

		add_rewrite_rule( $slug, $rewrite, 'top' );

		flush_rewrite_rules( true );

	}


	public function maybe_render_page() {

		$slug    = get_query_var( 'amp_wp_comp_page' );
		$type    = get_query_var( 'amp_wp_comp_page_type' );
		$subtype = get_query_var( 'amp_wp_comp_page_subtype' );

		if ( ! empty( $slug ) ) {

			if ( has_action( 'amp_wp_comp_render_page' ) ) {
				do_action( 'amp_wp_comp_render_page', $type, $subtype );
			}

			die();
		}

	}

}