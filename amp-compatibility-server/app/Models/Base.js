'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use( 'Model' );

// Utilities
const Utility = use( 'App/Helpers/Utility' );
const _ = require( 'underscore' );

class Base extends Model {

	/**
	 * Model boot.
	 *
	 * @return void
	 */
	static boot() {
		super.boot();

		this.addHook( 'beforeSave', async ( instance ) => {
			await instance.sanitize();
		} );

		this.addHook( 'beforeCreate', async ( instance ) => {
			await instance.setPrimaryValue();
		} );

		this.addHook( 'beforeSave', async ( instance ) => {
			await instance.validate();
		} );

		/**
		 * Add support of hook for child class.
		 */
		const events = [
			'beforeCreate',
			'afterCreate',
			'beforeUpdate',
			'afterUpdate',
			'beforeSave',
			'afterSave',
			'beforeDelete',
			'afterDelete',
		];

		for ( const index in events ) {
			const event = events[ index ];

			this.addHook( event, async ( instance ) => {

				if ( instance[ event ] ) {
					await instance[ event ]();
				}
			} );

		}

	}

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

	/**
	 * Tell Lucid whether primary key is supposed to be incrementing
	 * or not. If `false` is returned then you are responsible for
	 * setting the `primaryKeyValue` for the model instance.
	 *
	 * @attribute incrementing
	 *
	 * @return {Boolean}
	 *
	 * @static
	 */
	static get incrementing() {
		return false;
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return false;
	}

	static async getIfExists( item ) {

		const primaryKey = this.primaryKey;

		if ( _.isEmpty( item ) || ! _.isObject( item ) ) {
			throw {
				message: 'Please provide valid object',
				data: item,
			};
		}

		if ( _.isEmpty( item[ primaryKey ] ) && 'function' === typeof this.getPrimaryValue ) {

			item[ primaryKey ] = this.getPrimaryValue( item );
		}

		if ( _.isEmpty( item[ primaryKey ] ) ) {
			throw {
				message: 'Primary key is missing and not able to set.',
				data: item,
			};
		}

		if ( this.validator ) {
			item = await this.validator.sanitize( item );
		}

		const instance = await this.find( item[ primaryKey ] );

		return instance ? instance : false;
	}

	/**
	 * To create record if not exists otherwise find and update the record.
	 *
	 * @static
	 *
	 * @param {object} item Record data.
	 * @param {object} trx Transaction object to be used
	 *
	 * @return {Promise<boolean>} Whether or not the model was persisted
	 */
	static async save( item, trx ) {

		let instance = await this.getIfExists( item );

		if ( ! instance ) {
			instance = ( new this() );
		}

		instance.merge( item );

		return ( await instance.save( trx ) );

	}

	/**
	 * To create record if not exists.
	 *
	 * @static
	 *
	 * @param {object} item Record data.
	 * @param {object} trx Transaction object to be used
	 *
	 * @return {Promise<boolean>} Whether or not the model was persisted
	 */
	static async createIfNotExists( item, trx ) {

		const instance = await this.getIfExists( item );

		if ( instance ) {
			return false;
		}

		await this.create( item, trx );

		return true;
	}

	/**
	 * To sanitize the model object.
	 *
	 * @return {Promise<void>}
	 */
	async sanitize() {

		if ( ! this.constructor.validator ) {
			return;
		}

		let item = this.toObject();
		item = await this.constructor.validator.sanitize( item );

		this.merge( item );

	}

	/**
	 * To set primary value based on model object.
	 *
	 * @return {Promise<void>}
	 */
	async setPrimaryValue() {

		if ( this.constructor.getPrimaryValue ) {
			this.primaryKeyValue = this.constructor.getPrimaryValue( this.toObject() );
		}

	}

	/**
	 * To validate the model.
	 *
	 * @return {Promise<void>}
	 */
	async validate() {

		if ( ! this.constructor.validator ) {
			return;
		}

		const item = this.toObject();
		const validation = await this.constructor.validator.validateAll( item );

		if ( validation.fails() ) {
			console.trace( item );
			console.table( validation.messages() );

			throw 'Validation failed';
		}
	}

}

module.exports = Base;
