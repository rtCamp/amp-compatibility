'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class Author extends Base {

	/**
	 * Validation rules.
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			profile: 'url|required',
			user_nicename: 'string',
			avatar: 'url',
			display_name: 'string',
			status: 'string',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			profile: 'to_url',
			user_nicename: 'slug',
			avatar: 'to_url',
			display_name: 'strip_tags',
			status: 'slug',
		};
	}

}

module.exports = Author;
