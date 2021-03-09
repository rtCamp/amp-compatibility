<?php
/**
 * WP CLI Command to send API data.
 *
 * @package amp-send-data
 */

namespace AMP_Send_Data;

use function \WP_CLI\Utils\get_flag_value;

define( 'AMP_SEND_DATA_SERVER_ENDPOINT', 'https://rich-torus-221321.ue.r.appspot.com' );

if ( ! defined( '\WP_CLI' ) || ! \WP_CLI ) {
	fwrite( STDERR, "Must be run in context of WP-CLI.\n" );
	exit( 1 );
}

/**
 * Check if AMP plugin activate or not.
 * If not than throw exception.
 *
 * @throws \Exception When the AMP plugin is not active.
 *
 * @return void
 */
function verify_amp_plugin_active() {

	if ( ! defined( 'AMP__VERSION' ) ) {
		throw new \Exception( PHP_EOL . 'Please activate AMP plugin.' . PHP_EOL );
	}
}

\WP_CLI::add_command( 'configure-amp-site', 'AMP_Send_Data\configure_amp_site' );
\WP_CLI::add_command( 'amp-send-data', 'AMP_Send_Data\amp_send_data' );

/**
 * To configure AMP site.
 *
 * @throws \WP_CLI\ExitException When exiting.
 *
 * @return void
 */
function configure_amp_site() {

	verify_amp_plugin_active();

	/**
	 * To update amp option.
	 * User must have manage_options capabilities.
	 */
	add_filter(
		'user_has_cap',
		function ( $all_caps ) {

			return array_merge( $all_caps, [ 'manage_options' => true ] );
		}
	);

	$supportable_templates = \AMP_Theme_Support::get_supportable_templates();
	$supportable_templates = ( ! empty( $supportable_templates ) && is_array( $supportable_templates ) ) ? array_keys( $supportable_templates ) : [];

	$new_settings = [
		\AmpProject\AmpWP\Option::THEME_SUPPORT           => \AMP_Theme_Support::STANDARD_MODE_SLUG,
		\AmpProject\AmpWP\Option::ALL_TEMPLATES_SUPPORTED => true,
		\AmpProject\AmpWP\Option::SUPPORTED_POST_TYPES    => \AMP_Post_Type_Support::get_eligible_post_types(),
		\AmpProject\AmpWP\Option::SUPPORTED_TEMPLATES     => $supportable_templates,
		\AmpProject\AmpWP\Option::MOBILE_REDIRECT         => true,
		\AmpProject\AmpWP\Option::PLUGIN_CONFIGURED       => true,
	];

	if ( \AMP_Options_Manager::update_options( $new_settings ) ) {
		\WP_CLI::success( 'AMP options updated.' );
	} else {
		\WP_CLI::error( 'Fail to update AMP options.' );
	}
}

/**
 * Sends data to our endpoint where we queue it for further analysis.
 *
 * @param string[] $args       Not Used.
 * @param string[] $assoc_args Associative array of arguments passed to the CLI command.
 *
 * @return null
 *
 * @throws \Exception When the AMP plugin is not active.
 *
 */
function amp_send_data( $args = [], $assoc_args = [] ) {

	verify_amp_plugin_active();

	$is_print     = filter_var( get_flag_value( $assoc_args, 'print', false ), FILTER_SANITIZE_STRING );
	$is_synthetic = filter_var( get_flag_value( $assoc_args, 'is-synthetic', false ), FILTER_SANITIZE_STRING );
	$endpoint     = filter_var( get_flag_value( $assoc_args, 'endpoint', AMP_SEND_DATA_SERVER_ENDPOINT ), FILTER_SANITIZE_STRING );
	$endpoint     = untrailingslashit( $endpoint );

	$data = AMP_Prepare_Data::get_data();
	$data = wp_parse_args( $data, [
		'site_url'                   => [],
		'site_info'                  => [],
		'plugins'                    => [],
		'themes'                     => [],
		'errors'                     => [],
		'error_sources'              => [],
		'amp_validated_environments' => [],
		'urls'                       => [],
	] );

	/**
	 * Modify data for synthetic sites.
	 */
	if ( $is_synthetic ) {
		$data['site_info']['is_synthetic_data'] = true;
	}

	/**
	 * Print or send AMP data.
	 */
	if ( $is_print ) {

		// Print the data.
		$print = strtolower( trim( $is_print ) );
		if ( 'json' === $print ) {
			echo wp_json_encode( $data ) . PHP_EOL;
		} elseif ( 'json-pretty' === $print ) {
			echo wp_json_encode( $data, JSON_PRETTY_PRINT ) . PHP_EOL;
		} else {
			print_r( $data );
		}
	} else {

		// Send data to server.

		$response = wp_remote_post(
			sprintf( '%s/api/v1/amp-wp/', $endpoint ),
			[
				'body'     => $data,
				'compress' => true,
			]
		);

		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			\WP_CLI::warning( "Something went wrong: $error_message" );
		} else {
			$body = wp_remote_retrieve_body( $response );
			\WP_CLI::success( $body );
		}
	}

	/**
	 * Prepare summary of data.
	 */
	$url_error_relationship = [];

	foreach ( $data['urls'] as $url ) {
		foreach ( $url['errors'] as $error ) {
			foreach ( $error['sources'] as $source ) {
				$url_error_relationship[] = $url['url'] . '-' . $error['error_slug'] . '-' . $source;
			}
		}
	}

	$plugin_count = count( $data['plugins'] );

	if ( $is_synthetic ) {
		$plugin_count_text = ( $plugin_count - 5 ) . " - Excluding common plugins of synthetic sites. ( $plugin_count - 5 )";
	} else {
		$plugin_count_text = $plugin_count;
	}

	$summary = [
		'Site URL'               => AMP_Prepare_Data::get_home_url(),
		'Plugin count'           => $plugin_count_text,
		'Themes'                 => count( $data['themes'] ),
		'Errors'                 => count( array_values( $data['errors'] ) ),
		'Error Sources'          => count( array_values( $data['error_sources'] ) ),
		'Validated URL'          => count( array_values( $data['urls'] ) ),
		'URL Error Relationship' => count( array_values( $url_error_relationship ) ),
	];

	if ( $is_synthetic ) {
		$summary['Synthetic Data'] = 'Yes';
	}

	\WP_CLI::log( sprintf( PHP_EOL . "%'=100s", '' ) );
	\WP_CLI::log( 'Summary of AMP data' );
	\WP_CLI::log( sprintf( "%'=100s", '' ) );
	foreach ( $summary as $key => $value ) {
		\WP_CLI::log( sprintf( '%-25s : %s', $key, $value ) );
	}
	\WP_CLI::log( sprintf( "%'=100s" . PHP_EOL, '' ) );


}

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

		verify_amp_plugin_active();

		$amp_urls = static::get_amp_urls();

		// TODO: It seems certain data is being repeatedly sent here. The obtaining of the information could be simplified in this way:
		// - Skip having a separate get_errors() call which sends all the errors together.
		// - Skip sending all error sources separately.
		// - Instead, send all the information together with the validated URL. So the POST body would be a list of URL objects,
		//   each which contain all the errors, and each error has all their sources.
		//   Then at the time of injestion on the server, it can process each URL with all of its errors and their sources--URL by URL.
		//   I believe this would simplify both obtaining the validation data as well as injeting it on the server.
		$request_data = [
			'site_url'                   => static::get_home_url(),
			'site_info'                  => static::get_site_info(),
			'plugins'                    => static::get_plugin_info(),
			'themes'                     => static::get_theme_info(),
			'errors'                     => array_values( $amp_urls['errors'] ),
			// TODO: Per above, eliminate in favor of sending all information in urls.
			'error_sources'              => array_values( $amp_urls['error_sources'] ),
			// TODO: Per above, eliminate in favor of sending all information in urls.
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

		$active_theme = wp_get_theme();
		$active_theme = static::normalize_theme_info( $active_theme );

		$amp_settings = \AMP_Options_Manager::get_options();
		$amp_settings = ( ! empty( $amp_settings ) && is_array( $amp_settings ) ) ? $amp_settings : [];

		$loopback_status = '';

		// TODO: Is this necessary? We're synthetic after all.
		if ( class_exists( 'Health_Check_Loopback' ) ) {
			$loopback_status = \Health_Check_Loopback::can_perform_loopback();
			$loopback_status = ( ! empty( $loopback_status->status ) ) ? $loopback_status->status : '';
		}

		$site_info = [
			'site_url'                     => static::get_home_url(),
			'site_title'                   => get_bloginfo( 'site_title' ),
			'php_version'                  => phpversion(),
			'mysql_version'                => '',
			'wp_version'                   => get_bloginfo( 'version' ),
			'wp_language'                  => get_bloginfo( 'language' ),
			'wp_https_status'              => is_ssl() ? true : false,
			'wp_multisite'                 => $wp_type,
			'wp_active_theme'              => $active_theme,
			'object_cache_status'          => wp_using_ext_object_cache(),
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
	 * To get list of active plugin's information.
	 *
	 * @return array List of plugin detail.
	 */
	protected static function get_plugin_info() {

		$active_plugins = get_option( 'active_plugins' );

		if ( is_multisite() ) {
			$network_wide_activate_plugins = get_site_option( 'active_sitewide_plugins' );
			$active_plugins                = array_merge( $active_plugins, $network_wide_activate_plugins );
		}

		$active_plugins = array_values( array_unique( $active_plugins ) );
		$plugin_info    = array_map( '\AMP_Send_Data\AMP_Prepare_Data::normalize_plugin_info', $active_plugins );

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
	 * To get active theme info.
	 *
	 * @return array List of theme information.
	 */
	protected static function get_theme_info() {

		$themes   = [ wp_get_theme() ];
		$response = [];

		foreach ( $themes as $theme ) {
			$response[] = static::normalize_theme_info( $theme );
		}

		return $response;
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
			$parent_theme = $theme_object->parent()->get_stylesheet();
		}

		$tags = $theme_object->get( 'Tags' );
		$tags = ( ! empty( $tags ) && is_array( $tags ) ) ? $tags : [];

		$theme_data = [
			'name'         => $theme_object->get( 'Name' ),
			'slug'         => $theme_object->get_stylesheet(),
			'version'      => $theme_object->get( 'Version' ),
			'status'       => $theme_object->get( 'Status' ),
			'tags'         => $tags,
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
	 * @todo Per above, I believe this method can be eliminated.
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

		if ( empty( $amp_error_terms ) || ! is_array( $amp_error_terms ) || is_wp_error( $amp_error_terms ) ) {
			return [];
		}

		$amp_error_terms = array_values( $amp_error_terms );

		foreach ( $amp_error_terms as $index => $error_term ) {

			if ( empty( $error_term ) || ! is_a( $error_term, 'WP_Term' ) ) {
				continue;
			}

			// Remove site specific detail like site home_url() from error detail.
			$description = strtolower( trim( $error_term->description ) );
			$description = static::remove_domain( $description );

			// Convert that into array.
			$error_detail = json_decode( $description, true );

			$error_detail['text'] = ( ! empty( $error_detail['text'] ) ) ? trim( $error_detail['text'] ) : '';

			ksort( $error_detail );

			/**
			 * Generate new slug after removing site specific data.
			 */
			$error_detail['error_slug'] = static::generate_hash( $error_detail );

			/**
			 * Keep the slug as key to quickly get error detail.
			 */
			$error_data[ $error_term->slug ] = $error_detail;
		}

		/**
		 * Remove duplicate data.
		 * TODO: This should not be needed because $error_data is keyed by $error_term->slug which is itself an md5 slug of the original validation error data.
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

		$error_data      = static::get_errors(); // TODO: The errors are also being returned by static::get_data(). Also, the error data is already embedded inside the post_content (redundantly). Therefore, this could probably be skipped in favor of obtaining it when looping over the validated URLs below.
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

			$staleness = \AMP_Validated_URL_Post_Type::get_post_staleness( $amp_error_post->ID );

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
			foreach ( $post_errors_raw as $error ) { // Errors of each posts.

				$error_slug = $error_data[ $error['term_slug'] ]['error_slug'];

				$sources            = ( ! empty( $error['data']['sources'] ) ) ? $error['data']['sources'] : [];
				$post_error_sources = [];

				/**
				 * Process each error_source of errors
				 */
				foreach ( $sources as $index => $source ) { // Source of each errors of the post

					$allowed_types  = [ 'plugin', 'theme' ];
					$source['type'] = ( ! empty( $source['type'] ) ) ? strtolower( trim( $source['type'] ) ) : '';

					/**
					 * Do not include wp-core sources.
					 */
					if ( empty( $source['type'] ) || ! in_array( $source['type'], $allowed_types, true ) ) {
						continue;
					}

					if ( 'plugin' === $source['type'] ) {
						$sources[ $index ]['version'] = $plugin_versions[ $source['name'] ];
					} elseif ( 'theme' === $source['type'] ) {
						$sources[ $index ]['version'] = $theme_versions[ $source['name'] ];
					}

					if ( ! empty( $sources[ $index ]['text'] ) ) {
						$sources[ $index ]['text'] = trim( $sources[ $index ]['text'] );
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

			// Object information.
			$amp_queried_object = get_post_meta( $amp_error_post->ID, '_amp_queried_object', true );
			$object_type        = ( ! empty( $amp_queried_object['type'] ) ) ? $amp_queried_object['type'] : '';
			$object_subtype     = '';

			if ( empty( $object_type ) ) {

				if ( false !== strpos( $amp_error_post->post_title, '?s=' ) ) {
					$object_type = 'search';
				}
			}

			switch ( $object_type ) {
				case 'post':
					$object_subtype = get_post( $amp_queried_object['id'] )->post_type;
					break;
				case 'term':
					$object_subtype = get_term( $amp_queried_object['id'] )->taxonomy;
					break;
				case 'user':
					break;
			}

			// Stylesheet info.
			$stylesheet_info = static::get_stylesheet_info( $amp_error_post->ID );

			$amp_invalid_urls[] = [
				'url'                   => $amp_error_post->post_title,
				'object_type'           => $object_type,
				'object_subtype'        => $object_subtype,
				'css_size_before'       => ( ! empty( $stylesheet_info['css_size_before'] ) ) ? $stylesheet_info['css_size_before'] : '',
				'css_size_after'        => ( ! empty( $stylesheet_info['css_size_after'] ) ) ? $stylesheet_info['css_size_after'] : '',
				'css_size_excluded'     => ( ! empty( $stylesheet_info['css_size_excluded'] ) ) ? $stylesheet_info['css_size_excluded'] : '',
				'css_budget_percentage' => ( ! empty( $stylesheet_info['css_budget_percentage'] ) ) ? $stylesheet_info['css_budget_percentage'] : '',
				'errors'                => $post_errors,
			];
		}

		return [
			'errors'                     => $error_data,
			'error_sources'              => $all_sources, // @todo Per above, I believe this method can be eliminated.
			'amp_validated_environments' => $all_amp_validated_environments,
			'urls'                       => $amp_invalid_urls,
		];
	}

	/**
	 * Get style sheet info of the post.
	 *
	 * Reference: AMP_Validated_URL_Post_Type::print_stylesheets_meta_box()
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return array AMP stylesheet used info.
	 */
	protected static function get_stylesheet_info( $post_id ) {

		$stylesheets = get_post_meta( $post_id, \AMP_Validated_URL_Post_Type::STYLESHEETS_POST_META_KEY, true );

		if ( empty( $stylesheets ) ) {
			return [];
		}

		$stylesheets             = json_decode( $stylesheets, true );
		$style_custom_cdata_spec = null;

		foreach ( \AMP_Allowed_Tags_Generated::get_allowed_tag( 'style' ) as $spec_rule ) {
			if ( isset( $spec_rule[ \AMP_Rule_Spec::TAG_SPEC ]['spec_name'] ) && \AMP_Style_Sanitizer::STYLE_AMP_CUSTOM_SPEC_NAME === $spec_rule[ \AMP_Rule_Spec::TAG_SPEC ]['spec_name'] ) {
				$style_custom_cdata_spec = $spec_rule[ \AMP_Rule_Spec::CDATA ];
			}
		}

		$included_final_size    = 0;
		$included_original_size = 0;
		$excluded_final_size    = 0;
		$excluded_original_size = 0;
		$excluded_stylesheets   = 0;
		$max_final_size         = 0;

		$included_status  = 1;
		$excessive_status = 2;
		$excluded_status  = 3;

		// Determine which stylesheets are included based on their priorities.
		$pending_stylesheet_indices = array_keys( $stylesheets );
		usort(
			$pending_stylesheet_indices,
			static function ( $a, $b ) use ( $stylesheets ) {

				return $stylesheets[ $a ]['priority'] - $stylesheets[ $b ]['priority'];
			}
		);

		foreach ( $pending_stylesheet_indices as $i ) {

			// @todo Add information about amp-key frames as well.
			if ( ! isset( $stylesheets[ $i ]['group'] ) || 'amp-custom' !== $stylesheets[ $i ]['group'] || ! empty( $stylesheets[ $i ]['duplicate'] ) ) {
				continue;
			}

			$max_final_size = max( $max_final_size, $stylesheets[ $i ]['final_size'] );
			if ( $stylesheets[ $i ]['included'] ) {
				$included_final_size    += $stylesheets[ $i ]['final_size'];
				$included_original_size += $stylesheets[ $i ]['original_size'];

				if ( $included_final_size >= $style_custom_cdata_spec['max_bytes'] ) {
					$stylesheets[ $i ]['status'] = $excessive_status;
				} else {
					$stylesheets[ $i ]['status'] = $included_status;
				}
			} else {
				$excluded_final_size    += $stylesheets[ $i ]['final_size'];
				$excluded_original_size += $stylesheets[ $i ]['original_size'];
				$excluded_stylesheets++;
				$stylesheets[ $i ]['status'] = $excluded_status;
			}
		}

		$percentage_budget_used = ( ( $included_final_size + $excluded_final_size ) / $style_custom_cdata_spec['max_bytes'] ) * 100;
		$response               = [
			'css_size_before'       => intval( $included_original_size + $excluded_original_size ),
			'css_size_after'        => intval( $included_final_size + $excluded_final_size ),
			'css_size_excluded'     => intval( $excluded_stylesheets ),
			'css_budget_percentage' => round( $percentage_budget_used, 1 ),
		];

		return $response;

	}

	/**
	 * To get home url of the site.
	 * Note: It will give home url without protocol.
	 *
	 * @return string Home URL.
	 */
	public static function get_home_url() {

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
