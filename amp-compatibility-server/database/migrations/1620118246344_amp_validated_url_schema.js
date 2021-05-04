'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class AmpValidatedUrlSchema extends Schema {

	/**
	 * To create MySQL Table.
	 */
	up() {
		this.create( 'amp_validated_urls', ( table ) => {
			table.string( 'site_url' ).notNullable();
			table.string( 'page_url' ).primary().comment( 'Page url without protocol. e.g. amp-wp.test/sample-page' );
			table.string( 'object_type' ).comment( 'Anything from post_type,taxonomy,search,404' );
			table.string( 'object_subtype' ).comment( 'Name of post type or taxonomy.' );
			table.integer( 'css_size_before' ).defaultTo( 0 ).comment( 'Total CSS size prior to minification => "213,812 Bytes"' );
			table.integer( 'css_size_after' ).defaultTo( 0 ).comment( 'Total CSS size after minification => "39,371 B"' );
			table.integer( 'css_size_excluded' ).defaultTo( 0 ).comment( 'Excluded minified CSS size (0 stylesheets) => "0 Bytes"' );
			table.float( 'css_budget_percentage' ).defaultTo( 0 ).comment( 'Percentage of used CSS budget (75KB) => "52.0%"' );
			table.string( 'site_request_id' ).notNullable();
			table.timestamps();

			table.foreign( 'site_url' ).references( 'sites.site_url' );
			table.foreign( 'site_request_id' ).references( 'site_requests.site_request_id' );
		} );
	}

	/**
	 * To drop MySQL Table.
	 */
	down() {
		this.drop( 'amp_validated_urls' );
	}
}

module.exports = AmpValidatedUrlSchema;
