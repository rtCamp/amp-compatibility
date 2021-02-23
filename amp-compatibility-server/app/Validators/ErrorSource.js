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
			hook: 'string',
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
			name: 'strip_tags',
			file: 'strip_tags',
			line: 'to_int',
			function: 'strip_tags',
			hook: 'strip_tags',
			priority: 'to_int',
			dependency_type: 'strip_tags',
			handle: 'strip_tags',
			dependency_handle: 'strip_tags',
			extra_key: 'strip_tags',
			text: 'strip_tags',
			filter: 'strip_tags',
			sources: 'to_json',
			block_name: 'strip_tags',
			block_content_index: 'strip_tags',
			block_attrs: 'to_json',
			shortcode: 'strip_tags',
		};
	}
}

module.exports = ErrorSource;
