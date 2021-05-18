'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class SiteRequest extends Base {

	/**
	 * Validation rules.
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			uuid: 'string|required',
			site_url: 'string|url|required',
			status: 'string|in:waiting,pending,active,succeeded,failed',
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
			status: 'slug',
		};
	}
}

module.exports = SiteRequest;
