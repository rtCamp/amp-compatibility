'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class Site extends Base {

	/**
	 * Validation rules.
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			site_url: 'string|url|required',
			site_title: 'string|required',
			php_version: 'string|required',
			mysql_version: 'string',
			wp_version: 'string|required',
			wp_language: 'string|required',
			wp_https_status: 'boolean|required',
			wp_multisite: 'string|in:subdomain,subdir,single|required',
			wp_active_theme: 'string|required',
			object_cache_status: 'boolean|required',
			libxml_version: 'number',
			is_defined_curl_multi: 'boolean|required',
			stylesheet_transient_caching: 'boolean|required',
			loopback_requests: 'boolean|required',
			amp_mode: 'string|in:standard,reader,transitional,off|required',
			amp_version: 'string|required',
			amp_plugin_configured: 'boolean|required',
			amp_all_templates_supported: 'boolean|required',
			amp_supported_post_types: 'string|required',
			amp_supported_templates: 'string|required',
			amp_mobile_redirect: 'boolean|required',
			amp_reader_theme: 'boolean|required',
			is_synthetic_data: 'boolean|required',
			updated_at: 'date|required',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			site_url: 'to_url',
			site_title: 'escape',
			php_version: 'version',
			mysql_version: 'version',
			wp_version: 'version',
			wp_language: 'slug',
			wp_https_status: 'to_boolean',
			wp_multisite: 'slug',
			wp_active_theme: 'slug',
			object_cache_status: 'to_boolean',
			libxml_version: 'version',
			is_defined_curl_multi: 'to_boolean',
			stylesheet_transient_caching: 'to_boolean',
			loopback_requests: 'to_boolean',
			amp_mode: 'slug',
			amp_version: 'version',
			amp_plugin_configured: 'to_boolean',
			amp_all_templates_supported: 'to_boolean',
			amp_mobile_redirect: 'to_boolean',
			amp_reader_theme: 'to_boolean',
			is_synthetic_data: 'to_boolean',
			updated_at: 'to_date',
		};
	}
}

module.exports = Site;
