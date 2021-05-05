'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class AmpValidatedUrl extends Base {

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
			page_url: 'url|required',
			object_type: 'string|in:post,term,user,search,404,post_type',
			object_subtype: 'string',
			css_size_before: 'float|required',
			css_size_after: 'float|required',
			css_size_excluded: 'float|required',
			css_budget_percentage: 'float|required',
			site_request_id: 'string|required',
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
			page_url: 'to_url',
			object_type: 'slug',
			object_subtype: 'slug',
			css_size_before: 'to_float',
			css_size_after: 'to_float',
			css_size_excluded: 'to_float',
			css_budget_percentage: 'to_float',
		};
	}
}

module.exports = AmpValidatedUrl;
