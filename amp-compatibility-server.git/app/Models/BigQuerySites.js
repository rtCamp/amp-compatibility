'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );

class BigQuerySites extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'sites';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'site_url';
	}

	/**
	 * Table schema for BigQuery.
	 *
	 * @returns {Object} Table fields.
	 */
	static get fields() {
		return {
			site_url: {
				type: 'string',
				required: true,
			},
			site_title: {
				type: 'string',
				required: true,
				default: '',
			},
			php_version: {
				type: 'string',
				required: true,
			},
			mysql_version: {
				type: 'string',
				required: true,
			},
			wp_version: {
				type: 'string',
				required: true,
			},
			wp_language: {
				type: 'string',
				required: true,
				default: 'en_US',
			},
			wp_https_status: {
				type: 'boolean',
				required: true,
				default: false,
			},
			wp_multisite: {
				type: 'string',
				required: true,
				default: false,
			},
			wp_active_theme: {
				type: 'string',
				required: true,
			},
			object_cache_status: {
				type: 'boolean',
				required: true,
				default: false,
			},
			libxml_version: {
				type: 'string',
				mode: 'NULLABLE',
			},
			is_defined_curl_multi: {
				type: 'boolean',
				required: true,
				default: false,
			},
			stylesheet_transient_caching: {
				type: 'boolean',
				required: true,
				default: false,
			},
			loopback_requests: {
				type: 'boolean',
				required: true,
				default: false,
			},
			amp_mode: {
				type: 'string',
				required: true,
				default: false,
			},
			amp_version: {
				type: 'string',
				required: true,
			},
			amp_plugin_configured: {
				type: 'boolean',
				required: true,
				default: false,
			},
			amp_all_templates_supported: {
				type: 'boolean',
				required: true,
				default: false,
			},
			amp_supported_post_types: {
				type: 'string',
				required: true,
				default: false,
			},
			amp_supported_templates: {
				type: 'string',
				required: true,
				default: false,
			},
			amp_mobile_redirect: {
				type: 'boolean',
				required: true,
				default: false,
			},
			amp_reader_theme: {
				type: 'boolean',
				required: true,
				default: false,
			},
			is_synthetic_data: {
				type: 'boolean',
				required: true,
				default: false,
			},
			updated_at: {
				type: 'DATETIME',
				required: true,
			},
		};
	}

}

module.exports = BigQuerySites;
