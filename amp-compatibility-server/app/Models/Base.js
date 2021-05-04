'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use( 'Model' );

class Base extends Model {

	static get validator() {

	}

	static get foreignKey() {
		return this.primaryKey;
	}

}

module.exports = Base;
