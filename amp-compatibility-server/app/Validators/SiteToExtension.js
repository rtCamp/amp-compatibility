'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class SiteToExtension extends Base {

	/**
	 * Validation rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/syntax-guide
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			hash: 'string|required',
			site_url: 'string|url|required',
			extension_version_slug: 'string|required',
			amp_suppressed: 'version',
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
			extension_version_slug: 'slug',
			amp_suppressed: 'version',
		};
	}
}

module.exports = SiteToExtension;
