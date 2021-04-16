<?php
/**
 * Generate pages for each short codes.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

/**
 * Class ShortCodes
 */
class ShortCodes extends Base {

	const PAGE_SLUG = 'amp-wp-dummy-data-generator-shortcodes';

	/**
	 * To generate shortcode page.
	 *
	 * @return void
	 */
	public function generate() {

		$page_args = [
			'post_type'  => 'page',
			'post_title' => 'AMP WP Dummy data: Shortcodes',
			'post_name'  => self::PAGE_SLUG,
		];

		$this->generate_post( $page_args );
	}
}
