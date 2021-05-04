'use strict';

const Base = use( 'App/Models/Base' );

class ExtensionVersion extends Base {

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
		return 'extension_version_slug';
	}
}

module.exports = ExtensionVersion;
