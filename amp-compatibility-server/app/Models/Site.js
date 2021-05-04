'use strict';

const Base = use( 'App/Models/Base' );

class Site extends Base {

	/**
	 * The primary key for the model.
	 *
	 * @attribute primaryKey
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get primaryKey() {
		return 'site_url';
	}
}

module.exports = Site;
