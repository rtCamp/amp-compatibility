<?php
/**
 * Woocommerce config file.
 */

namespace AMP_WP_Compatibility_Suite\Inc\Plugin_Configs;

/**
 * Class Woocommerce
 *
 * @package AMP_WP_Compatibility_Suite\Inc\Plugin_Configs
 */
class Woocommerce extends Base {

	public function get_import_filename() {

		return 'woocommerce-sample_products.xml';
	}

	public function get_import_url() {

		return 'https://raw.githubusercontent.com/woocommerce/woocommerce/master/sample-data/sample_products.xml';
	}

	public function get_cli_commands() {

		return [
			'wp wc tax list --user=dhavalparekh',
		];
	}

	public function after_setup() {

		print_r( 'After Woo Commerce Setup' );
	}

}