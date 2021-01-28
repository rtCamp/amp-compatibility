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
			text: 'string',
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
			// node_name: 'escape',
			// parent_name: 'escape',
			// code: 'escape',
			// type: 'escape',
			// node_type: 'escape',
			node_attributes: 'to_json',
			element_attributes: 'to_json',
			// spec_name: 'escape',
			// text: 'escape',
			// sources: 'escape',
			// attributes: 'escape',
			// attribute: 'escape',
			url: 'to_url',
			// message: 'escape',
			// meta_property_name: 'escape',
			// css_property_value: 'escape',
			// css_property_name: 'escape',
			// layout: 'escape',
			// tag_spec: 'escape',
			// meta_property_value: 'escape',
			// required_ancestor_name: 'escape',
			// at_rule: 'escape',
			// meta_property_required_value: 'escape',
			// disallowed_ancestor: 'escape',
			// class_name: 'escape',
			// mandatory_oneof_attrs: 'escape',
			// css_selector: 'escape',
			// required_parent_name: 'escape',
			// first_child_tag: 'escape',
			// child_tag: 'escape',
			// children_count: 'escape',
			// duplicate_oneof_attrs: 'escape',
			// foo: 'escape',
			// allowed_descendants: 'escape',
			// spec_names: 'escape',
			// required_attr_value: 'escape',
			// mandatory_anyof_attrs: 'escape',
			// duplicate_dimensions: 'escape',
			// required_min_child_count: 'escape',
			// required_child_count: 'escape',
			// item: 'escape',
			// extra: 'escape',
		};
	}
}

module.exports = Error;
