const { BigQuery: BigQueryClient } = require( '@google-cloud/bigquery' );
const Helpers = use( 'Helpers' );
const _ = require( 'underscore' );

class BigQuery {

	/**
	 * Construct method to create object
	 *
	 * @param config
	 */
	constructor( config ) {

		if ( ! _.isObject( config ) || _.isEmpty( config.projectId ) || _.isEmpty( config.dataset ) || _.isEmpty( config.keyFilename ) ) {
			return;
		}

		config.keyFilename = Helpers.appRoot( `private/${ config.keyFilename }` );

		this.config = config;

		this.client = new BigQueryClient( this.config );
	}

	get dataset() {
		return this.client.dataset( this.config.dataset );
	}

	/**
	 * To execute Query in BigQuery.
	 *
	 * @param {string} query ex "INSERT INTO `table` VALUES (1,2,3);
	 *
	 * @return {Promise<object>}
	 */
	async query( query ) {
		// For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
		const options = {
			query: query,
		};

		// Run the query as a job
		const [ job ] = await this.client.createQueryJob( options );

		// Wait for the query to finish
		const [ response ] = await job.getQueryResults();

		return response;
	}

	/**
	 * To create dataset in BigQuery.
	 *
	 * @param {String} datasetName Dataset name.
	 *
	 * @returns {Promise<[Response]|boolean>}
	 */
	async createDataset( datasetName ) {

		if ( _.isEmpty( datasetName ) ) {
			return false;
		}

		let response = false;
		let hadError = false;

		try {
			const [ dataset ] = await this.client.createDataset( datasetName );
		} catch ( e ) {
			hadError = true;
			response = e.errors;
		}

		return hadError ? response : true;
	}

	/**
	 * To create table in BigQuery.
	 *
	 * References:
	 * Table Schema: https://cloud.google.com/bigquery/docs/reference/rest/v2/tables#tableschema
	 *
	 * @param {String} tableName Table name.
	 * @param {Object} schema Schema for table.
	 *
	 * @returns {Promise<Table|boolean>}
	 */
	async createTable( tableName, schema ) {

		if ( _.isEmpty( tableName ) || _.isEmpty( tableName ) || ! _.isObject( schema ) ) {
			return false;
		}

		const options = {
			schema: schema,
		};

		let response = false;
		let hadError = false;

		try {
			const [ table ] = await this.dataset.createTable( tableName, options );
		} catch ( e ) {
			hadError = true;
			response = e.errors;
		}

		return hadError ? response : true;
	}

	/**
	 * To drop dataset in BigQuery
	 *
	 * @param {String} datasetName Dataset name.
	 *
	 * @returns {Promise<[Response]|boolean>}
	 */
	async dropDataset( datasetName ) {

		if ( _.isEmpty( datasetName ) ) {
			return false;
		}

		let response = false;
		let hadError = false;

		try {
			await this.dataset.dataset( datasetName ).delete( { force: true } );
		} catch ( e ) {
			hadError = true;
			response = e.errors;
		}

		return hadError ? response : true;
	}

	/**
	 * To drop table in BigQuery
	 *
	 * @param {String} tableName Table name.
	 *
	 * @returns {Promise<[Response]|boolean>}
	 */
	async dropTable( tableName ) {

		if ( _.isEmpty( tableName ) ) {
			return false;
		}

		let response = false;
		let hadError = false;

		try {
			await this.dataset.table( tableName ).delete()
		} catch ( e ) {
			hadError = true;
			response = e.errors;
		}

		return hadError ? response : true;
	}

}

module.exports = BigQuery;
