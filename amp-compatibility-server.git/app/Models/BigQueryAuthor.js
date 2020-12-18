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
		return 'user_nicename';
	}

	/**
	 * Table schema for BigQuery.
	 *
	 * @returns {{fields: *[]}} Fields.
	 */
	static get fields() {
		return {
			profile: {
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
