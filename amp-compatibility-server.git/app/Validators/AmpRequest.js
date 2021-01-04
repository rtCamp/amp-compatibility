'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class AmpRequest extends Base {

	/**
	 * Validation rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/syntax-guide
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			site_url: 'url|required',

			/**
			 * Site info
			 */
			'site_info.site_url': 'url',
			'site_info.site_title': 'string',
			'site_info.php_version': 'version',
			'site_info.mysql_version': 'version',
			'site_info.wp_version': 'version',
			'site_info.wp_language': 'string',
			'site_info.wp_https_status': 'boolean',
			'site_info.wp_multisite': 'in:subdomain,subdir,single',

			// Active theme
			'site_info.wp_active_theme.name': 'string',
			'site_info.wp_active_theme.slug': 'string',
			'site_info.wp_active_theme.version': 'version',
			'site_info.wp_active_theme.status': 'string',
			'site_info.wp_active_theme.tags': 'object',
			'site_info.wp_active_theme.text_domain': 'string',
			'site_info.wp_active_theme.requires_wp': 'version',
			'site_info.wp_active_theme.requires_php': 'version',
			'site_info.wp_active_theme.theme_url': 'url',
			'site_info.wp_active_theme.author': 'string',
			'site_info.wp_active_theme.author_url': 'url',
			'site_info.wp_active_theme.is_active': 'boolean',
			'site_info.wp_active_theme.parent_theme': 'string',

			'site_info.object_cache_status': 'boolean',
			'site_info.libxml_version': 'version',
			'site_info.is_defined_curl_multi': 'boolean',
			'site_info.stylesheet_transient_caching': 'boolean',
			'site_info.loopback_requests': 'string',
			'site_info.amp_mode': 'in:standard,reader,transitional,off',
			'site_info.amp_version': 'version',
			'site_info.amp_plugin_configured': 'boolean',
			'site_info.amp_all_templates_supported': 'boolean',
			'site_info.amp_supported_post_types': 'array',
			'site_info.amp_supported_templates': 'array',
			'site_info.amp_mobile_redirect': 'boolean',
			'site_info.amp_reader_theme': 'string',

			/**
			 * Plugins
			 */
			'plugins.*.name': 'string',
			'plugins.*.slug': 'string',
			'plugins.*.plugin_url': 'url',
			'plugins.*.version': 'version',
			'plugins.*.author': 'string',
			'plugins.*.author_url': 'url',
			'plugins.*.requires_wp': 'version',
			'plugins.*.requires_php': 'version',
			'plugins.*.is_active': 'boolean',
			'plugins.*.is_network_active': 'boolean',
			'plugins.*.is_suppressed': 'version',

			/**
			 * Themes
			 */
			'themes.*.name': 'string',
			'themes.*.slug': 'string',
			'themes.*.version': 'version',
			'themes.*.status': 'string',
			'themes.*.tags': 'object',
			'themes.*.text_domain': 'string',
			'themes.*.requires_wp': 'version',
			'themes.*.requires_php': 'version',
			'themes.*.theme_url': 'url',
			'themes.*.author': 'string',
			'themes.*.author_url': 'url',
			'themes.*.is_active': 'boolean',
			'themes.*.parent_theme': 'string',

			/**
			 * Errors
			 */
			'errors.*.code': 'string',
			'errors.*.error_slug': 'string',

			/**
			 * Error sources
			 */
			'error_sources.*.error_slug': 'string|required',
			'error_sources.*.error_source_slug': 'string|required',
			//'error_sources.*.extension_version_slug': 'string|required',
			'error_sources.*.type': 'in:plugin,theme,block,core',
			'error_sources.*.name': 'string',
			'error_sources.*.file': 'string',
			'error_sources.*.line': 'integer',
			'error_sources.*.function': 'string',
			'error_sources.*.hook': 'string',
			'error_sources.*.sources': 'array',
			'error_sources.*.block_attrs': 'object',

			/**
			 * URLs
			 */
			'urls.*.urls': 'url|required',
			'urls.*.errors.*.error_slug': 'string|required',
			'urls.*.errors.*.sources.*': 'string|required',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {};
	}

}

module.exports = AmpRequest;
