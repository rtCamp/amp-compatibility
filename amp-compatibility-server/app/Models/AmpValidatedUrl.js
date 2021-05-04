'use strict';

const Base = use( 'App/Models/Base' );

class AmpValidatedUrl extends Base {

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
		return 'page_url';
	}
}

module.exports = AmpValidatedUrl;
