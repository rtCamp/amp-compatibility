<?php
/**
 * Autoloader file for plugin.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Helpers;

/**
 * Auto loader function.
 *
 * @param string $resource Source namespace.
 *
 * @return void
 */
function autoloader( $resource = '' ) {

	$resource_path  = false;
	$namespace_root = 'AMP_WP_Dummy_Data_Generator\\';
	$resource       = trim( $resource, '\\' );

	if ( empty( $resource ) || strpos( $resource, '\\' ) === false || strpos( $resource, $namespace_root ) !== 0 ) {
		// Not our namespace, bail out.
		return;
	}

	// Remove our root namespace.
	$resource = str_replace( $namespace_root, '', $resource );

	$path = explode(
		'\\',
		str_replace( '_', '-', strtolower( $resource ) )
	);

	/**
	 * Time to determine which type of resource path it is,
	 * so that we can deduce the correct file path for it.
	 */
	if ( empty( $path[0] ) || empty( $path[1] ) ) {
		return;
	}

	$directory = '';
	$file_name = '';

	if ( 'inc' === $path[0] ) {

		switch ( $path[1] ) {
			case 'traits':
				$directory = 'traits';
				$file_name = sprintf( 'trait-%s', trim( strtolower( $path[2] ) ) );
				break;

			case 'post-types':
			case 'taxonomies':
			case 'blocks':
			case 'meta-boxes':
			case 'widgets':
			case 'cli':
			case 'generator':
				/**
				 * If there is class name provided for specific directory then load that.
				 * otherwise find in inc/ directory.
				 */
				if ( ! empty( $path[2] ) ) {
					$directory = sprintf( 'classes/%s', $path[1] );
					$file_name = sprintf( 'class-%s', trim( strtolower( $path[2] ) ) );
					break;
				}
				// Need to run default, when if condition fails above.
			default:
				$directory = 'classes';
				$file_name = sprintf( 'class-%s', trim( strtolower( $path[1] ) ) );
				break;
		}

		$resource_path = sprintf( '%s/inc/%s/%s.php', untrailingslashit( AMP_WP_DUMMY_DATA_GENERATOR_PATH ), $directory, $file_name );

	}

	$resource_path_valid = validate_file( $resource_path );
	// For Windows platform, validate_file returns 2 so we've added this condition as well.
	if ( ! empty( $resource_path ) && file_exists( $resource_path ) && ( 0 === $resource_path_valid || 2 === $resource_path_valid ) ) {
		// We are already making sure that the file exists and it's valid.
		require_once( $resource_path ); // phpcs:ignore
	}

}

spl_autoload_register( '\AMP_WP_Dummy_Data_Generator\Inc\Helpers\autoloader' );
