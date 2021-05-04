'use strict';

const Base = use( 'App/Models/Base' );

class SiteToExtension extends Base {

	/**
	 * The attribute name for created at timestamp.
	 * Disable created at column for current table.
	 *
	 * @attribute createdAtColumn
	 *
	 * @return {String}
	 *
	 * @static
	 */
	static get createdAtColumn() {
		return '';
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

module.exports = SiteToExtension;
