<?php
/**
 * WP CLI Command to send API data.
 *
 * @package amp-send-data
 */

use function WP_CLI\Utils\get_flag_value;

define( 'AMP_SEND_DATA_SERVER_ENDPOINT', 'https://test-amp-comp-db.uc.r.appspot.com/api/v1/amp-wp' );

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

\WP_CLI::add_command( 'amp-send-data', function ( $args = [], $assoc_args = [] ) {

	$is_print = filter_var( get_flag_value( $assoc_args, 'print' ), FILTER_SANITIZE_STRING );

	$data = AMP_Prepare_Data::get_data();

	if ( $is_print ) {
		$print = strtolower( trim( $is_print ) );
		if ( 'json' === $print ) {
			print_r( wp_json_encode( $data ) . PHP_EOL );
		} elseif ( 'json-pretty' === $print ) {
			print_r( wp_json_encode( $data, JSON_PRETTY_PRINT ) . PHP_EOL );
		} else {
			print_r( $data );
		}

		return;
	}

	$response = wp_remote_post(
		AMP_SEND_DATA_SERVER_ENDPOINT,
		[
			'method'   => 'POST',
			'timeout'  => 600,
			'body'     => $data,
			'compress' => true,
		]
	);

	if ( is_wp_error( $response ) ) {
		$error_message = $response->get_error_message();
		WP_CLI::error( "Something went wrong: $error_message" );
	} else {

		$body = wp_remote_retrieve_body( $response );
		WP_CLI::success( $body );
	}
} );

class AMP_Prepare_Data {

	public static function get_data() {

		$amp_urls = static::get_amp_urls();

		$domain = strtolower( wp_parse_url( home_url(), PHP_URL_HOST ) );
		$domain = str_replace( [ 'www.' ], [ '' ], $domain );

		$amp_settings = get_option( 'amp-options' );
		$amp_settings = ( ! empty( $amp_settings ) && is_array( $amp_settings ) ) ? $amp_settings : [];

		$request_data = [
			'site_url'                   => $domain,
			'site_info'                  => static::get_site_info(),
			'amp_settings'               => $amp_settings,
			'site_health'                => static::get_site_health(),
			'plugins'                    => static::get_plugin_info(),
			'themes'                     => [
				static::normalize_theme_info( wp_get_theme() ),
			],
			'errors'                     => array_values( static::get_errors() ),
			'error_sources'              => array_values( $amp_urls['error_sources'] ),
			'amp_validated_environments' => array_values( $amp_urls['amp_validated_environments'] ),
			'urls'                       => array_values( $amp_urls['urls'] ),
		];

		return $request_data;
	}

	protected static function get_site_info() {

		$wp_type = 'single';

		if ( is_multisite() ) {
			$wp_type = ( defined( 'SUBDOMAIN_INSTALL' ) && SUBDOMAIN_INSTALL ) ? 'subdomain' : 'subdir';
		}

		return [
			'site_url'      => wp_parse_url( home_url(), PHP_URL_HOST ),
			'site_title'    => get_bloginfo( 'site_title' ),
			'php_version'   => phpversion(),
			'mysql_version' => '',
			'wp_version'    => get_bloginfo( 'version' ),
			'wp_type'       => $wp_type, // single, subdomain, subdir
			'platform'      => '', // vip, vipgo
		];
	}

	public static function get_site_health() {

		if ( ! class_exists( 'Health_Check' ) ) {
			return [];
		}

		$health_check_instance     = new Health_Check();
		$health_check_js_variables = [
			'site_status' => [
				'direct' => [],
				'async'  => [],
				'issues' => [
					'good'        => 0,
					'recommended' => 0,
					'critical'    => 0,
				],
			],
		];

		$issue_counts = get_transient( 'health-check-site-status-result' );

		if ( false !== $issue_counts ) {
			$issue_counts = json_decode( $issue_counts );

			$health_check_js_variables['site_status']['issues'] = $issue_counts;
		}

		$tests = Health_Check_Site_Status::get_tests();

		// Don't run https test on localhost
		if ( 'localhost' === preg_replace( '|https?://|', '', get_site_url() ) ) {
			unset( $tests['direct']['https_status'] );
		}

		foreach ( $tests['direct'] as $test ) {
			if ( is_string( $test['test'] ) ) {
				$test_function = sprintf(
					'get_test_%s',
					$test['test']
				);

				if ( method_exists( $health_check_instance, $test_function ) && is_callable( array(
						$health_check_instance,
						$test_function,
					) ) ) {
					/**
					 * Filter the output of a finished Site Health test.
					 *
					 * @param array  $test_result {
					 *                            An associated array of test result data.
					 *
					 * @param string $label       A label describing the test, and is used as a header in the output.
					 * @param string $status      The status of the test, which can be a value of `good`, `recommended` or `critical`.
					 * @param array  $badge       {
					 *                            Tests are put into categories which have an associated badge shown, these can be modified and assigned here.
					 *
					 * @param string $label       The test label, for example `Performance`.
					 * @param string $color       Default `blue`. A string representing a color to use for the label.
					 *                            }
					 * @param string $description A more descriptive explanation of what the test looks for, and why it is important for the end user.
					 * @param string $actions     An action to direct the user to where they can resolve the issue, if one exists.
					 * @param string $test        The name of the test being ran, used as a reference point.
					 *                            }
					 *
					 * @since 5.3.0
					 *
					 */
					$health_check_js_variables['site_status']['direct'][] = apply_filters( 'site_status_test_result', call_user_func( array(
						$health_check_instance,
						$test_function,
					) ) );
					continue;
				}
			}

			if ( is_callable( $test['test'] ) ) {
				$health_check_js_variables['site_status']['direct'][] = apply_filters( 'site_status_test_result', call_user_func( $test['test'] ) );
			}
		}

		foreach ( $tests['async'] as $test ) {
			if ( is_string( $test['test'] ) ) {
				$health_check_js_variables['site_status']['async'][] = array(
					'test'      => $test['test'],
					'completed' => false,
				);
			}
		}

		return $health_check_js_variables;
	}

	protected static function get_plugin_info() {

		$all_plugins       = get_plugins();
		$all_plugins_files = array_keys( $all_plugins );

		$plugin_info = array_map( 'AMP_Prepare_Data::normalize_plugin_info', $all_plugins_files );

		return $plugin_info;
	}

	protected static function normalize_plugin_info( $plugin_file ) {

		$absolute_plugin_file = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_file;
		$plugin_data          = get_plugin_data( $absolute_plugin_file );

		$slug = explode( '/', $plugin_file );
		$slug = $slug[0];

		$amp_options        = get_option( 'amp-options' );
		$suppressed_plugins = ( ! empty( $amp_options['suppressed_plugins'] ) && is_array( $amp_options['suppressed_plugins'] ) ) ? $amp_options['suppressed_plugins'] : [];

		$suppressed_plugin_list = array_keys( $suppressed_plugins );

		return [
			'name'              => $plugin_data['Name'],
			'slug'              => $slug,
			'plugin_url'        => $plugin_data['PluginURI'],
			'version'           => $plugin_data['Version'],
			'author'            => $plugin_data['AuthorName'],
			'author_url'        => $plugin_data['AuthorURI'],
			'requires_wp'       => $plugin_data['RequiresWP'],
			'requires_php'      => $plugin_data['RequiresPHP'],
			'file'              => $plugin_file,
			'is_active'         => is_plugin_active( $plugin_file ),
			'is_network_active' => is_plugin_active_for_network( $plugin_file ),
			'is_suppressed'     => in_array( $slug, $suppressed_plugin_list, true ) ? $suppressed_plugins[ $slug ]['last_version'] : "",
		];

	}

	protected static function normalize_theme_info( $theme_object ) {

		if ( empty( $theme_object ) || ! is_a( $theme_object, 'WP_Theme' ) ) {
			return [];
		}

		$active_theme      = wp_get_theme();
		$active_theme_slug = '';

		if ( ! empty( $active_theme ) && is_a( $active_theme, 'WP_Theme' ) ) {
			$active_theme_slug = $active_theme->get_stylesheet();
		}

		$theme_data = [
			'name'         => $theme_object->get( 'Name' ),
			'slug'         => $theme_object->get_stylesheet(),
			'version'      => $theme_object->get( 'Version' ),
			'status'       => $theme_object->get( 'Status' ),
			'tags'         => $theme_object->get( 'Tags' ),
			'text_domain'  => $theme_object->get( 'TextDomain' ),
			'requires_wp'  => $theme_object->get( 'RequiresWP' ),
			'requires_php' => $theme_object->get( 'RequiresPHP' ),
			'theme_url'    => $theme_object->get( 'ThemeURI' ),
			'author'       => $theme_object->get( 'Author' ),
			'author_url'   => $theme_object->get( 'AuthorURI' ),
			'source'       => '', // wp_org, github, custom
			'is_active'    => ( $theme_object->get_stylesheet() === $active_theme_slug ),
			'parent_theme' => ( $theme_object->parent() ) ? self::normalize_theme_info( $theme_object->parent() ) : [],
		];

		return $theme_data;
	}

	protected static function get_errors() {

		$amp_error_terms = get_terms(
			[
				'taxonomy'        => 'amp_validation_error',
				'hide_empty'      => true,
				'suppress_filter' => true,
			]
		);

		$error_data = [];

		foreach ( $amp_error_terms as $error_term ) {

			if ( empty( $error_term ) || ! is_a( $error_term, 'WP_Term' ) ) {
				continue;
			}

			$description  = strtolower( trim( $error_term->description ) );
			$description  = static::remove_domain( $description );
			$error_detail = json_decode( $description, true );

			$error_detail['text'] = ( ! empty( $error_detail['text'] ) ) ? trim( $error_detail['text'] ) : '';

			/**
			 * Generate new slug after removing site specific data.
			 */
			$term_slug = static::generate_hash( $error_detail );

			$error_detail['_slug'] = $term_slug;
			$error_detail['text']  = ( ! empty( $error_detail['text'] ) ) ? esc_html( $error_detail['text'] ) : '';

			/**
			 * Keep the slug as key to quickly get error detail.
			 */
			$error_data[ $error_term->slug ] = $error_detail;
		}

		/**
		 * Remove duplicate data.
		 */
		$error_data = array_map( 'unserialize', array_unique( array_map( 'serialize', $error_data ) ) );

		return $error_data;
	}

	protected static function get_amp_urls() {

		global $wpdb;

		$query           = "SELECT ID, post_title, post_content FROM $wpdb->posts WHERE post_type='amp_validated_url'";
		$amp_error_posts = $wpdb->get_results( $query );

		// To Store all error_sources data.
		$all_sources = [];

		// To store all environment data.
		$all_amp_validated_environments = [];

		// To store all AMP validated URls
		$amp_invalid_urls = [];

		$error_data  = static::get_errors();
		$plugin_info = static::get_plugin_info();

		$plugin_versions = [];

		foreach ( $plugin_info as $item ) {
			$plugin_versions[ $item['slug'] ] = $item['version'];
		}

		/**
		 * Process each post.
		 *
		 * Post ==> Errors => sources
		 */
		foreach ( $amp_error_posts as $amp_error_post ) {

			if ( empty( $amp_error_post ) ) {
				continue;
			}

			$post_errors_raw = json_decode( $amp_error_post->post_content, true );
			$post_errors     = [];

			/**
			 * Process individual error in each post
			 */
			foreach ( $post_errors_raw as $error ) {

				$_error_slug = $error_data[ $error['term_slug'] ]['_slug'];

				$sources            = ( ! empty( $error['data']['sources'] ) ) ? $error['data']['sources'] : [];
				$post_error_sources = [];

				/**
				 * Process each error_source of errors
				 */
				foreach ( $sources as $index => $source ) {

					if ( ! empty( $source['type'] ) ) {
						if ( 'plugin' === $source['type'] ) {
							$sources[ $index ]['version'] = $plugin_versions[ $source['name'] ];
						} elseif ( 'theme' === $source['type'] ) {
							$sources[ $index ]['version'] = '';
						}
					}

					if ( isset( $sources[ $index ]['text'] ) ) {
						$sources[ $index ]['text'] = strtolower( trim( $sources[ $index ]['text'] ) );
						$sources[ $index ]['text'] = static::remove_domain( $sources[ $index ]['text'] );
					}

					$source_slug                      = self::generate_hash( $sources[ $index ] );
					$sources[ $index ]['_slug']       = $source_slug;
					$sources[ $index ]['_error_slug'] = $_error_slug;
					$post_error_sources[]             = $source_slug;

					// Store in all source.
					$all_sources[ $source_slug ] = $sources[ $index ];
				}

				$post_errors[] = [
					'_error_slug' => $_error_slug,
					'sources'     => array_values( $post_error_sources ),
				];
			}

			$amp_validated_environment          = get_post_meta( $amp_error_post->ID, '_amp_validated_environment', true );
			$amp_validated_environment_slug     = static::generate_hash( $amp_validated_environment );
			$amp_validated_environment['_slug'] = $amp_validated_environment_slug;

			// Store in all amp validation environments.
			$all_amp_validated_environments[ $amp_validated_environment_slug ] = $amp_validated_environment;

			$amp_invalid_urls[] = [
				'url'                             => $amp_error_post->post_title,
				'_amp_validated_environment_slug' => $amp_validated_environment['_slug'],
				'errors'                          => $post_errors,
			];
		}

		return [
			'error_sources'              => $all_sources,
			'amp_validated_environments' => $all_amp_validated_environments,
			'urls'                       => $amp_invalid_urls,
		];
	}

	protected static function remove_domain( $content ) {

		if ( empty( $content ) ) {
			return '';
		}

		$domain = strtolower( wp_parse_url( home_url(), PHP_URL_HOST ) );
		$domain = str_replace( [ 'www.', '.' ], [ '', '\.' ], $domain );

		/**
		 * Reference: https://regex101.com/r/JHc0Mt/1
		 */
		$regex = "/http[s]?:\\\\{0,5}\/\\\\{0,5}\/(www\.)?$domain/mU";

		$content = preg_replace( $regex, '', $content );

		return $content;
	}

	protected static function generate_hash( $object ) {

		if ( empty( $object ) ) {
			return '';
		}

		if ( is_string( $object ) ) {
			$hash = md5( trim( $object ) );
		} elseif ( is_array( $object ) ) {
			ksort( $object );
			$object = wp_json_encode( $object );
			$hash   = md5( trim( $object ) );
		}


		return $hash;
	}

}
