'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class ErrorSourceSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'error_sources', ( table ) => {
			table.string( 'error_source_slug' ).primary().comment( 'Hash of error source.' );
			table.string( 'type' ).comment( 'plugin|theme|block' );
			table.string( 'extension_version_slug' ).notNullable();
			table.string( 'name' ).comment( 'e.g. gravityforms' );
			table.string( 'file' ).comment( 'e.g. gravityforms.php' );
			table.integer( 'line' ).unsigned().comment( 'Line number e.g. 276' );
			table.string( 'function' ).comment( 'function name e.g. GFForms::init' );
			table.string( 'hook' ).comment( 'WordPress hook e.g. init' );
			table.integer( 'priority' ).unsigned().comment( 'e.g. 10' );
			table.string( 'dependency_type' ).comment( 'e.g. script' );
			table.string( 'handle' ).comment( 'e.g. gform_masked_input' );
			table.string( 'dependency_handle' );
			table.string( 'extra_key' );
			table.specificType( 'text', 'mediumblob' );
			table.string( 'filter' );
			table.string( 'sources' );
			table.string( 'block_name' );
			table.string( 'block_content_index' );
			table.text( 'block_attrs', 'longtext' );
			table.string( 'shortcode' );
			table.specificType( 'raw_data', 'mediumblob' ).notNullable();
			table.timestamp( 'created_at' );

			table.foreign( 'extension_version_slug' ).references( 'extension_versions.extension_version_slug' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'error_sources' );
	}
}

module.exports = ErrorSourceSchema;
