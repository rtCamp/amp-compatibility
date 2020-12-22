'use strict';

const BigQueryBase = use( 'App/Models/BigQueryBase' );

class BigQueryAuthor extends BigQueryBase {

	/**
	 * Table name that represented by model.
	 *
	 * @returns {string} Table name.
	 */
	static get table() {
		return 'authors';
	}

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static get primaryKey() {
		return 'author_profile';
	}

	/**
	 * Table schema for BigQuery.
	 *
	 * @returns {Object} Table fields.
	 */
	static get fields() {
		return {
			author_profile: {
				type: 'string',
				required: true,
			},
			user_nicename: {
				type: 'string',
				required: true,
			},
			avatar: {
				type: 'string',
				required: false,
				default: '',
			},
			display_name: {
				type: 'string',
				required: false,
				default: '',
			},
			status: {
				type: 'string',
				required: false,
				default: '',
			},
		};
	}

}

module.exports = BigQueryAuthor;
