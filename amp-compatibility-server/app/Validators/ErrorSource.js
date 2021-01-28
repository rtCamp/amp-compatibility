'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class ErrorSource extends Base {

	/**
	 * Validation rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/syntax-guide
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			error_source_slug: 'string|required',
			extension_version_slug: 'string|required',
			type: 'in:plugin,theme,block|required',
			name: 'string|required',
			file: 'string|required',
			line: 'integer|required',
			function: 'string|required',
			hook: 'string|required',
			priority: 'integer',
			dependency_type: 'string',
			handle: 'string',
			dependency_handle: 'string',
			extra_key: 'string',
			text: 'string',
			filter: 'string',
			sources: 'string',
			block_name: 'string',
			block_content_index: 'string',
			block_attrs: 'string',
			shortcode: 'string',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			error_source_slug: 'slug',
			extension_version_slug: 'slug',
			type: 'slug',
			name: 'escape',
			file: 'escape',
			line: 'to_int',
			function: 'escape',
			hook: 'escape',
			priority: 'to_int',
			dependency_type: 'escape',
			handle: 'escape',
			dependency_handle: 'escape',
			extra_key: 'escape',
			text: 'escape',
			filter: 'escape',
			sources: 'to_json',
			block_name: 'escape',
			block_content_index: 'escape',
			block_attrs: 'to_json',
			shortcode: 'escape',
		};
	}
}

module.exports = ErrorSource;
