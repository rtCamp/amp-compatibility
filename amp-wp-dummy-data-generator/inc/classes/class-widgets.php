<?php
/**
 * Widget class.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc;

use \AMP_WP_Dummy_Data_Generator\Inc\Traits\Singleton;

/**
 * Class Widgets
 */
class Widgets {

	use Singleton;

	const SIDEBAR_ID = 'amp-wp-dummy-data-generator';

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

		// TODO: Instead of registering a custom sidebar, it might be more appropriate to rely on
		// the real sidebars used by the theme or any plugins (potentially in addition to this
		// dummy sidebar).
		//
		// Essentially, the same way the test menu is added to all menu locations, test widgets
		// should be added to all widget areas.
		/**
		 * Actions
		 */
		add_action( 'widgets_init', [ $this, 'register_sidebar' ] );

		/**
		 * Filters
		 */
		add_filter( 'the_content', [ $this, 'render_widget_page' ], 1 );
		add_filter( 'sidebars_widgets', [ $this, 'add_widgets' ] );

	}

	/**
	 * To render widget sidebar on the page..
	 *
	 * @param string $content Page content.
	 *
	 * @return string Page content.
	 */
	public function render_widget_page( $content ) {

		global $post;

		if ( empty( $post ) || ! is_a( $post, 'WP_Post' ) || 'amp-wp-dummy-data-generator-widgets' !== $post->post_name ) {
			return $content;
		}

		ob_start();
		if ( is_active_sidebar( self::SIDEBAR_ID ) ) {
			dynamic_sidebar( self::SIDEBAR_ID );
		}
		$content = ob_get_clean();

		return $content;
	}

	/**
	 * To register sidebar.
	 *
	 * @return void
	 */
	public function register_sidebar() {

		register_sidebar(
			[
				'name'          => 'AMP WP Dummy Data Sidebar',
				'id'            => self::SIDEBAR_ID,
				'before_widget' => '<div id="%1$s" class="widget %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '<h2 class="widgettitle">',
				'after_title'   => '</h2>',
			]
		);
	}

	/**
	 * To add widget dynamically in 'amp-wp-comp-sidebar'.
	 *
	 * @param array $sidebars_widgets List of widget for sidebar.
	 *
	 * @return array List of widget for sidebar.
	 */
	public function add_widgets( $sidebars_widgets ) {

		static $is_set = false;

		if ( ! did_action( 'template_redirect' ) || true === $is_set ) {
			return $sidebars_widgets;
		}

		/**
		 * Global variable wp_widget_factory.
		 *
		 * @var \WP_Widget_Factory $wp_widget_factory
		 */
		global $wp_widget_factory;

		$sidebar_id = self::SIDEBAR_ID;

		$widget_ids = [];
		foreach ( $wp_widget_factory->widgets as $widget ) {
			$this->ensure_first_widget_setting_populated( $widget );
			$widget_ids[] = $widget->id_base . '-2';
		}

		$sidebars_widgets[ $sidebar_id ] = $widget_ids;

		return $sidebars_widgets;
	}

	/**
	 * Update settings of provided widget.
	 *
	 * @param \WP_Widget $widget Widget object.
	 *
	 * @return void
	 */
	public function ensure_first_widget_setting_populated( \WP_Widget $widget ) {

		$settings = $widget->get_settings();

		if ( isset( $settings[2] ) && ! empty( $settings[2]['title'] ) ) {
			return;
		}

		switch ( $widget->id_base ) {
			case 'calendar':
				$settings[2] = [ 'title' => 'Calendar' ];
				break;
			case 'rss':
				$settings[2] = [
					'title' => 'RSS',
					'url'   => get_feed_link(),
				];
				break;
			case 'nav_menu':
				$menu = wp_get_nav_menu_object( 'Testing Menu' );
				if ( $menu ) {
					$settings[2] = [
						'title'    => 'Nav Menu Widget',
						'nav_menu' => $menu->term_id,
					];
				}
				break;
			case 'custom_html':
				$settings[2] = [
					'title'   => 'Custom HTML',
					'content' => '<p>Hello World!</p>',
				];
				break;
			case 'text':
				$page = get_page_by_title( 'Page Markup And Formatting', OBJECT, 'page' );
				if ( $page ) {
					$settings[2] = [
						'title'  => 'Text',
						'visual' => true,
						'filter' => true,
						'text'   => preg_replace_callback(
							'#<pre>(.+?)</pre>#s',
							function ( $matches ) {

								// Fixup ASCII art for sake of libxml.
								// TODO: The "Page Markup And Formatting" unit test data has this problem, as the ASCII art causes libxml to incorrectly parse the content.
								$fixed = $matches[1];
								$fixed = preg_replace( '#<(?!\w|/)#', '&lt;', $fixed );

								return sprintf( '<pre>%s</pre>', $fixed );
							},
							$page->post_content
						),
					];
				}
				break;
			case 'media_audio':
				$attachment = get_page_by_title( 'St. Louis Blues', OBJECT, 'attachment' );
				if ( $attachment ) {
					$settings[2] = [
						'attachment_id' => $attachment->ID,
						'title'         => 'Audio',
					];
				}
				break;
			case 'media_image':
				$attachment = get_page_by_title( 'Golden Gate Bridge', OBJECT, 'attachment' );
				if ( $attachment ) {
					$settings[2] = [
						'attachment_id' => $attachment->ID,
						'title'         => 'Image',
						'size'          => 'medium',
						'caption'       => 'This is a caption!',
						'link_type'     => 'post',
					];
				}
				break;
			case 'media_gallery':
				$attachments = get_posts(
					[
						'post_type'      => 'attachment',
						'fields'         => 'ids',
						'numberposts'    => 3,
						'post_mime_type' => 'image',
					]
				);
				if ( ! empty( $attachments ) ) {
					$settings[2] = [
						'title' => 'Gallery',
						'ids'   => $attachments,
					];
				}
				break;
			case 'media_video':
				$attachment = get_page_by_title( 'Accelerated Mobile Pages is now just AMP', OBJECT, 'attachment' );
				if ( $attachment ) {
					$settings[2] = [
						'title'         => 'Video',
						'attachment_id' => $attachment->ID,
					];
				}
				break;
			default:
				$params      = $this->get_widget_params( $widget );
				$settings[2] = [];

				foreach ( $params as $param ) {
					$settings[2][ $param['name'] ] = ( ! empty( $param['default'] ) ) ? $param['default'] : '';
				}

				break;
		}

		$widget->save_settings( $settings );
	}

	/**
	 * To get parameter of widget (that is, widget instance data).
	 *
	 * @param \WP_Widget $widget_object Widget object.
	 *
	 * @return array List of parameter of widget.
	 */
	protected function get_widget_params( $widget_object ) {

		$parameters = [];

		ob_start();
		$widget_object->form( [] );
		$function_body = ob_get_clean();

		$dom    = new Dom( $function_body );
		$inputs = $dom->query( '//input | //textarea | //select' );

		foreach ( $inputs as $input ) {

			if ( empty( $input ) || ! is_a( $input, 'DOMElement' ) ) {
				continue;
			}

			$param_name = strtolower( trim( $input->getAttribute( 'name' ) ) );
			$param_name = str_replace( sprintf( 'widget-%s[%d]', $widget_object->id_base, $widget_object->number ), '', $param_name );
			$param_name = trim( $param_name, '[]' );

			if ( empty( $param_name ) ) {

				$param_name = strtolower( trim( $input->getAttribute( 'id' ) ) );
				$param_name = str_replace( sprintf( 'widget-%s-%d-', $widget_object->id_base, $widget_object->number ), '', $param_name );
				$param_name = trim( $param_name );

			}

			if ( ! empty( $parameters[ $param_name ] ) ) {
				$param = $parameters[ $param_name ];
			} else {
				$param = [ 'name' => $param_name ];
			}

			$param_type = strtolower( trim( $input->tagName ) );

			if ( 'input' === $param_type ) {
				$param_type = strtolower( trim( $input->getAttribute( 'type' ) ) );
			}

			if ( in_array( $param_type, [
				'hidden',
				'password',
				'submit',
				'reset',
				'file',
				'datetime-local',
			], true ) ) {
				continue;
			}

			$param['type'] = $param_type;

			switch ( $param_type ) {
				case 'color':
				case 'date':
				case 'email':
				case 'search':
				case 'tel':
				case 'time':
				case 'url':
				case 'week':
				case 'month':
					$param['format']  = $param_type;
					$param['type']    = 'text';
					$param['default'] = $input->getAttribute( 'value' );

					break;
				case 'checkbox':
					if ( $input->hasAttribute( 'checked' ) ) {
						$param['default'] = true;
					}
					break;
				case 'radio':
					$param['type'] = 'select';

					$param['options']   = ( ! empty( $param['options'] ) && is_array( $param['options'] ) ) ? $param['options'] : [];
					$param['options'][] = $input->getAttribute( 'value' );

					if ( $input->hasAttribute( 'checked' ) ) {
						$param['default'] = $input->getAttribute( 'value' );
					}

					break;
				case 'number':
				case 'range':
					$param['type'] = 'number';

					$attribute_text = [ 'max', 'min', 'step' ];

					$param['default'] = $input->getAttribute( 'value' );

					foreach ( $attribute_text as $text ) {
						$value          = intval( $input->getAttribute( $text ) );
						$param[ $text ] = ( ! empty( $value ) ) ? $value : null;
					}

					if ( empty( $param['default'] ) ) {
						if ( ! empty( $param['max'] ) ) {
							$param['default'] = $param['max'];
						} elseif ( ! empty( $param['min'] ) ) {
							$param['default'] = $param['min'];
						} else {
							$param['default'] = 5;
						}
					}

					break;
				case 'select':
					$param['options'] = [];

					if ( $input->hasChildNodes() ) {

						for ( $index = 0; $index <= $input->childNodes->length; $index ++ ) {
							$option_dom = $input->childNodes->item( $index );

							if ( ! empty( $option_dom ) && is_a( $option_dom, 'DOMElement' ) ) {
								$param['options'][] = $option_dom->getAttribute( 'value' );

								if ( $option_dom->hasAttribute( 'selected' ) ) {
									$param['default'] = $option_dom->getAttribute( 'value' );
								}
							}
						}

						if ( empty( $param['default'] ) ) {

							foreach ( $param['options'] as $option ) {
								if ( ! empty( $option ) ) {
									$param['default'] = $option;
									break;
								}
							}
						}
					}
					break;
				default:
					$param['default'] = $input->getAttribute( 'value' );

					if ( empty( $param['default'] ) ) {
						$param['default'] = 'Some Text.';
					}
			}

			$parameters[ $param['name'] ] = $param;
		}

		return $parameters;
	}
}
