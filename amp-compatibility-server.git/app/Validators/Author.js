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
			profile: 'required|string',
			user_nicename: 'required|string',
			avatar: 'string',
			display_name: 'required|string',
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
