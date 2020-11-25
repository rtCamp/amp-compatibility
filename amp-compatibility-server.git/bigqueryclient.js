const { BigQuery } = require( '@google-cloud/bigquery' );

class BigQueryClient {

	constructor( options ) {

		this.projectId = options.projectId;
		this.dataset = options.dataset;
		this.options = options;
		this.client = new BigQuery( options );
	}

	/**
	 * To execute Query in BigQuery.
	 *
	 * @param {string} query ex "INSERT INTO `table` VALUES (1,2,3); INSERT INTO `table` VALUES (1,2,3);"
	 *
	 * @returns {Promise<void>}
	 */
	async query( query ) {

		// For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
		const options = {
			query: query,
			// Location must match that of the dataset(s) referenced in the query.
			//location: 'US',
		};

		// Run the query as a job
		const [ job ] = await this.client.createQueryJob( options );
		console.log( `Job ${ job.id } started.` );

		// Wait for the query to finish
		const [ rows ] = await job.getQueryResults();

		return rows;
	}

	getInsertQuery( table, data ) {
		const table_name = `${ this.projectId }.${ this.dataset }.${ table }`;

		for ( let key in data ) {
			if ( 'UUID' !== key && 'string' === typeof data[ key ] ) {
				data[ key ] = `'${ data[ key ] }'`;
			}
			if ( 'UUID' === key ) {
				data[ key ] = 'GENERATE_UUID()';
			}
		}

		const keys = Object.keys( data ).join( ', ' );
		const values = Object.values( data ).join( ', ' );

		const query = 'INSERT INTO `' + table_name + '` ( ' + keys + ' ) VALUES ( ' + values + ' );';

		return query;
	}

	async insert( table, data ) {

		const query = getInsertQuery( table, data );
		const result = await this.query( query );

	}

}

exports.BigQueryClient = BigQueryClient;
