'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class ExtensionVersion extends Base {

	/**
	 * Validation rules.
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			extension_version_slug: 'string|required',
			extension_slug: 'string|required',
			type: 'string|in:plugin,theme|required',
			slug: 'string|required',
			version: 'version|required',
			verification_status: 'string|in:fail,unknown,pass,auto_pass',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			extension_version_slug: 'slug',
			extension_slug: 'slug',
			type: 'slug',
			slug: 'slug',
			version: 'version',
			verification_status: 'slug',
		};
	}
}

module.exports = ExtensionVersion;
