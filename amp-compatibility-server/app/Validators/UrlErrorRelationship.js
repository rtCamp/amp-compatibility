'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class UrlErrorRelationship extends Base {

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
			page_url: 'string|url|required',
			error_slug: 'string|required',
			error_source_slug: 'string|required',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			page_url: 'to_url',
			error_slug: 'slug',
			error_source_slug: 'slug',
		};
	}
}

module.exports = UrlErrorRelationship;
