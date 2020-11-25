<?php
/**
 * Base class for wp-cli
 */

namespace AMP_WP_Compatibility_Suite\Inc\WP_CLI;

use function WP_CLI\Utils\get_flag_value;

/**
 * Check if 'WPCOM_VIP_CLI_Command' class is exists or not.
 * If exists then extend that otherwise WordPress's default class.
 */
if ( class_exists( 'WPCOM_VIP_CLI_Command' ) ) {
	abstract class WP_DAM_CLI_Base extends \WPCOM_VIP_CLI_Command {} // phpcs:ignore Squiz.Commenting.ClassComment.Missing
} else {
	abstract class WP_DAM_CLI_Base extends \WP_CLI_Command {} // phpcs:ignore
}

/**
 * Class Base
 */
class Base extends WP_DAM_CLI_Base { // phpcs:ignore

	/**
	 * Associative arguments.
	 *
	 * @var array
	 */
	protected $assoc_args = [];

	/**
	 * Dry run command.
	 *
	 * @var bool
	 */
	public $dry_run = true;

	/**
	 * Log file.
	 *
	 * @var string Log file.
	 */
	public $log_file = '';

	/**
	 * Logs to show or hide.
	 *
	 * @var bool
	 */
	public $logs = false;

	/**
	 * Function to extract arguments.
	 *
	 * @param array $assoc_args Associative arguments.
	 *
	 * @return void
	 */
	protected function extract_args( $assoc_args ) {

		$assoc_args = ( ! empty( $assoc_args ) && is_array( $assoc_args ) ) ? $assoc_args : [];

		$this->assoc_args = $assoc_args;
		$this->log_file   = filter_var( get_flag_value( $assoc_args, 'log-file' ), FILTER_SANITIZE_STRING );
		$this->logs       = filter_var( get_flag_value( $assoc_args, 'logs', true ), FILTER_VALIDATE_BOOLEAN );
		$this->dry_run    = filter_var( get_flag_value( $assoc_args, 'dry-run', true ), FILTER_VALIDATE_BOOLEAN );

	}

	/**
	 * Method to add a log entry and to output message on screen.
	 *
	 * @param string $message      Message to add to log and to output on screen.
	 * @param int    $message_type Message type - 0 for normal line, -1 for error, 1 for success, 2 for warning.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	protected function write_log( $message, $message_type = 0 ) {

		$message_type = intval( $message_type );

		if ( ! in_array( $message_type, [ -1, 0, 1, 2 ], true ) ) {
			$message_type = 0;
		}

		$message_prefix = '';

		// Message prefix for use in log file.
		switch ( $message_type ) {

			case -1:
				$message_prefix = 'Error: ';
				break;

			case 1:
				$message_prefix = 'Success: ';
				break;

			case 2:
				$message_prefix = 'Warning: ';
				break;

		}

		// Log message to log file if a log file.
		if ( ! empty( $this->log_file ) ) {
			file_put_contents( $this->log_file, $message_prefix . $message . "\n", FILE_APPEND ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_file_put_contents
		}

		if ( ! empty( $this->logs ) ) {

			switch ( $message_type ) {

				case -1:
					\WP_CLI::error( $message );
					break;

				case 1:
					\WP_CLI::success( $message );
					break;

				case 2:
					\WP_CLI::warning( $message );
					break;

				case 0:
				default:
					\WP_CLI::line( $message );
					break;

			}
		}

	}

	/**
	 * Method to log an error message and stop the script from running further
	 *
	 * @param string $message Message to add to log and to outout on screen.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	protected function error( $message ) {
		$this->write_log( $message, -1 );
	}

	/**
	 * Method to log a success message
	 *
	 * @param string $message Message to add to log and to outout on screen.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	protected function success( $message ) {
		$this->write_log( $message, 1 );
	}

	/**
	 * Method to log a warning message
	 *
	 * @param string $message Message to add to log and to outout on screen.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @return void
	 */
	protected function warning( $message ) {
		$this->write_log( $message, 2 );
	}

	/**
	 * Convert csv to array.
	 *
	 * @param string $filename  CSV file.
	 * @param string $delimiter CSV file delimiter.
	 * @param array  $header    Header of CSV file.
	 *
	 * @throws \WP_CLI\ExitException WP CLI Exit Exception.
	 *
	 * @link   http://gist.github.com/385876
	 *
	 * @return array $data
	 */
	protected function csv_to_array( $filename = '', $delimiter = ',', $header = [] ) {

		if ( ! file_exists( $filename ) || ! is_readable( $filename ) ) {
			return [];
		}

		$data = array();

		$handle = fopen( $filename, 'r' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen

		if ( false === $handle ) {
			$this->write_log( 'Please pass a valid .csv file in command.' );

			return [];
		}

		$index = 0;

		while ( ( $row = fgetcsv( $handle, 10000, $delimiter ) ) !== false ) { // @codingStandardsIgnoreLine

			$index++;

			if ( empty( $header ) ) {
				$header = array_map( 'self::sanitize_text', $row );
			} else {
				$data[] = array_combine( $header, $row );
			}
		}

		fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose

		return $data;
	}

	/**
	 * To sanitize text.
	 *
	 * @param string $text string to sanitize.
	 *
	 * @return string Sanitized string.
	 */
	public static function sanitize_text( $text ) {

		// Replace non letter or digits by "-".
		$text = preg_replace( '~[^\pL\d]+~u', '_', $text );

		// Transliterate.
		$text = iconv( 'utf-8', 'us-ascii//TRANSLIT', $text );

		// Remove unwanted characters.
		$text = preg_replace( '~[^-\w]+~', '', $text );

		// Trim.
		$text = trim( $text, '-' );

		// Remove duplicate "-".
		$text = preg_replace( '~-+~', '-', $text );

		// Lowercase.
		$text = strtolower( $text );

		if ( empty( $text ) ) {
			return 'n-a';
		}

		return $text;
	}

	/**
	 * Possibly rotate a file
	 *
	 * Useful for rotating log files
	 *
	 * @param string $file          The file to possibly rotate. Should be an absolute path.
	 * @param int    $max_file_size The max filesize each file should be.
	 *                              When set to 0, this function simply rotates
	 *                              existing log files regardless of size.
	 *
	 * @return string New file name (or old if it didn't rotate out)
	 */
	protected function possibly_rotate_file( $file = '', $max_file_size = 0 ) {

		if ( ! empty( $file ) && file_exists( $file ) ) {

			clearstatcache();

			if ( filesize( $file ) > $max_file_size ) {

				$i = 1;

				do {
					$rotated_file_name = $file . '.' . $i;
					$i ++;
				} while (
					file_exists( $rotated_file_name )
				);

				rename( $file, $rotated_file_name ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_rename

				$this->file_rotated = true;

				return $rotated_file_name;
			}
		}

		return $file;
	}

	/**
	 * Write data to a CSV file
	 *
	 * @param string $file           The full/absolute path to the csv file to create.
	 * @param array  $column_headers An *optional* array of csv column headers.
	 * @param array  $data           An array of data to write to the CSV. Each row to a line.
	 * @param null   $callback       An *optional* callback function to adjust the data being written to the csv lines.
	 * @param string $fopen_mode     What mode should the CSV be created with? Defaults to 'w' for write-only mode.
	 *
	 * @return string|bool Written filename on success, false on failure.
	 */
	protected function write_to_csv( $file = '', $column_headers = array(), $data = array(), $callback = null, $fopen_mode = 'w' ) {

		if ( ! is_string( $file ) || empty( $file ) ) {
			return false;
		}

		if ( ! is_array( $data ) || empty( $data ) ) {
			return false;
		}

		/**
		 * Rename an existing log file if it exists already.
		 * We don't want to overwrite existing logs.
		 * Only do this when writing to a CSV i.e. Not when a CSV is being appended to.
		 */
		if ( 'w' === $fopen_mode ) {
			$this->possibly_rotate_file( $file );
		}

		$csv = fopen( $file, $fopen_mode ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen

		// Only create column headers if they've been provided.
		if ( ! empty( $column_headers ) && is_array( $column_headers ) ) {
			fputcsv( $csv, $column_headers ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_fputcsv
		}

		$put_success = false;

		foreach ( $data as $key => $value ) {

			$csv_data = $value;

			// Optionally run the data through a callback function on-the-fly.
			// helpful for writing out data in multi-dimensional arrays.
			if ( ! empty( $callback ) && is_callable( $callback ) ) {
				$csv_data = call_user_func( $callback, $key, $value );
			}

			$put_success = fputcsv( $csv, (array) $csv_data ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.file_ops_fputcsv
		}

		fclose( $csv ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose

		if ( false !== $put_success ) {

			// Return the filename on success.
			return $file;

		} else {
			return false;
		}
	}

	/**
	 * Clear all of the caches for memory management.
	 *
	 * @return void
	 */
	protected function stop_the_insanity() {

		if ( method_exists( get_parent_class( __CLASS__ ), 'stop_the_insanity' ) ) {
			parent::stop_the_insanity();
		}

	}

	/**
	 * Disable term counting so that terms are not all recounted after every term operation.
	 *
	 * @return void
	 */
	protected function start_bulk_operation() {

		if ( method_exists( get_parent_class( __CLASS__ ), 'start_bulk_operation' ) ) {
			parent::start_bulk_operation();
		} else {
			// Disable term count updates for speed.
			wp_defer_term_counting( true );
		}

	}

	/**
	 * Re-enable Term counting and trigger a term counting operation to update all term counts.
	 *
	 * @return void
	 */
	protected function end_bulk_operation() {

		if ( method_exists( get_parent_class( __CLASS__ ), 'end_bulk_operation' ) ) {
			parent::end_bulk_operation();
		} else {
			// This will also trigger a term count.
			wp_defer_term_counting( false );
		}

	}


}
