'use strict';

const Base = use( 'App/Models/Base' );

class SiteRequest extends Base {

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
