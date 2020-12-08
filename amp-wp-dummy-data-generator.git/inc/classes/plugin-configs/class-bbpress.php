<?php
/**
 * Woocommerce config file.
 */

namespace WP_CLI_Test_Data\Inc\Plugin_Configs;

class Bbpress extends Base {

	public function get_import_filename() {

		return 'bbpress-unit-test-data.xml';
	}

	public function get_import_url() {

		return 'https://bbpress.trac.wordpress.org/raw-attachment/ticket/2516/bbpress-unit-test-data.xml';
	}

}