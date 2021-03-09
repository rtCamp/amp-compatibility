<?php
/**
 * Shortcodes class.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

use \AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class Shortcodes.
 */
class Shortcodes {

	use Singleton;

	/**
	 * Construct method.
	 */
	protected function __construct() {

		$this->setup_hooks();
	}

	/**
	 * To setup action and filters.
	 *
	 * @return void
	 */
	protected function setup_hooks() {

		/**
		 * Filters
		 */
		add_filter( 'the_content', [ $this, 'render_shortcode_page' ], 1 );

	}

	/**
	 * To render shortcode content on the page..
	 *
	 * @param string $content Page content.
	 *
	 * @return string Page content.
	 */
	public function render_shortcode_page( $content ) {

		global $post, $shortcode_tags;

		if ( empty( $post ) || ! is_a( $post, 'WP_Post' ) || 'amp-wp-dummy-data-generator-shortcodes' !== $post->post_name ) {
			return $content;
		}

		foreach ( $shortcode_tags as $shortcode_tag => $callback ) {
			$shortcode_content = "<div><h3>$shortcode_tag</h3> " . $this->get_shortcode_markup( $shortcode_tag ) . ' </div>';

			$content .= '<br/>' . $shortcode_content;
		}

		return $content;
	}

	/**
	 * To get short code markup.
	 *
	 * @param string $shortcode_tag Shortcode name.
	 *
	 * @return string Shortcode mark with args.
	 */
	public function get_shortcode_markup( $shortcode_tag ) {

		if ( empty( $shortcode_tag ) ) {
			return '';
		}

		$markup = '';

		switch ( $shortcode_tag ) {
			case 'wp_caption':
			case 'caption':
				$args          = [
					'post_type'      => 'attachment',
					'post_mime_type' => 'image',
					'posts_per_page' => 1,
					'fields'         => 'ids',
				];
				$attachment_id = get_posts( $args );
				$attachment_id = ( ! empty( $attachment_id[0] ) && 0 < intval( $attachment_id[0] ) ) ? intval( $attachment_id[0] ) : 0;

				if ( $attachment_id ) {
					$attachment_image = wp_get_attachment_image( $attachment_id, 'full' );
					$markup           = "[$shortcode_tag  id='$shortcode_tag' align='alignleft']$attachment_image The Caption[/$shortcode_tag]";
				}
				break;
			case 'gallery':
				$args           = [
					'post_type'      => 'attachment',
					'post_mime_type' => 'image',
					'posts_per_page' => 9,
					'fields'         => 'ids',
				];
				$attachment_ids = get_posts( $args );
				$attachment_ids = ( ! empty( $attachment_ids ) && is_array( $attachment_ids ) ) ? $attachment_ids : [];

				if ( ! empty( $attachment_ids ) ) {
					$attachment_ids = implode( ',', $attachment_ids );
					$markup         = "[$shortcode_tag ids='$attachment_ids']";
				}
				break;

			case 'playlist':
				$args           = [
					'post_type'      => 'attachment',
					'post_mime_type' => 'audio',
					'posts_per_page' => 9,
					'fields'         => 'ids',
				];
				$attachment_ids = get_posts( $args );
				$attachment_ids = ( ! empty( $attachment_ids ) && is_array( $attachment_ids ) ) ? $attachment_ids : [];

				if ( ! empty( $attachment_ids ) ) {
					$attachment_ids = implode( ',', $attachment_ids );
					$markup         = "[$shortcode_tag ids='$attachment_ids']";
				}
				break;
			case 'audio':
				$args       = [
					'post_type'      => 'attachment',
					'post_mime_type' => 'audio',
					'posts_per_page' => 1,
				];
				$attachment = get_posts( $args );

				if ( ! empty( $attachment[0] ) && is_a( $attachment[0], 'WP_Post' ) ) {
					$src    = $attachment[0]->guid;
					$markup = "[$shortcode_tag src='$src']";
				}

				break;
			case 'video':
				$args       = [
					'post_type'      => 'attachment',
					'post_mime_type' => 'video',
					'posts_per_page' => 1,
				];
				$attachment = get_posts( $args );

				if ( ! empty( $attachment[0] ) && is_a( $attachment[0], 'WP_Post' ) ) {
					$src    = $attachment[0]->guid;
					$markup = "[$shortcode_tag src='$src']";
				}

				break;
			case 'embed':
				$markup = "[$shortcode_tag src='https://youtu.be/zEmtfA8FETc']";
				break;
			default:
				$markup = "[$shortcode_tag]";
				break;
		}

		return $markup;
	}
}
