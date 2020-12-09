<?php
/**
 * Generate pages for each blocks.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\Generator;

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
