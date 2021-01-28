<?php
/**
 * To analyze widget.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Analyzer;

use AMP_WP_Dummy_Data_Generator\Inc\Code_Parser;
use AMP_WP_Dummy_Data_Generator\Inc\DOM;

class Widget extends Base {

	public $name = '';

	public $type = 'widget';

	public $class_name;

	public $object;

	/**
	 * Widget constructor.
	 *
	 * @param \WP_Widget $widget_object
	 */
	public function __construct( $widget_object ) {

		$this->name       = $widget_object->name;
		$this->class_name = get_class( $widget_object );
		$this->object     = $widget_object;

		parent::__construct();
	}

	public function set_parameters() {

		$parameters = [];

		ob_start();
		$this->object->form( [] );
		$function_body = ob_get_clean();

		$dom    = new Dom( $function_body );
		$inputs = $dom->query( '//input | //textarea | //select' );

		foreach ( $inputs as $input ) {

			if ( empty( $input ) || ! is_a( $input, 'DOMElement' ) ) {
				continue;
			}

			$param_name = strtolower( trim( $input->getAttribute( 'name' ) ) );
			$param_name = str_replace( sprintf( 'widget-%s[%d]', $this->object->id_base, $this->object->number ), '', $param_name );
			$param_name = trim( $param_name, '[]' );

			if ( empty( $param_name ) ) {

				$param_name = strtolower( trim( $input->getAttribute( 'id' ) ) );
				$param_name = str_replace( sprintf( 'widget-%s-%d-', $this->object->id_base, $this->object->number ), '', $param_name );
				$param_name = trim( $param_name );

			}

			if ( ! empty( $parameters[ $param_name ] ) ) {
				$param = $parameters[ $param_name ];
			} else {
				$param = [ 'name' => $param_name ];
			}

			$param_type = strtolower( trim( $input->tagName ) );

			if ( 'input' === $param_type ) {
				$param_type = strtolower( trim( $input->getAttribute( 'type' ) ) );
			}

			if ( in_array( $param_type, [
				'hidden',
				'password',
				'submit',
				'reset',
				'file',
				'datetime-local',
			], true ) ) {
				continue;
			}

			$param['type'] = $param_type;

			switch ( $param_type ) {
				case 'color':
				case 'date':
				case 'email':
				case 'search':
				case 'tel':
				case 'time':
				case 'url':
				case 'week':
				case 'month':

					$param['format']  = $param_type;
					$param['type']    = 'text';
					$param['default'] = $input->getAttribute( 'value' );

					break;
				case 'checkbox':
					if ( $input->hasAttribute( 'checked' ) ) {
						$param['default'] = true;
					}
					break;
				case 'radio':
					$param['type'] = 'select';

					$param['options']   = ( ! empty( $param['options'] ) && is_array( $param['options'] ) ) ? $param['options'] : [];
					$param['options'][] = $input->getAttribute( 'value' );

					if ( $input->hasAttribute( 'checked' ) ) {
						$param['default'] = $input->getAttribute( 'value' );
					}

					break;
				case 'number':
				case 'range':

					$param['type'] = 'number';

					$attribute_text = [ 'max', 'min', 'step' ];

					$param['default'] = $input->getAttribute( 'value' );

					foreach ( $attribute_text as $text ) {
						$value          = intval( $input->getAttribute( $text ) );
						$param[ $text ] = ( ! empty( $value ) ) ? $value : null;
					}

					break;
				case 'select':

					$param['options'] = [];

					if ( $input->hasChildNodes() ) {

						for ( $index = 0; $index <= $input->childNodes->length; $index ++ ) {
							$option_dom = $input->childNodes->item( $index );

							if ( ! empty( $option_dom ) && is_a( $option_dom, 'DOMElement' ) ) {
								$param['options'][] = $option_dom->getAttribute( 'value' );

								if ( $option_dom->hasAttribute( 'selected' ) ) {
									$param['default'] = $option_dom->getAttribute( 'value' );
								}
							}
						}
					}
					break;
				default:
					$param['default'] = $input->getAttribute( 'value' );
			}

			$parameters[ $param['name'] ] = $param;
		}

		foreach ( $parameters as $name => $parameter ) {
			$this->parameters[ $name ] = new Parameter( $parameter );
		}

	}

	public function find_context() {

		$context_list = [
			$this->name,
		];

		foreach ( $context_list as $item ) {
			$context = Context::get_context_from( $item );
		}

		$this->context = $context;
	}

	public function set_possible_values() {

		foreach ( $this->parameters as $name => $parameter ) {

			if ( ! empty( $parameter->possible_values ) && is_array( $parameter->possible_values ) ) {
				continue;
			}

			$context = [];

			if ( ! empty( $parameter->context->type ) ) {
				$context = $parameter->context;
			} elseif ( ! empty( $this->context->type ) ) {
				$context = $this->context;
			}

			if ( ! empty( $context ) && is_a( $context, 'AMP_WP_Dummy_Data_Generator\Inc\Analyzer\Context' ) ) {
				$this->parameters[ $name ]->possible_values = $context->get_values();
			}


		}

	}

}
