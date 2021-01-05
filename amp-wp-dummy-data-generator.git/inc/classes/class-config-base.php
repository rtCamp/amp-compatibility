<?php
/**
 * Base class for theme/plugin configuration.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

/**
 * Class Base
 */
abstract class Config_Base {

	/**
	 * Name of theme/plugin.
	 *
	 * @var string
	 */
	public $name = '';

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
	 * List of cli command that need to execute before importing.
	 *
	 * @return array
	 */
	public function get_before_cli_commands() {

		return [];
	}

	/**
	 * Callback function to execute before importing.
	 *
	 * @return void
	 */
	public function before_importing() {
	}

	/**
	 * List of cli command that need to execute before importing.
	 *
	 * @return array
	 */
	public function get_after_cli_commands() {

		return [];
	}

	/**
	 * Callback function to execute after importing.
	 *
	 * @return void
	 */
	public function after_importing() {
	}

}
