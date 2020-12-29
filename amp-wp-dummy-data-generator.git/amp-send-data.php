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

/**
 * Class AMP_Prepare_Data
 */
class AMP_Prepare_Data {

	/**
	 * To get amp data to send it to compatibility server.
	 *
	 * @return array
	 */
	public static function get_data() {

		$amp_urls = static::get_amp_urls();

		$request_data = [
			'site_url'                   => static::get_home_url(),
			'site_info'                  => static::get_site_info(),
			'plugins'                    => static::get_plugin_info(),
			'themes'                     => static::get_theme_info(),
			'errors'                     => array_values( static::get_errors() ),
			'error_sources'              => array_values( $amp_urls['error_sources'] ),
			'amp_validated_environments' => array_values( $amp_urls['amp_validated_environments'] ),
			'urls'                       => array_values( $amp_urls['urls'] ),
		];

		return $request_data;
	}

	/**
	 * To get site info.
	 *
	 * @return array Site information.
	 */
	protected static function get_site_info() {

		$wp_type = 'single';

		if ( is_multisite() ) {
			$wp_type = ( defined( 'SUBDOMAIN_INSTALL' ) && SUBDOMAIN_INSTALL ) ? 'subdomain' : 'subdir';
		}

		global $_wp_using_ext_object_cache;

		$active_theme = wp_get_theme();
		$active_theme = static::normalize_theme_info( $active_theme );

		$amp_settings = get_option( 'amp-options' );
		$amp_settings = ( ! empty( $amp_settings ) && is_array( $amp_settings ) ) ? $amp_settings : [];

		$loopback_status = '';

		if ( class_exists( 'Health_Check_Loopback' ) ) {
			$loopback_status = Health_Check_Loopback::can_perform_loopback();
			$loopback_status = ( ! empty( $loopback_status->status ) ) ? $loopback_status->status : '';
		}

		$site_info = [
			'site_url'                     => static::get_home_url(),
			'site_title'                   => get_bloginfo( 'site_title' ),
			'php_version'                  => phpversion(),
			'mysql_version'                => '',
			'wp_version'                   => get_bloginfo( 'version' ),
			'wp_language'                  => get_bloginfo( 'language' ),
			'wp_https_status'              => is_ssl(),
			'wp_multisite'                 => $wp_type,
			'wp_active_theme'              => $active_theme,
			'object_cache_status'          => ( ! empty( $_wp_using_ext_object_cache ) ) ? true : false,
			'libxml_version'               => ( defined( 'LIBXML_VERSION' ) ) ? LIBXML_VERSION : '',
			'is_defined_curl_multi'        => ( function_exists( 'curl_multi_init' ) ),
			'stylesheet_transient_caching' => '',
			'loopback_requests'            => $loopback_status,
			'amp_mode'                     => ( ! empty( $amp_settings['theme_support'] ) ) ? $amp_settings['theme_support'] : '',
			'amp_version'                  => ( ! empty( $amp_settings['version'] ) ) ? $amp_settings['version'] : '',
			'amp_plugin_configured'        => ( ! empty( $amp_settings['plugin_configured'] ) ) ? true : false,
			'amp_all_templates_supported'  => ( ! empty( $amp_settings['all_templates_supported'] ) ) ? true : false,
			'amp_supported_post_types'     => ( ! empty( $amp_settings['supported_post_types'] ) && is_array( $amp_settings['supported_post_types'] ) ) ? $amp_settings['supported_post_types'] : [],
			'amp_supported_templates'      => ( ! empty( $amp_settings['supported_templates'] ) && is_array( $amp_settings['supported_templates'] ) ) ? $amp_settings['supported_templates'] : [],
			'amp_mobile_redirect'          => ( ! empty( $amp_settings['mobile_redirect'] ) ) ? true : false,
			'amp_reader_theme'             => ( ! empty( $amp_settings['reader_theme'] ) ) ? $amp_settings['reader_theme'] : '',
		];

		return $site_info;
	}

	/**
	 * To get list of all plugin's information.
	 *
	 * @return array List of plugin detail.
	 */
	protected static function get_plugin_info() {

		$all_plugins       = get_plugins();
		$all_plugins_files = array_keys( $all_plugins );

		$plugin_info = array_map( 'AMP_Prepare_Data::normalize_plugin_info', $all_plugins_files );

		return $plugin_info;
	}

	/**
	 * To get plugin information by plugin file.
	 *
	 * @param string $plugin_file Plugin file.
	 *
	 * @return array Plugin detail.
	 */
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
			'is_active'         => is_plugin_active( $plugin_file ),
			'is_network_active' => is_plugin_active_for_network( $plugin_file ),
			'is_suppressed'     => in_array( $slug, $suppressed_plugin_list, true ) ? $suppressed_plugins[ $slug ]['last_version'] : '',
		];

	}

	/**
	 * To get list of themes.
	 *
	 * @return array List of theme information.
	 */
	protected static function get_theme_info() {

		return [
			static::normalize_theme_info( wp_get_theme() ),
		];
	}

	/**
	 * To normalize theme information.
	 *
	 * @param \WP_Theme $theme_object Theme object.
	 *
	 * @return array Normalize theme information.
	 */
	protected static function normalize_theme_info( $theme_object ) {

		if ( empty( $theme_object ) || ! is_a( $theme_object, 'WP_Theme' ) ) {
			return [];
		}

		$active_theme      = wp_get_theme();
		$active_theme_slug = '';
		$parent_theme      = '';

		if ( ! empty( $active_theme ) && is_a( $active_theme, 'WP_Theme' ) ) {
			$active_theme_slug = $active_theme->get_stylesheet();
		}

		if ( ! empty( $theme_object->parent() ) && ! is_a( $theme_object->parent(), 'WP_Theme' ) ) {
			$parent_theme = $theme_object->get_stylesheet();
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
			'is_active'    => ( $theme_object->get_stylesheet() === $active_theme_slug ),
			'parent_theme' => $parent_theme,
		];

		return $theme_data;
	}

	/**
	 * To get list of AMP errors.
	 *
	 * @return array List of errors.
	 */
	protected static function get_errors() {

		$error_data      = [];
		$amp_error_terms = get_terms(
			[
				'taxonomy'        => 'amp_validation_error',
				'hide_empty'      => true,
				'suppress_filter' => true,
			]
		);

		foreach ( $amp_error_terms as $error_term ) {

			if ( empty( $error_term ) || ! is_a( $error_term, 'WP_Term' ) ) {
				continue;
			}

			// Remove site specific detail like site home_url() from error detail.
			$description = strtolower( trim( $error_term->description ) );
			$description = static::remove_domain( $description );

			// Convert that into array.
			$error_detail = json_decode( $description, true );

			$error_detail['text'] = ( ! empty( $error_detail['text'] ) ) ? trim( $error_detail['text'] ) : '';
			$error_detail['text'] = ( ! empty( $error_detail['text'] ) ) ? esc_html( $error_detail['text'] ) : '';

			/**
			 * Generate new slug after removing site specific data.
			 */
			$error_detail['error_slug'] = static::generate_hash( $error_detail );

			ksort( $error_detail );

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

	/**
	 * To get amp validated URLs.
	 *
	 * @return array List amp validated URLs.
	 */
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

		$error_data      = static::get_errors();
		$plugin_info     = static::get_plugin_info();
		$theme_info      = static::get_theme_info();
		$plugin_versions = [];
		$theme_versions  = [];

		foreach ( $plugin_info as $item ) {
			$plugin_versions[ $item['slug'] ] = $item['version'];
		}

		foreach ( $theme_info as $item ) {
			$theme_versions[ $item['slug'] ] = $item['version'];
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

			$staleness = AMP_Validated_URL_Post_Type::get_post_staleness( $amp_error_post->ID );

			// Empty array for post staleness means post is NOT stale.
			if ( ! empty( $staleness ) ) {
				continue;
			}

			$post_errors_raw = json_decode( $amp_error_post->post_content, true );
			$post_errors     = [];

			if ( empty( $post_errors_raw ) ) {
				continue;
			}

			/**
			 * Process individual error in each post
			 */
			foreach ( $post_errors_raw as $error ) {

				$error_slug = $error_data[ $error['term_slug'] ]['error_slug'];

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
							$sources[ $index ]['version'] = $theme_versions[ $source['name'] ];
						}
					}

					if ( ! empty( $sources[ $index ]['text'] ) ) {
						$sources[ $index ]['text'] = strtolower( trim( $sources[ $index ]['text'] ) );
						$sources[ $index ]['text'] = static::remove_domain( $sources[ $index ]['text'] );
					}

					// Generate error source slug.
					$error_source_slug = self::generate_hash( $sources[ $index ] );

					// Update source information. Add error_slug and source_slug.
					$sources[ $index ]['error_source_slug'] = $error_source_slug;
					$sources[ $index ]['error_slug']        = $error_slug;

					ksort( $sources[ $index ] );

					// Store error source slug in current post list.
					$post_error_sources[] = $error_source_slug;

					// Store error source detail in all source list.
					$all_sources[ $error_source_slug ] = $sources[ $index ];

				} // Process on individual source complete.

				$post_errors[] = [
					'error_slug' => $error_slug,
					'sources'    => array_values( $post_error_sources ),
				];
			} // Process on each post is completed.

			// AMP Validated environment.
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

	/**
	 * To get home url of the site.
	 * Note: It will give home url without protocol.
	 *
	 * @return string Home URL.
	 */
	protected static function get_home_url() {

		$home_url = home_url();
		$home_url = strtolower( trim( $home_url ) );

		$http_protocol = wp_parse_url( $home_url, PHP_URL_SCHEME );

		$home_url = str_replace( "$http_protocol://", '', $home_url );
		$home_url = untrailingslashit( $home_url );

		return $home_url;
	}

	/**
	 * To remove home url from the content.
	 *
	 * @param string $content Content from home_url need to remove.
	 *
	 * @return string Content after removing home_url.
	 */
	protected static function remove_domain( $content ) {

		if ( empty( $content ) ) {
			return '';
		}

		$home_url = static::get_home_url();
		$home_url = str_replace( [ '.', '/' ], [ '\.', '\\\\{1,5}\/' ], $home_url );

		/**
		 * Reference: https://regex101.com/r/c25pNF/1
		 */
		$regex = "/http[s]?:\\\\{0,5}\/\\\\{0,5}\/$home_url/mU";

		$content = preg_replace( $regex, '', $content );

		return $content;
	}

	/**
	 * To generate hash of object.
	 *
	 * @param string|array|object $object Object for that hash need to generate.
	 *
	 * @return string Hash value of provided object.
	 */
	protected static function generate_hash( $object ) {

		if ( empty( $object ) ) {
			return '';
		}

		if ( is_object( $object ) ) {
			$object = (array) $object;
		}

		if ( is_array( $object ) ) {
			ksort( $object );
			$object = wp_json_encode( $object );
		}

		$object = trim( $object );
		$hash   = hash( 'sha256', $object );

		return $hash;
	}

}
