'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class AuthorRelationship extends Base {

	/**
	 * Validation rules.
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			hash: 'string|required',
			extension_slug: 'string|required',
			author_profile: 'url|required',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			extension_slug: 'slug',
			author_profile: 'to_url',
		};
	}

}

module.exports = AuthorRelationship;
