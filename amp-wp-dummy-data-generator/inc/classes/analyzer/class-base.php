<?php
/**
 * Base class for analyzer.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Analyzer;

abstract class Base {

	public $name = '';

	public $type = '';

	public $context = [];

	/**
	 * List of parameters.
	 *
	 * @var array
	 */
	public $parameters;

	public $variants = [];

	public function __construct() {

		$this->parameters = [];

		$this->set_parameters();

		$this->find_context();

		$this->set_possible_values();
	}

	abstract protected function set_parameters();

	abstract protected function find_context();

}
