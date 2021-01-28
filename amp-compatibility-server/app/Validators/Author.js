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
			author_profile: 'url|required',
			user_nicename: 'string|required',
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
			author_profile: 'to_url',
			user_nicename: 'slug',
			avatar: 'to_url',
			display_name: 'escape',
			status: 'slug',
		};
	}

}

module.exports = Author;
