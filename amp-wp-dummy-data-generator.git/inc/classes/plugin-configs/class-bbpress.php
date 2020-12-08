<?php
/**
 * BBPress config file.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\Plugin_Configs;

/**
 * Class Bbpress
 */
class Bbpress extends Base {

	/**
	 * Get list of file name that need to import for plugin.
	 * key contain file name store as in 'data' directory
	 * Where value contain url from where it downloads.
	 *
	 * @return array List of file name.
	 */
	public function get_import_files() {

		return [
			'bbpress-unit-test-data.xml' => 'https://bbpress.trac.wordpress.org/raw-attachment/ticket/2516/bbpress-unit-test-data.xml',
		];
	}

}
