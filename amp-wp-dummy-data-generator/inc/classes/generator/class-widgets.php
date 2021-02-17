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
	 * @return array
	 */
	public function generate(): array {

		$items     = [];
		$page_args = [
			'post_type'  => 'page',
			'post_title' => 'AMP WP Dummy data: Widgets',
			'post_name'  => self::PAGE_SLUG,
		];

		$items[] = $this->generate_post( $page_args );

		return $items;
	}

}
