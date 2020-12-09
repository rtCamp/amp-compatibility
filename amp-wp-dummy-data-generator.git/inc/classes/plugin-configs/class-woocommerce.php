<?php
/**
 * Woocommerce config file.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\Plugin_Configs;

/**
 * Class Woocommerce
 */
class Woocommerce extends Base {

	/**
	 * Get list of file name that need to import for plugin.
	 * key contain file name store as in 'data' directory
	 * Where value contain url from where it downloads.
	 *
	 * @return array List of file name.
	 */
	public function get_import_files() {

		return [
			'woocommerce-sample_products.xml' => 'https://raw.githubusercontent.com/woocommerce/woocommerce/master/sample-data/sample_products.xml',
		];
	}

}
