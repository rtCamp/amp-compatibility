<?php
/**
 * Generate pages for each blocks.
 */

namespace AMP_WP_Compatibility_Suite\Inc\Generator;

/**
 * Class Blocks
 */
class Blocks extends Base {

	public function generate() {

		$block_types = \WP_Block_Type_Registry::get_instance()->get_all_registered();

	}

}