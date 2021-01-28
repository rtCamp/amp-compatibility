<?php
/**
 * Helper function to parser code.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

class Code_Parser {

	/**
	 * To get instance of method/function.
	 *
	 * @param string $function_or_class Function or class name.
	 * @param string $function          Function or name of method of class.
	 *
	 * @throws \ReflectionException
	 *
	 * @return \ReflectionFunction|\ReflectionMethod|string
	 */
	private static function get_method_instance( string $function_or_class, string $function = '' ) {

		if ( empty( $function_or_class ) || ! is_string( $function_or_class ) ) {
			return '';
		}

		$method_instance = '';
		$class           = '';

		if ( ! empty( $function ) && is_string( $function ) ) {
			$class = $function_or_class;
		} else {
			$function = $function_or_class;
		}


		if ( ! empty( $class ) && class_exists( $class ) ) {
			$class = new \ReflectionClass( $class );

			if ( $class->hasMethod( $function ) ) {
				$method_instance = $class->getMethod( $function );

			}

		} elseif ( function_exists( $function ) ) {
			$method_instance = new \ReflectionFunction( $function );
		}

		if ( ! empty( $method_instance ) &&
		     ( is_a( $method_instance, 'ReflectionMethod' ) || is_a( $method_instance, 'ReflectionFunction' ) )
		) {
			return $method_instance;
		}

		return '';
	}

	/**
	 * To get the function definition.
	 *
	 * @param string $function_or_class Function or class name.
	 * @param string $function          Function or name of method of class.
	 *
	 * @throws \ReflectionException
	 *
	 * @return string
	 */
	public static function get_function_body( string $function_or_class, string $function = '' ) {

		$method_instance = static::get_method_instance( $function_or_class, $function );

		if ( empty( $method_instance ) ) {
			return '';
		}

		$filename      = $method_instance->getFileName();
		$start_line    = $method_instance->getStartLine() - 1;
		$end_line      = $method_instance->getEndLine();
		$length        = $end_line - $start_line;
		$source        = file( $filename );
		$function_body = implode( '', array_slice( $source, $start_line, $length ) );

		return $function_body;
	}

	/**
	 * To get the function parameters.
	 *
	 * @param string $function_or_class Function or class name.
	 * @param string $function          Function or name of method of class.
	 *
	 * @throws \ReflectionException
	 *
	 * @return array|\ReflectionParameter[]
	 */
	public static function get_function_parameters( string $function_or_class, string $function = '' ) {

		$method_instance = static::get_method_instance( $function_or_class, $function );

		if ( empty( $method_instance ) ) {
			return [];
		}

		return $method_instance->getParameters();
	}


	public static function get_php_code( string $code_body, bool $start_with_php = false ) {

		if ( empty( $code_body ) ) {
			return [];
		}

		if ( $start_with_php ) {
			$code_body = '<?php ' . $code_body;
		}

		/**
		 * Reference: https://regex101.com/r/6m14g0/1
		 */
		$regex = '/<\?php(.+)\?>|<\?php(.+)$/sUim';

		preg_match_all( $regex, $code_body, $matches );

		$matches[1] = ( ! empty( $matches[1] ) && is_array( $matches[1] ) ) ? array_values( $matches[1] ) : [];
		$matches[2] = ( ! empty( $matches[2] ) && is_array( $matches[2] ) ) ? array_values( $matches[2] ) : [];

		$codes = array_merge( $matches[1], $matches[2] );
		$codes = array_filter( $codes );

		return $codes;
	}

	public static function get_function_call_text( $function_in_text, $code_body ) {

		if ( empty( $function_in_text ) || empty( $code_body ) ) {
			return '';
		}

		/**
		 * Reference: https://regex101.com/r/Yv5wiR/1
		 */
		$regex = '/' . $function_in_text . '\((.+)\);/msU';

		preg_match( $regex, $code_body, $matches );

		return ( ! empty( $matches[0] ) ) ? $matches[0] : '';
	}

	//public static function
}