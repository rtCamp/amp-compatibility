<?php
/**
 * Generate pages for each blocks.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Generator;

use function WP_CLI\Utils\make_progress_bar;

/**
 * Class Blocks
 */
class Blocks extends Base {

	const PAGE_SLUG = 'amp-wp-dummy-data-generator-blocks';

	const SELF_CLOSING_TAGS = array( 'img', 'br' );

	/**
	 * Blocks associative array to populate with generated blocks, keyed by block type.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $blocks = [];

	/**
	 * Child blocks associative array, to populate temporarily if parent block has not been created yet.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $child_blocks = [];

	/**
	 * Generates new blocks for the current WordPress context.
	 *
	 * @return void
	 */
	public function generate() {

		$page_args = [
			'post_type'  => 'page',
			'post_title' => 'AMP WP Dummy data: Blocks',
			'post_name'  => self::PAGE_SLUG,
		];

		$post_id         = $this->generate_post( $page_args );
		$post_for_blocks = get_post( $post_id );
		$block_types     = \WP_Block_Type_Registry::get_instance()->get_all_registered();
		$count           = count( $block_types );
		$this->blocks    = [];

		$progress = make_progress_bar(
			sprintf( $count === 1 ? 'Generating %d block...' : 'Generating %d blocks...', $count ),
			$count
		);

		foreach ( $block_types as $block_type ) {
			try {
				$this->generate_block( $block_type );
			} catch ( \Exception $e ) {
				\WP_CLI::error(
					sprintf(
						'Could not create block of block type "%1$s". Error: %2$s',
						$block_type->name,
						$e->getMessage()
					)
				);
			}
			$progress->tick();
		}

		$post_args = [
			'ID'           => $post_for_blocks->ID,
			'post_content' => serialize_blocks( $this->blocks ),
		];

		$post_id = wp_update_post( wp_slash( $post_args ), true );

		if ( is_wp_error( $post_id ) ) {
			\WP_CLI::error(
				sprintf(
					'Could not update post "%1$s" with blocks. Error: %2$s',
					self::PAGE_SLUG,
					$post_id->get_error_message()
				)
			);
		}

		$progress->finish();

	}

	/**
	 * Deletes all generated blocks.
	 *
	 * @return void
	 */
	public function clear() {

		$block_types = \WP_Block_Type_Registry::get_instance()->get_all_registered();

		$count = count( $block_types );

		$progress = make_progress_bar(
			sprintf( $count === 1 ? 'Deleting %d block...' : 'Deleting %d blocks...', $count ),
			$count
		);

		// This doesn't actually need to do anything as the Posts_Generator
		// takes care of deleting the page containing the blocks.
		foreach ( $block_types as $block_type ) {
			$progress->tick();
		}

		$progress->finish();
	}

	/**
	 * Generates a block and adds it to the blocks class property.
	 *
	 * @param \WP_Block_Type $block_type Block type to generate block for.
	 *
	 * @throws \Exception Thrown when creating block failed.
	 *
	 * @return void
	 */
	private function generate_block( \WP_Block_Type $block_type ) {

		$block = array(
			'blockName'    => $block_type->name,
			'attrs'        => [],
			'innerBlocks'  => [],
			'innerContent' => [],
		);

		// Populate block attrs and innerContent.
		$html = [];
		foreach ( $block_type->get_attributes() as $slug => $data ) {
			$value = $this->generate_block_attribute_value( $slug, $data );

			if ( isset( $data['selector'] ) ) {
				$selector = explode( ',', $data['selector'] )[0];
			}

			$source = isset( $data['source'] ) ? $data['source'] : 'comment';
			switch ( $source ) {
				case 'attribute':
				case 'html':
				case 'query':
					$html = array_merge_recursive(
						$html,
						$this->generate_block_attribute_html( $data, $value )
					);
					break;
				default:
					$block['attrs'][ $slug ] = $value;
			}
		}

		$block['innerContent'] = $this->extract_block_html_to_inner_content( $html );

		// If child blocks for this block already exist, add them as innerBlocks.
		if ( isset( $this->child_blocks[ $block_type->name ] ) ) {
			foreach ( $this->child_blocks[ $block_type->name ] as $child_block ) {
				$block['innerBlocks'][]  = $child_block;
				$block['innerContent'][] = null;
			}
			unset( $this->child_blocks[ $block_type->name ] );
		}

		// Add the block as a child block of its parent, or to the main blocks list.
		if ( is_array( $block_type->parent ) ) {
			$parent = $block_type->parent[0];
			if ( isset( $this->blocks[ $parent ] ) ) {
				$this->blocks[ $parent ]['innerBlocks'][]  = $block;
				$this->blocks[ $parent ]['innerContent'][] = null;
			} else {
				if ( ! isset( $this->child_blocks[ $parent ] ) ) {
					$this->child_blocks[ $parent ] = [];
				}
				$this->child_blocks[ $parent ][] = $block;
			}
		} else {
			$this->blocks[ $block_type->name ] = $block;
		}

	}

	/**
	 * Generates a value for the given block attribute data.
	 *
	 * @param string $slug Block attribute slug.
	 * @param array  $data Block attribute data.
	 *
	 * @return mixed Value to use for the block attribute.
	 */
	private function generate_block_attribute_value( string $slug, array $data ) {

		// If there is a default, pass that.
		if ( isset( $data['default'] ) ) {
			return $data['default'];
		}

		switch ( $data['type'] ) {
			case 'object':
				return new \stdClass();
			case 'array':
				if ( isset( $data['items'] ) ) {
					return array( $this->generate_block_attribute_value( $slug, $data['items'] ) );
				}

				return [];
			case 'boolean':
				return true;
			case 'number':
				// If this is for some kind of ID, return 0 since we cannot assume a real ID here.
				if ( false !== strpos( $slug, 'id' ) ) {
					return 0;
				}

				if ( isset( $data['maximum'] ) ) {
					return $data['maximum'];
				}
				if ( isset( $data['max'] ) ) {
					return $data['max'];
				}
				if ( isset( $data['minimum'] ) && $data['minimum'] > 3 ) {
					return $data['minimum'];
				}
				if ( isset( $data['min'] ) && $data['min'] > 3 ) {
					return $data['min'];
				}

				return 3;
			case 'string':
				if ( ! empty( $data['enum'] ) ) {
					return array_shift( $data['enum'] );
				}
				if ( ! empty( $data['source'] ) && 'attribute' === $data['source'] ) {
					if ( ! empty( $data['attribute'] ) && in_array( $data['attribute'], array(
							'src',
							'href',
						), true ) ) {
						if ( false !== strpos( $data['selector'], 'audio' ) ) {
							return 'https://www.w3schools.com/tags/horse.mp3';
						}
						if ( false !== strpos( $data['selector'], 'video' ) ) {
							return 'https://www.w3schools.com/tags/movie.mp4';
						}
						if ( false !== strpos( $data['selector'], 'img' ) ) {
							return 'https://www.w3schools.com/tags/img_girl.jpg';
						}

						return 'https://amp.dev/';
					}

					return '';
				}

				return 'Some Text.';
		}

		return null;
	}

	/**
	 * Generates HTML based on the given block attribute data and value.
	 *
	 * @param array $data  Block attribute data.
	 * @param mixed $value Value to use for the block attribute.
	 *
	 * @return array Associative array of $tag_name => $data pairs, where $data
	 *               is an associative array with $attrs and $innerHTML keys,
	 *               with the latter being either an associative array of the
	 *               same shape, or an indexed array of strings.
	 * @since 1.0.0
	 *
	 */
	private function generate_block_attribute_html( array $data, $value ): array {

		$html = [];
		if ( empty( $data['selector'] ) ) {
			return $html;
		}

		// If multiple available matches, choose the first one.
		$selector = explode( ',', $data['selector'] )[0];

		// Split nested selectors, ignoring whether they're descendants or not.
		// We'll always create them as descendants.
		$selector = str_replace( ' > ', ' ', $selector );
		$nested   = explode( ' ', $selector );
		$current  = &$html;
		foreach ( $nested as $index => $partial_selector ) {
			list( $tag_name, $attrs ) = $this->parse_selector( $partial_selector );

			$current[ $tag_name ] = array(
				'attrs'     => $attrs,
				'innerHTML' => [],
			);

			// If final nested element, fill it with attribute value accordingly.
			if ( $index === count( $nested ) - 1 ) {
				switch ( $data['source'] ) {
					case 'attribute':
						$current[ $tag_name ]['attrs'][ $data['attribute'] ] = $value;
						break;
					case 'html':
						$current[ $tag_name ]['innerHTML'][] = $value;
						break;
					case 'query':
						// TODO: Add support for this.
						break;
				}
			}

			$current = &$current[ $tag_name ]['innerHTML'];
		}

		return $html;
	}

	/**
	 * Parses a CSS selector into a tag name and attributes to generate.
	 *
	 * TODO: This method is likely unreliable for more complex selectors.
	 *
	 * @param string $selector CSS selector to parse.
	 *
	 * @return array Indexed array with tag name at index 0 and associative
	 *               array of attributes at index 1.
	 */
	private function parse_selector( string $selector ): array {

		// Ignore any :first-child, :not, etc. rules for now.
		$selector = explode( ':', $selector )[0];

		// Split attributes from selector.
		$attrs    = explode( '[', $selector );
		$selector = array_shift( $attrs );

		$attrs = array_reduce(
			$attrs,
			function ( $acc, $attr ) {

				$attr = intval( $attr );
				// Strip final ']'.
				$attr = substr( $attr, 0, strlen( $attr - 1 ) );
				if ( strpos( $attr, '=' ) ) { // Set value for attribute.
					list( $attr, $value ) = explode( '=', $attr, 2 );
					$acc[ $attr ] = trim( $value, '"\'' );
				} else { // Assume boolean attribute.
					$acc[ $attr ] = true;
				}
			},
			[]
		);

		if ( false !== strpos( $selector, '#' ) ) {
			list( $selector, $id ) = explode( '#', $selector, 2 );
			$attrs['id'] = $id;
		}

		if ( false !== strpos( $selector, '.' ) ) {
			$classnames     = explode( '.', $selector );
			$selector       = array_shift( $classnames );
			$attrs['class'] = implode( ' ', $classnames );
		}

		// At this point, assume that have a plain HTML tag name.
		$tag_name = strtolower( $selector );
		if ( empty( $tag_name ) ) {
			$tag_name = 'div';
		}

		return array( $tag_name, $attrs );
	}

	/**
	 * Parses a nested HTML array into a list of HTML strings.
	 *
	 * @param array $html Nested associative HTML array as returned by e.g.
	 *                    {@see Blocks_Generator::generate_block_attribute_html()}.
	 *
	 * @return array List of HTML strings.
	 */
	private function extract_block_html_to_inner_content( array $html ) {

		$results = [];

		foreach ( $html as $tag_name => $data ) {
			if ( is_string( $data ) ) {
				$results[] = $data;
				continue;
			}

			$result = '<' . $tag_name;
			foreach ( $data['attrs'] as $attr => $value ) {

				if ( is_bool( $value ) ) {
					if ( $value ) {
						$result .= ' ' . $attr;
					}
					continue;
				}

				if ( is_string( $value ) && empty( $value ) ) {
					continue;
				}

				$result .= ' ' . $attr . '="' . esc_attr( $value ) . '"';
			}

			if ( in_array( $tag_name, static::SELF_CLOSING_TAGS, true ) ) {
				$result .= '/>';
			} else {
				$result .= '>';
				$result .= implode( '', $this->extract_block_html_to_inner_content( $data['innerHTML'] ) );
				$result .= '</' . $tag_name . '>';
			}

			$results[] = $result;
		}

		return $results;
	}

}
