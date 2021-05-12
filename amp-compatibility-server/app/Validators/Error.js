'use strict';

/** @type {typeof import('./Base')} */
const Base = use( 'App/Validators/Base' );

class Error extends Base {

	/**
	 * Validation rules.
	 *
	 * Reference: https://indicative-v5.adonisjs.com/docs/syntax-guide
	 *
	 * @returns Object
	 */
	static get rules() {
		return {
			error_slug: 'string|required',
			node_name: 'string',
			parent_name: 'string',
			code: 'string',
			type: 'string',
			node_type: 'string',
			node_attributes: 'string',
			element_attributes: 'string',
			spec_name: 'string',
			sources: 'string',
			attributes: 'string',
			attribute: 'string',
			url: 'string',
			message: 'string',
			meta_property_name: 'string',
			css_property_value: 'string',
			css_property_name: 'string',
			layout: 'string',
			tag_spec: 'string',
			meta_property_value: 'string',
			required_ancestor_name: 'string',
			at_rule: 'string',
			meta_property_required_value: 'string',
			disallowed_ancestor: 'string',
			class_name: 'string',
			mandatory_oneof_attrs: 'string',
			css_selector: 'string',
			required_parent_name: 'string',
			first_child_tag: 'string',
			child_tag: 'string',
			children_count: 'string',
			duplicate_oneof_attrs: 'string',
			foo: 'string',
			allowed_descendants: 'string',
			spec_names: 'string',
			required_attr_value: 'string',
			mandatory_anyof_attrs: 'string',
			duplicate_dimensions: 'string',
			required_min_child_count: 'string',
			required_child_count: 'string',
			item: 'string',
			extra: 'string',
		};
	}

	/**
	 * Sanitization rules.
	 *
	 * @returns Object
	 */
	static get sanitizationRules() {
		return {
			error_slug: 'slug',
			spec_names: 'to_json',
			node_attributes: 'to_json',
			attributes: 'to_json',
			element_attributes: 'to_json',
			mandatory_oneof_attrs: 'to_json',
			mandatory_anyof_attrs: 'to_json',
			duplicate_oneof_attrs: 'to_json',
			url: 'to_url',
		};
	}
}

module.exports = Error;
