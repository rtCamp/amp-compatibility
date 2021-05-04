'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use( 'Schema' );

class AuthorSchema extends Schema {
	up() {
		this.create( 'authors', ( table ) => {
			table.string( 'user_nicename' ).comment( 'Author\'s nice name e.g. themepalace' );
			table.string( 'display_name' ).comment( 'Author\'s display name `Theme palace`' );
			table.string( 'profile' ).unique().comment( 'Author\'s profile URL. e.g. https://profiles.wordpress.org/themepalace' );
			table.string( 'avatar' ).comment( 'Author\'s avatar URL. e.g. https://secure.gravatar.com/avatar/0c5bb2d366c231814fdd29647f813ff1?s=96&d=monsterid&r=g' );
			table.string( 'status' ).comment( 'Communication status with AMP team.' );
		} );
	}

	down() {
		this.drop( 'authors' );
	}
}

module.exports = AuthorSchema;
