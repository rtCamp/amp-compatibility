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
			site_request_id: 'string|required',
			site_url: 'string|url|required',
			status: 'string|in:pending,success,fail',
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
