'use strict';

const Database = use( 'Database' );

const Base = use( 'App/Models/Base' );
const ErrorSourceModel = use( 'App/Models/ErrorSource' );
const UrlErrorRelationshipModel = use( 'App/Models/UrlErrorRelationship' );

const ExtensionVersionValidator = use( 'App/Validators/ExtensionVersion' );
const _ = require( 'underscore' );

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

	/**
	 * Primary key of the table.
	 *
	 * @returns {string} primary key name.
	 */
	static getPrimaryValue( data ) {

		if ( ! _.has( data, 'type' ) ||
			 ! _.has( data, 'slug' ) ||
			 ! _.has( data, 'version' )
		) {
			return '';
		}

		if ( _.isEmpty( data.type ) || _.isEmpty( data.slug ) || _.isEmpty( data.version ) ) {
			return '';
		}

		const version = data
			.version
			.toString()
			.trim()
			.toLowerCase()
			.replace( /[.]+/g, '-' )
			.replace( /[\s]+/g, '' );

		return `${ data.type }-${ data.slug }-${ version }`;
	}

	/**
	 * Validator class name, To verify the data.
	 *
	 * @returns {boolean|Object} Validator class.
	 */
	static get validator() {
		return ExtensionVersionValidator;
	}

	/**
	 * Query argument for data that need to send in BigQuery.
	 *
	 * @return {{}}
	 */
	static getBigqueryQueryArgs() {
		return {};
	}

	/**
	 * Default values for each field.
	 *
	 * @returns {{}} default values.
	 */
	static get defaults() {
		return {
			error_count: 0,
			has_synthetic_data: false,
			verification_status: 'unknown',
		};
	}

	/**
	 * To get extension version detail from extension detail.
	 *
	 * @param {Object} extensionDetail Extension details.
	 *
	 * @returns {boolean|Object} Extension version detail.
	 */
	static getItemFromExtension( extensionDetail ) {

		if ( _.isEmpty( extensionDetail ) || ! _.has( extensionDetail, 'extension_slug' ) ) {
			return false;
		}

		const data = {
			type: extensionDetail.type,
			slug: extensionDetail.slug,
			version: extensionDetail.latest_version.toString(),
			extension_slug: extensionDetail.extension_slug,
		};

		data.extension_version_slug = this.getPrimaryValue( data );

		return data;
	}


	/**
	 * To get table rows with error count.
	 *
	 * @param {Object} extensionVersionSlugs Slug of extension versions.
	 *
	 * @return {Promise<{}|*[]>}
	 */
	static async getRowsWithErrorCount( extensionVersionSlugs ) {

		if ( _.isEmpty( extensionVersionSlugs ) || ! _.isArray( extensionVersionSlugs ) ) {
			return [];
		}

		const errorSourceTable = '`' + `${ ErrorSourceModel.table }` + '`';
		const extensionVersionTable = '`' + `${ this.table }` + '`';
		const urlErrorRelationshipTable = '`' + `${ UrlErrorRelationshipModel.table }` + '`';
		const preparedExtensionVersionSlugs = _.map( extensionVersionSlugs, this._prepareValueForDB );

		let query = '';
		let queryObject = {
			select: 'SELECT extension_versions.extension_version_slug, extension_versions.slug, extension_versions.version, count( DISTINCT url_error_relationships.error_slug ) AS error_count, extension_versions.verification_status, extension_versions.has_synthetic_data',
			from: `FROM ${ extensionVersionTable } AS extension_versions ` +
				  `LEFT JOIN ${ errorSourceTable } AS error_sources ON extension_versions.extension_version_slug = error_sources.extension_version_slug ` +
				  `LEFT JOIN ${ urlErrorRelationshipTable } AS url_error_relationships ON url_error_relationships.error_source_slug = error_sources.error_source_slug `,
			where: `WHERE extension_versions.extension_version_slug IN ( ${ preparedExtensionVersionSlugs.join( ', ' ) } )`,
			groupby: 'GROUP BY extension_versions.extension_version_slug, extension_versions.slug, extension_versions.version, extension_versions.type, extension_versions.verification_status, extension_versions.has_synthetic_data',
		};

		for ( const index in queryObject ) {
			query += `\n ${ queryObject[ index ] }`;
		}

		const [ items ] = await Database.raw( query );
		const preparedItems = {};

		for ( const index in items ) {
			const item = items[ index ];
			preparedItems[ item[ this.primaryKey ] ] = item;
		}

		return preparedItems;
	}

	/**
	 * To update error count for current record.
	 *
	 * @return {Promise<void>}
	 */
	async updateErrorCount() {

		this.error_count = await this.constructor.getErrorCount( this.extension_version_slug );

		return ( await this.save() );
	}

	/**
	 * To get error count by extension version slug.
	 *
	 * @param {String} extensionVersionSlug
	 *
	 * @return {Promise<number|*|*|number>}
	 */
	static async getErrorCount( extensionVersionSlug ) {

		const query = `SELECT count( DISTINCT error_slug ) as error_count \n` +
		              `FROM url_error_relationships LEFT JOIN error_sources ON url_error_relationships.error_source_slug = error_sources.error_source_slug \n` +
		              `WHERE error_sources.extension_version_slug = '${ extensionVersionSlug }';`;

		const [ result ] = await Database.raw( query );

		return parseInt( result[ 0 ].error_count ) || 0;
	}
}

module.exports = ExtensionVersion;
