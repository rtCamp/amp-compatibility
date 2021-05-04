'use strict';

const Base = use( 'App/Models/Base' );

class Extension extends Base {

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
		return 'extension_slug';
	}
}

module.exports = Extension;
