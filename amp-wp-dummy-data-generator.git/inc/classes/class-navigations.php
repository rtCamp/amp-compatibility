<?php
/**
 * Navigation class.
 */

namespace WP_CLI_Test_Data\Inc;

use WP_CLI_Test_Data\Inc\Traits\Singleton;

class Navigations {

	use Singleton;

	protected function __construct() {

		$this->setup_hooks();
	}

	protected function setup_hooks() {

		add_filter( 'theme_mod_nav_menu_locations', [ $this, 'add_navigation_menus' ] );
	}

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