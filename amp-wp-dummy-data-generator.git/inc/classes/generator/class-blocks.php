<?php
/**
 * Generate pages for each blocks.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

/**
 * Class Blocks
 */
class Blocks extends Base {

	/**
	 * Generator function.
	 *
	 * @return void
	 */
	public function generate() {

		$block_types = \WP_Block_Type_Registry::get_instance()->get_all_registered();

	}

}
