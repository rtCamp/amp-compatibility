'use strict';

const Base = use( 'App/Models/Base' );

class SiteRequest extends Base {

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
		return 'site_request_id';
	}

	/**
	 * The attribute name for updated at timestamp.
	 * Disable updated at column for current table.
	 *
	 * @attribute updatedAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get updatedAtColumn() {
		return '';
	}

}

module.exports = SiteRequest;
