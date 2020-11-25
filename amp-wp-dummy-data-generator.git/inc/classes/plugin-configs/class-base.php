<?php
/**
 * Base class for plugin configuration.
 */

namespace AMP_WP_Compatibility_Suite\Inc\Plugin_Configs;

/**
 * Class Base
 */
abstract class Base {

	public function get_import_filename() {

		return '';
	}

	public function get_import_url() {

		return '';
	}

	public function get_cli_commands() {

		return [];
	}

	public function after_setup() {
	}

}