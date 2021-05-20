'use strict';

const Base = use( 'App/Models/Base' );

class SyntheticJob extends Base {

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
		return 'uuid';
	}

	/**
	 * The foreign key for the model.
	 * Same as Primary key.
	 *
	 * @attribute foreignKey
	 *
	 * @return {String}
	 *
	 */
	static get foreignKey() {
		return 'synthetic_job_uuid';
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			status: 'waiting',
		};
	}
}

module.exports = SyntheticJob;
