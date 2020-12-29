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
			object_type: 'string|in:post_type,taxonomy,search,404|required',
			object_subtype: 'string|required',
			css_size_before: 'string|required',
			css_size_after: 'string|required',
			css_size_excluded: 'string|required',
			css_budget_percentage: 'string|required',
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
			page_url: 'to_url',
			object_type: 'escape',
			object_subtype: 'escape',
			css_size_before: 'escape',
			css_size_after: 'escape',
			css_size_excluded: 'to_float',
			css_budget_percentage: 'to_float',
			updated_at: 'date',
		};
	}
}

module.exports = AmpValidatedUrl;
