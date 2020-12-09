<?php
/**
 * Generate templates for post types.
 *
 * @package wp-cli-test-data
 */

namespace WP_CLI_Test_Data\Inc\Generator;

/**
 * Class Templates
 */
class Templates extends Base {

	/**
	 * Generator function.
	 *
	 * @return void
	 */
	public function generate() {

		$post_types   = get_post_types( [ 'public' => true ] );
		$theme_object = wp_get_theme();

		$default_post_args = [
			'post_title'   => '',
			'post_type'    => '',
			'post_content' => '<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>',
			'post_status'  => 'publish',
			'meta_input'   => [
				'_wp_page_template' => '',
			],
		];

		foreach ( $post_types as $post_type ) {

			$templates = $theme_object->get_page_templates( null, $post_type );

			if ( ! empty( $templates ) && is_array( $templates ) ) {

				$templates = array_flip( $templates );

				foreach ( $templates as $template ) {

					$post_args = wp_parse_args(
						[
							'post_title' => "$post_type : $template",
							'post_type'  => $post_type,
							'meta_input' => [
								'_wp_page_template' => $template,
							],
						],
						$default_post_args
					);

					$post_id = self::create_and_get_post( $post_args );

					if ( ! empty( $post_id ) && ! is_wp_error( $post_id ) && 0 < intval( $post_id ) ) {
						\WP_CLI::success( "Post type: $post_type | Template: $template | Post ID: $post_id" );
					} else {
						\WP_CLI::warning( "Post type: $post_type | Template: $template | Failed to create widget page." );
					}

				}

			}

		}

	}

}
