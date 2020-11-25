<?php

use function WP_CLI\Utils\get_flag_value;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

\WP_CLI::add_command( 'amp-send-data', function ( $args = [], $assoc_args = [] ) {

	$is_print = filter_var( get_flag_value( $assoc_args, 'print' ), FILTER_SANITIZE_STRING );

	$data = AMP_Prepare_Data::get_data();

	if ( $is_print ) {
		if ( 'json' === strtolower( trim( $is_print ) ) ) {
			print_r( json_encode( $data ) );
		} else {
			print_r( $data );
		}

		return;
	}

	$response = wp_remote_post(
		'http://localhost:3000/amp-data/',
		[
			'method'  => 'POST',
			'timeout' => 60,
			'body'    => $data,
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

		$errors = static::get_errors();
		$urls   = static::get_amp_urls();

		$request_data = [
			'site_url'  => get_bloginfo( 'site_url' ),
			'site_info' => static::get_site_info(),
			'plugins'   => static::get_plugin_info(),
			'themes'    => [
				static::normalize_theme_info( wp_get_theme() ),
			],
			'errors'    => array_values( $errors ),
			'urls'      => array_values( $urls ),
		];

		return $request_data;
	}

	protected static function get_site_info() {

		$wp_type = 'single';

		if ( is_multisite() ) {
			$wp_type = ( defined( 'SUBDOMAIN_INSTALL' ) && SUBDOMAIN_INSTALL ) ? 'subdomain' : 'subdir';
		}

		return [
			'site_url'              => get_bloginfo( 'site_url' ),
			'site_title'            => get_bloginfo( 'site_title' ),
			'php_version'           => phpversion(),
			'mysql_version'         => '',
			'wp_version'            => get_bloginfo( 'version' ),
			'wp_type'               => $wp_type, // single, subdomain, subdir
			'platform'              => '', // vip, vipgo
			'amp_mode'              => '', // standard, transitional, reader
			'enabled_content_types' => [],
			'suppressed_plugins'    => [],
		];
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
			'file'              => $plugin_file,
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
			'parent_theme' => ( $theme_object->parent() ) ? temp_normalize_theme_info( $theme_object->parent() ) : [],
		];

		return $theme_data;
	}

	protected static function get_errors() {

		$amp_error_terms = get_terms(
			[
				'taxonomy'   => 'amp_validation_error',
				'hide_empty' => true,
			]
		);

		$error_data = [];
		$domain     = wp_parse_url( home_url(), PHP_URL_HOST );
		$domain     = str_replace( '.', '\.', $domain );
		$regex      = "/http[s]?:\\\\\/\\\\\/(www\.)?$domain/mU";

		foreach ( $amp_error_terms as $error_term ) {

			if ( empty( $error_term ) || ! is_a( $error_term, 'WP_Term' ) ) {
				continue;
			}

			$description  = preg_replace( $regex, '', $error_term->description );
			$error_detail = json_decode( $description, true );
			$term_slug    = static::generate_hash( $error_detail );

			$error_detail['site_slug']       = $error_term->slug;
			$error_detail['_slug']           = $term_slug;
			$error_detail['text']            = ( ! empty( $error_detail['text'] ) ) ? esc_html( $error_detail['text'] ) : '';
			$error_data[ $error_term->slug ] = $error_detail;
		}

		$error_data = array_map( 'unserialize', array_unique( array_map( 'serialize', $error_data ) ) );

		return $error_data;
	}

	protected static function get_amp_urls() {

		global $wpdb;

		$query           = "SELECT ID, post_title, post_content FROM $wpdb->posts WHERE post_type='amp_validated_url'";
		$amp_error_posts = $wpdb->get_results( $query );

		$all_sources      = [];
		$amp_invalid_urls = [];

		$error_data  = static::get_errors();
		$plugin_info = static::get_plugin_info();

		$plugin_versions = [];

		foreach ( $plugin_info as $item ) {
			$plugin_versions[ $item['slug'] ] = $item['version'];
		}

		foreach ( $amp_error_posts as $amp_error_post ) {

			if ( empty( $amp_error_post ) ) {
				continue;
			}

			$post_errors_raw = json_decode( $amp_error_post->post_content, true );
			$post_errors     = [];

			foreach ( $post_errors_raw as $error ) {

				$sources = ( ! empty( $error['data']['sources'] ) ) ? $error['data']['sources'] : [];

				foreach ( $sources as $index => $source ) {

					if ( ! empty( $source['type'] ) ) {
						if ( 'plugin' === $source['type'] ) {
							$sources[ $index ]['version'] = $plugin_versions[ $source['name'] ];
						} elseif ( 'theme' === $source['type'] ) {
							$sources[ $index ]['version'] = '1.0.1';
						}
					}

					$sources[ $index ]['_slug'] = self::generate_hash( $sources[ $index ] );
				}

				$all_sources = array_merge( $all_sources, $sources );

				$post_errors[] = [
					'_error_slug' => $error_data[ $error['term_slug'] ]['_slug'],
					'sources'     => array_values( $sources ),
				];
			}

			$amp_validated_environment = get_post_meta( $amp_error_post->ID, '_amp_validated_environment', true );

			$amp_invalid_urls[] = [
				'url'                             => $amp_error_post->post_title,
				'_amp_validated_environment_slug' => static::generate_hash( $amp_validated_environment ),
				'amp_validated_environment'       => $amp_validated_environment,
				'errors'                          => $post_errors,
			];
		}

		$all_sources = array_map( 'unserialize', array_unique( array_map( 'serialize', $all_sources ) ) );

		return $amp_invalid_urls;
	}


	protected static function generate_hash( $object ) {

		if ( empty( $object ) ) {
			return '';
		}

		if ( is_string( $object ) ) {
			$hash = md5( $object );
		} elseif ( is_array( $object ) ) {
			ksort( $object );
			$object = wp_json_encode( $object );
			$hash   = md5( $object );
		}


		return $hash;
	}

}
