<?php
/**
 * Woocommerce config file.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Plugin_Configs;

use AMP_WP_Dummy_Data_Generator\Inc\Config_Base;

/**
 * Class Woocommerce
 */
class Woocommerce extends Config_Base {

	/**
	 * Name of theme/plugin.
	 *
	 * @var string
	 */
	public $name = 'woocommerce';

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
