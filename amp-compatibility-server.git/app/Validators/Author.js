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
			profile: 'string|required',
			user_nicename: 'string|required',
			avatar: 'string',
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
			user_nicename: 'slug',
			display_name: 'slug',
		};
	}

}

module.exports = Author;
