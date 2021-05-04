'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ErrorSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'errors', ( table ) => {
			table.string( 'error_slug' ).primary().comment( 'Hash of the error data.' );
			table.string( 'node_name' ).comment( 'AMP error attribute e.g. script' );
			table.string( 'parent_name' ).comment( 'Parent of name' );
			table.string( 'code' ).comment( 'AMP error code e.g. DISALLOWED_TAG' );
			table.string( 'type' ).comment( 'e.g. js_error | css | html_tag | html_attribute' );
			table.string( 'node_type' ).comment( 'AMP error attribute.' );
			table.text( 'node_attributes' );
			table.text( 'element_attributes' );
			table.string( 'spec_name' );
			table.string( 'text' );
			table.string( 'sources' );
			table.string( 'attributes' );
			table.string( 'attribute' );
			table.string( 'url' );
			table.string( 'message' );
			table.string( 'meta_property_name' );
			table.string( 'css_property_value' );
			table.string( 'css_property_name' );
			table.string( 'layout' );
			table.string( 'tag_spec' );
			table.string( 'meta_property_value' );
			table.string( 'required_ancestor_name' );
			table.string( 'at_rule' );
			table.string( 'meta_property_required_value' );
			table.string( 'disallowed_ancestor' );
			table.string( 'class_name' );
			table.string( 'mandatory_oneof_attrs' );
			table.string( 'css_selector' );
			table.string( 'required_parent_name' );
			table.string( 'first_child_tag' );
			table.string( 'child_tag' );
			table.string( 'children_count' );
			table.string( 'duplicate_oneof_attrs' );
			table.string( 'foo' );
			table.string( 'allowed_descendants' );
			table.string( 'spec_names' );
			table.string( 'required_attr_value' );
			table.string( 'mandatory_anyof_attrs' );
			table.string( 'duplicate_dimensions' );
			table.string( 'required_min_child_count' );
			table.string( 'required_child_count' );
			table.string( 'item' );
			table.string( 'extra' );
			table.specificType( 'raw_data', 'mediumblob' ).notNullable();
			table.timestamp( 'created_at' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'errors' );
	}
}

module.exports = ErrorSchema;
