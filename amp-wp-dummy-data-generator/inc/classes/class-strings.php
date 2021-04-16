<?php
/**
 * Utility function for string.
 *
 * @package amp-wp-dummuy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

/**
 * String related helper class.
 */
class Strings {

	/**
	 * Returns whether the given string is plural or not.
	 *
	 * @param string $string The string to check.
	 *
	 * @return bool True if the string is plural, and False if it is not.
	 */
	public static function is_plural( $string ) {

		if ( empty( $string ) || ! is_string( $string ) ) {
			return false;
		}

		$string = static::convert_to_snack_case( $string );

		$string_segments = explode( '_', $string );

		$last_segment = array_pop( $string_segments );
		$last_segment = strtolower( $last_segment );

		if ( 'ies' === substr( $last_segment, - 3 ) ||
			'es' === substr( $last_segment, - 2 ) ||
			's' === substr( $last_segment, - 1 )
		) {
			return true;
		}

		return false;
	}

	/**
	 * Converts a given string to snake case.
	 *
	 * @param string $string The string to convert.
	 *
	 * @return  string The converted string in snake case.
	 */
	public static function convert_to_snack_case( $string ) {

		if ( empty( $string ) || ! is_string( $string ) ) {
			return false;
		}

		/**
		 * Ref: https://regex101.com/r/Ft57oO/24
		 */
		$regex = '/(?<!^)[A-Z]{1,}/m';

		return strtolower( preg_replace( $regex, '_$0', $string ) );

	}

	/**
	 * Generates dummy content.
	 *
	 * @param int $limit Number of characters to generate.
	 *
	 * @return string Generated dummy content.
	 */
	public static function get_dummy_content( $limit = 512 ) {

		$file_name = wp_rand( 1, 10 );
		$file_name = "$file_name.txt";
		$file_path = implode(
			DIRECTORY_SEPARATOR,
			[
				AMP_WP_DUMMY_DATA_GENERATOR_PATH,
				'data',
				'content',
				$file_name,
			]
		);

		$content       = file_get_contents( $file_path );
		$content_lines = explode( "\n", $content );
		$response      = '';

		foreach ( $content_lines as $content_line ) {

			if ( $limit > strlen( $response ) + strlen( $content_line ) ) {
				$response .= "\n" . $content_line;
			}
		}

		return trim( $response, "\n" );
	}
}
