'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class Extension extends Base {

	/**
	 * Validation rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/syntax-guide
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			extension_slug: 'string|required',
			wporg: 'boolean',
			type: 'in:plugin,theme|required',
			name: 'string|required',
			slug: 'string|required',
			latest_version: 'version|required',
			requires_wp: 'version',
			tested_wp: 'version',
			requires_php: 'version',
			average_rating: 'float',
			support_threads: 'integer',
			support_threads_resolved: 'integer',
			active_installs: 'integer',
			downloaded: 'integer',
			last_updated: 'date',
			date_added: 'date',
			homepage_url: 'string', // Not all plugin/theme provides valid url but we still want to store that.
			short_description: 'string',
			download_url: 'url',
			author_url: 'string', // Not all plugin/theme provides valid url but we still want to store that.
			extension_url: 'url',
			preview_url: 'url',
			screenshot_url: 'url',
			tags: 'string',
			icon_url: 'url',
		};
	}

	/**
	 * Custom validation messages.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/custom-messages
	 *
	 * @returns Object
	 */
	static get messages() {
		return {};
	}

	/**
	 * Sanitization rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/escape
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			extension_slug: 'slug',
			wporg: 'to_boolean',
			type: 'slug',
			//name: 'strip_tags',
			slug: 'slug',
			latest_version: 'version',
			requires_wp: 'version',
			tested_wp: 'version',
			requires_php: 'version',
			average_rating: 'to_float',
			support_threads: 'to_int',
			support_threads_resolved: 'to_int',
			active_installs: 'to_int',
			downloaded: 'to_int',
			last_updated: 'to_date',
			date_added: 'to_date',
			homepage_url: 'to_url',
			//short_description: 'strip_tags',
			download_url: 'to_url',
			author_url: 'to_url',
			extension_url: 'to_url',
			preview_url: 'to_url',
			screenshot_url: 'to_url',
			icon_url: 'to_url',
		};
	}
}

module.exports = Extension;
