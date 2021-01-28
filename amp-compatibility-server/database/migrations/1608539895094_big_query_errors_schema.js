'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );
const BigQuery = use( 'App/BigQuery' );

class BigQueryErrorsSchema extends Schema {
	/**
	 * Table name
	 *
	 * @returns {string} Table name.
	 */
	get table() {
		return 'errors';
	}

	/**
	 * Table schema for BigQuery.
	 *
	 * @returns {{fields: *[]}} Fields.
	 */
	get schema() {
		return {
			fields: [
				{
					name: 'error_slug',
					type: 'STRING',
					mode: 'REQUIRED',
					description: 'Encrypted hash of the JSON stringify error data.',
				},
				{
					name: 'node_name',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'AMP error attribute e.g. script',
				},
				{
					name: 'parent_name',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'Parent of name',
				},
				{
					name: 'code',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'AMP error code e.g. DISALLOWED_TAG',
				},
				{
					name: 'type',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'e.g. js_error | css | html_tag | html_attribute',
				},
				{
					name: 'node_type',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'AMP error attribute.',
				},
				{
					name: 'node_attributes',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'AMP error attribute.',
				},
				{
					name: 'element_attributes',
					type: 'STRING',
					mode: 'NULLABLE',
					description: 'AMP error attribute.',
				},
				{
					name: 'spec_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'text',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'sources',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'attributes',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'attribute',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'url',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'message',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'meta_property_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'css_property_value',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'css_property_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'layout',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'tag_spec',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'meta_property_value',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'required_ancestor_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'at_rule',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'meta_property_required_value',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'disallowed_ancestor',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'class_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'mandatory_oneof_attrs',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'css_selector',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'required_parent_name',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'first_child_tag',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'child_tag',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'children_count',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'duplicate_oneof_attrs',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'foo',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'allowed_descendants',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'spec_names',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'required_attr_value',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'mandatory_anyof_attrs',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'duplicate_dimensions',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'required_min_child_count',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'required_child_count',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'item',
					type: 'STRING',
					mode: 'NULLABLE',
				},
				{
					name: 'extra',
					type: 'STRING',
					mode: 'NULLABLE',
				},
			],
		};
	}

	/**
	 * To create table.
	 *
	 * @return void
	 */
	async up() {
		await BigQuery.createTable( this.table, this.schema );
	}

	/**
	 * To drop table.
	 *
	 * @return void.
	 */
	async down() {
		await BigQuery.dropTable( this.table );
	}
}

module.exports = BigQueryErrorsSchema;
