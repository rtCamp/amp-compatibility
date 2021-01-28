<?php
/**
 * Parameter for any instance.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Analyzer;

use AMP_WP_Dummy_Data_Generator\Inc\Strings;

class Parameter {

	/**
	 * Type of parameter.
	 * e.g. text, number, select, textarea, checkbox
	 *
	 * @var string
	 */
	public $type = '';

	/**
	 * Parameter format.
	 * e.g. email, url, color, date, time, email, tel
	 *
	 * @var string
	 */
	public $format = '';

	/**
	 * Parameter name.
	 *
	 * @var string
	 */
	public $name = '';

	/**
	 * Default value of parameter.
	 *
	 * @var int|string
	 */
	public $default = '';

	/**
	 * In case of number type. what can be minimum value.
	 *
	 * @var int
	 */
	public $min = '';

	/**
	 * In case of number type. what can be maximum value.
	 *
	 * @var int
	 */
	public $max = '';

	/**
	 * In incremental or decremental step in value.
	 *
	 * @var int
	 */
	public $step = '';

	/**
	 * List of possible values.
	 * As per module.
	 *
	 * @var array
	 */
	public $options = [];

	/**
	 * If parameter is optional.
	 *
	 * @var bool
	 */
	public $optional = false;

	/**
	 * If we can pass multiple value or not.
	 *
	 * @var bool
	 */
	protected $is_multiple = false;

	/**
	 * List of possible value after analyzing parameter.
	 *
	 * @var array
	 */
	public $possible_values = [];

	public $context = [];

	public function __construct( $options ) {

		if ( empty( $options['name'] ) ) {
			throw new \Exception( 'Please provide name of param' );
		}

		if ( empty( $options['type'] ) ) {
			throw new \Exception( 'Please provide type of param' );
		}

		$this->name     = ( ! empty( $options['name'] ) ) ? $options['name'] : '';
		$this->type     = ( ! empty( $options['type'] ) ) ? $options['type'] : '';
		$this->format   = ( ! empty( $options['format'] ) ) ? $options['format'] : '';
		$this->min      = ( ! empty( $options['min'] ) ) ? $options['min'] : 0;
		$this->max      = ( ! empty( $options['max'] ) ) ? $options['max'] : 0;
		$this->step     = ( ! empty( $options['step'] ) && 0 < intval( $options['step'] ) ) ? intval( $options['step'] ) : 1;
		$this->options  = ( ! empty( $options['options'] ) && is_array( $options['options'] ) ) ? array_values( array_filter( array_unique( $options['options'] ) ) ) : [];
		$this->optional = ( ! empty( $options['optional'] ) );

		// Default values
		if ( empty( $this->default ) ) {

			switch ( $this->type ) {
				case 'number':
					$this->default = $this->min;
					break;
				case 'select':
					$this->default = ( ! empty( $this->options[0] ) ) ? $this->options[0] : '';
					break;
			}

		}

		// Check for if accept multiple value.
		$this->check_for_multiple();

		$this->check_for_format();

		$this->check_for_context();

		// Set possible values.
		$this->set_possible_values();

	}

	protected function check_for_multiple() {

		$this->is_multiple = Strings::is_plural( $this->name );
	}

	protected function check_for_format() {

		if ( ! empty( $this->format ) || 'text' !== $this->type ) {
			return;
		}

		$snack_case_name  = Strings::convert_to_snack_case( $this->name );
		$possible_formats = [
			'color',
			'date',
			'email',
			'search',
			'tel',
			'time',
			'url',
			'week',
			'month',
		];

		foreach ( $possible_formats as $format ) {
			if ( false !== strpos( $snack_case_name, $format ) ) {
				$this->format = $format;

				return;
			}
		}

	}

	protected function check_for_context() {

		if ( 'text' !== $this->type ) {
			return;
		}

		$this->context = Context::get_context_from( $this->name );
	}

	protected function set_possible_values() {

		$possible_values = [];

		if ( ! empty( $this->default ) ) {
			$possible_values[] = $this->default;
		}

		$possible_values = array_merge( $possible_values, $this->options );

		switch ( $this->type ) {

			case 'textarea':
				$possible_values[] = Strings::get_dummy_content();
				break;
			case 'checkbox':
				$possible_values = array_merge( $possible_values, [ true, false ] );
				break;
			case 'number':
				if ( ! empty( $this->step ) && 0 < intval( $this->step ) && $this->min < $this->max ) {
					for ( $index = $this->min; $index <= $this->max; ( $index += $this->step ) ) {
						$possible_values[] = intval( $index );
					}
				}
				break;

		}

		$this->possible_values = array_values( array_unique( $possible_values ) );
	}

}
