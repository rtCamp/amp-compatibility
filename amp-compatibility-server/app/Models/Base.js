'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use( 'Model' );

class Base extends Model {

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
		return '';
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
		return this.primaryKey;
	}

}

module.exports = Base;
