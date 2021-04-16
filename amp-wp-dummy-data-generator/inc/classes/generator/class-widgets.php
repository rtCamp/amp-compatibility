<?php
/**
 * Generator class for widgets.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

/**
 * Class Widgets
 */
class Widgets extends Base {

	const PAGE_SLUG = 'amp-wp-dummy-data-generator-widgets';

	/**
	 * Generator function.
	 *
	 * @return void
	 */
	public function generate() {

		$page_args = [
			'post_type'  => 'page',
			'post_title' => 'AMP WP Dummy data: Widgets',
			'post_name'  => self::PAGE_SLUG,
		];

		$this->generate_post( $page_args );
	}
}
