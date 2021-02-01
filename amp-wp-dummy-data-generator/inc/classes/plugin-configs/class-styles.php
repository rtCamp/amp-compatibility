<?php
/**
 * Styles config file.
 *
 * @package amp-wp-dummy-data-generator
 */

namespace AMP_WP_Dummy_Data_Generator\Inc\Plugin_Configs;

use AMP_WP_Dummy_Data_Generator\Inc\Config_Base;

/**
 * Class Styles
 */
class Styles extends Config_Base {

	/**
	 * Name of theme/plugin.
	 *
	 * @var string
	 */
	public $name = 'styles';

	/**
	 * List of cli command that need to execute before importing.
	 *
	 * @return array
	 */
	public function get_before_cli_commands() {
		return array(
			'wp plugin install styles-twentyeleven --activate',
			'wp theme install twentyeleven --activate',
			'wp option update storm-styles-twentyeleven-css "@import \'//fonts.googleapis.com/css?family=PT\2bSans\2bNarrow\3aregular,700\';.widget-title,.entry-meta{line-height:1.5}h1.showcase-heading{line-height:1}.featured-posts section.featured-post{background:transparent}html,body.styles{background-color:#435931}.styles #page{background-color:#e3ede3;font-size:28px;font-family:PT Sans Narrow}.styles #access{background-color:#234214;background-image:none}.styles #access ul,.styles #access ul > li > a{font-size:22px;font-family:Courier, monospace}"';
			'wp option update storm-styles-twentyeleven \'a:2:{s:9:"st_global";a:3:{s:41:"outerareabackgroundcolor_background_color";s:7:"#435931";s:41:"innerareabackgroundcolor_background_color";s:7:"#e3ede3";s:16:"defaulttext_text";a:2:{s:9:"font_size";s:2:"28";s:11:"font_family";s:260:"{"family":"PT Sans Narrow","name":"PT Sans Narrow","import_family":"PT+Sans+Narrow:regular,700","classname":"ptsansnarrow","png_url":"https://amp-compatibility.local/wp-content/plugins/styles/classes/styles-font-menu/styles-fonts/png/ptsansnarrow-regular.png"}";}}s:14:"st_menuprimary";a:2:{s:36:"areabackgroundcolor_background_color";s:7:"#234214";s:16:"topitemtext_text";a:2:{s:9:"font_size";s:2:"22";s:11:"font_family";s:70:"{"family":"Courier, monospace","name":"Courier","classname":"courier"}";}}}\'';
		);
	};

	/**
	 * Get list of file name that need to import for plugin.
	 * key contain file name store as in 'data' directory
	 * Where value contain url from where it downloads.
	 *
	 * @return array List of file name.
	 */
	public function get_import_files() {

		return [];
	}

}