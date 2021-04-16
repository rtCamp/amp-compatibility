<?php
/**
 * Navigations class.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

use AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class Navigations
 */
class Navigations {

	use Singleton;

	/**
	 * To setup action/filters.
	 *
	 * @return void
	 */
	public function setup_hooks() {

		add_filter( 'theme_mod_nav_menu_locations', [ $this, 'add_navigation_menus' ] );
	}

	/**
	 * To assign navigation mei in registered nav menus.
	 *
	 * @param array $locations List of registered nav menus.
	 *
	 * @return array List of registered nav menus.
	 */
	public function add_navigation_menus( $locations ) {

		if ( is_admin() ) {
			return $locations;
		}

		$testing_menu = wp_get_nav_menu_object( 'Testing Menu' );
		$social_menu  = wp_get_nav_menu_object( 'Social menu' );
		if ( ! ( $testing_menu instanceof \WP_Term ) || ! ( $social_menu instanceof \WP_Term ) ) {
			return $locations;
		}

		$locations = [];
		foreach ( array_keys( get_registered_nav_menus() ) as $nav_menu_location ) {
			if ( 'social' === $nav_menu_location ) {
				$locations[ $nav_menu_location ] = $social_menu->term_id;
			} else {
				$locations[ $nav_menu_location ] = $testing_menu->term_id;
			}
		}

		return $locations;
	}
}
