<?php
/**
 * Base class for plugin configuration.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\Plugin_Configs;

/**
 * Class Base
 */
abstract class Base {

	/**
	 * Get list of file name that need to import for plugin.
	 * key contain file name store as in 'data' directory
	 * Where value contain url from where it downloads.
	 *
	 * @return array List of file name.
	 */
	public function get_import_files() {

		return [];
	}

	/**
	 * List of cli command that need to execute for plugin.
	 *
	 * @return array
	 */
	public function get_cli_commands() {

		return [];
	}

	/**
	 * Callback function of plugin. to execute after test data setup.
	 *
	 * @return void
	 */
	public function after_setup() {
	}

}
